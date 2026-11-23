import { getIndustry } from "./industries";
import { PLAYBOOKS } from "./playbooks";
import type { Answers, Playbook, ScoreBreakdown, SiteSnapshot } from "./types";

/**
 * Transparent impact score. Every number shown to a customer can be
 * explained by the criteria below — no invented percentages or savings.
 *
 *   Fit        35%  How well this use case suits your industry and what's on your website
 *   Need       30%  Whether you told us this area takes up your time
 *   Readiness  20%  Whether you already have the tools it builds on
 *   Ease       15%  How simple it is to set up
 *   Risk            Deducted for regulated or sensitive-data contexts
 */
export const SCORE_WEIGHTS = { fit: 0.35, need: 0.3, readiness: 0.2, ease: 0.15 } as const;

export const SCORE_CRITERIA = [
  { key: "fit", label: "Business fit", help: "How well this suits your industry and what we found on your website." },
  { key: "need", label: "Your priorities", help: "Whether you told us this area takes up your time." },
  { key: "readiness", label: "Readiness", help: "Whether you already have the tools it builds on." },
  { key: "ease", label: "Ease", help: "How quickly a non-technical owner can set it up." },
] as const;

/** Tools (question option ids) a playbook relies on. */
const REQUIRES: Record<string, string[]> = {
  "booking-assistant": ["booking"],
  "email-marketing": ["emailtool"],
  "invoice-extraction": ["accounting"],
  "enquiry-triage": ["google", "microsoft"],
  "product-descriptions": ["ecommerce"],
  "lead-qualification": ["crm", "google", "microsoft"],
};

const ENQUIRY_DRIVEN = new Set(["faq-assistant", "enquiry-triage", "booking-assistant", "lead-qualification"]);
const CUSTOMER_FACING = new Set(["faq-assistant", "booking-assistant", "enquiry-triage", "review-responses"]);

export function matchedSignals(p: Playbook, site?: SiteSnapshot): string[] {
  if (!site) return [];
  const hay = `${site.title} ${site.description} ${site.headings.join(" ")} ${site.text} ${site.signals.join(" ")}`.toLowerCase();
  return p.signals.filter((s) => hay.includes(s.toLowerCase())).slice(0, 4);
}

export function scorePlaybook(p: Playbook, industryId: string, site?: SiteSnapshot, answers?: Answers): ScoreBreakdown {
  const ind = getIndustry(industryId);
  const indFit = ind.fit[p.id] ?? 1;
  const signals = matchedSignals(p, site);
  const fit = Math.min(5, (indFit / 3) * 4 + (signals.length ? 1 : 0));

  const pains = answers?.pain ?? [];
  let need = pains.length === 0 ? 2.5 : p.painPoints.some((x) => pains.includes(x)) ? 5 : 1.5;
  const volume = answers?.volume?.[0];
  if (ENQUIRY_DRIVEN.has(p.id) && volume) {
    if (volume === "lt20") need -= 1;
    if (volume === "100-500" || volume === "500+") need += 1;
  }
  need = clamp(need, 0, 5);

  const comfort = answers?.comfort?.[0];
  let ease = p.difficulty === 1 ? 5 : p.difficulty === 2 ? 3 : 1;
  if (comfort === "low" && p.difficulty > 1) ease -= 1;
  if (comfort === "high") ease += 0.5;
  ease = clamp(ease, 0, 5);

  const tools = answers?.tools ?? [];
  const req = REQUIRES[p.id];
  let readiness = 3;
  if (req) {
    const has = req.some((r) => tools.includes(r)) || (p.id === "booking-assistant" && site?.signals.includes("booking system")) || (p.id === "product-descriptions" && (site?.signals.includes("online shop") || site?.signals.includes("menu")));
    readiness = has ? 5 : tools.length ? 1.5 : 2.5;
  }

  let risk = 0;
  const sensitive = answers?.sensitive?.[0];
  if (ind.regulated) risk += CUSTOMER_FACING.has(p.id) ? 2 : 1;
  if (sensitive === "yes" && CUSTOMER_FACING.has(p.id)) risk += 1;

  const weighted = SCORE_WEIGHTS.fit * fit + SCORE_WEIGHTS.need * need + SCORE_WEIGHTS.readiness * readiness + SCORE_WEIGHTS.ease * ease;
  const total = Math.round(clamp((weighted / 5) * 100 - risk * 4, 0, 100));
  return { fit: r1(fit), need: r1(need), ease: r1(ease), readiness: r1(readiness), risk, total };
}

/** Rank the library for a business. Excludes unsuitable playbooks. */
export function rankPlaybooks(industryId: string, site?: SiteSnapshot, answers?: Answers) {
  const ind = getIndustry(industryId);
  return PLAYBOOKS.filter((p) => {
    const f = ind.fit[p.id] ?? 1;
    if (f === 0) return matchedSignals(p, site).length >= 2; // only if strong evidence
    if (!p.suitableFor.includes("*") && !p.suitableFor.includes(industryId) && f < 2) return false;
    return true;
  })
    .map((p) => ({ playbook: p, score: scorePlaybook(p, industryId, site, answers), signals: matchedSignals(p, site) }))
    .sort((a, b) => b.score.total - a.score.total);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const r1 = (n: number) => Math.round(n * 10) / 10;
