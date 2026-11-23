import { INDUSTRIES, getIndustry } from "../industries";
import { QUESTION_BANK } from "../industries";
import type { Answers, BusinessProfile, Fact, Opportunity, Playbook, ScoreBreakdown, SiteSnapshot } from "../types";

/** Deterministic analysis used when no AI provider is configured, and as a fallback. */

export function classifyIndustry(site: SiteSnapshot): string {
  const title = `${site.title} ${site.description}`.toLowerCase();
  const heads = site.headings.join(" ").toLowerCase();
  const text = site.text.toLowerCase();
  let best = { id: "other", score: 0 };
  for (const ind of INDUSTRIES) {
    let s = 0;
    for (const k of ind.keywords) {
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      s += (title.match(re)?.length ?? 0) * 4 + (heads.match(re)?.length ?? 0) * 2 + Math.min(text.match(re)?.length ?? 0, 6);
    }
    if (ind.id === "ecommerce" && site.signals.includes("online shop")) s += 6;
    if (ind.id === "hospitality" && site.signals.includes("menu")) s += 3;
    if (s > best.score) best = { id: ind.id, score: s };
  }
  return best.score >= 5 ? best.id : "other";
}

const GENERIC = /^(home|about|about us|contact|contact us|menu|blog|news|faq|faqs|log ?in|sign ?in|cart|basket|search|privacy|terms|cookies?|follow us|get in touch|our team|welcome|opening hours|find us|subscribe|newsletter)$/i;

export function businessName(site: SiteSnapshot, domain: string): string {
  const raw = site.title.split(/\s[|\-–—:·]\s/)[0]?.trim();
  if (raw && raw.length >= 2 && raw.length <= 60 && !/^home$/i.test(raw)) return raw;
  const base = domain.replace(/^www\./, "").split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function heuristicProfile(site: SiteSnapshot, domain: string): BusinessProfile {
  const industry = classifyIndustry(site);
  const ind = getIndustry(industry);
  const name = businessName(site, domain);
  const offerings = site.headings.filter((h) => !GENERIC.test(h.trim()) && h.split(" ").length <= 8).slice(0, 8);

  const facts: Fact[] = [];
  const has = (s: string) => site.signals.includes(s);
  if (has("booking system")) facts.push({ statement: "Customers can book online", source: "website", evidence: "Booking link or widget found on your site" });
  if (has("online shop")) facts.push({ statement: "You sell online", source: "website", evidence: "Shopping cart or checkout found" });
  if (has("menu")) facts.push({ statement: "Your menu or price list is published online", source: "website", evidence: "Menu section found" });
  if (has("contact form")) facts.push({ statement: "Customers can contact you through a web form", source: "website", evidence: "Contact form found" });
  if (has("faq page")) facts.push({ statement: "You already publish answers to common questions", source: "website", evidence: "FAQ content found" });
  if (has("reviews")) facts.push({ statement: "Reviews or testimonials matter to your customers", source: "website", evidence: "Review or testimonial content found" });
  if (has("newsletter")) facts.push({ statement: "You collect email sign-ups", source: "website", evidence: "Newsletter sign-up found" });
  if (has("live chat")) facts.push({ statement: "You already offer website chat", source: "website", evidence: "Chat widget detected" });
  if (has("quote request")) facts.push({ statement: "You offer quotes or estimates", source: "website", evidence: "Quote request found" });
  const socials = ["instagram", "facebook", "tiktok", "linkedin"].filter(has);
  if (socials.length) facts.push({ statement: `You're active on ${list(socials.map(cap))}`, source: "website", evidence: "Social profile links found" });
  facts.push({ statement: "Your internal processes, costs and staffing aren't visible from your website", source: "assumption" });

  const journey: string[] = [];
  if (socials.length) journey.push(`Discovers you on ${cap(socials[0])} or search`);
  else journey.push("Discovers you through search or word of mouth");
  journey.push(has("menu") ? "Browses your menu and prices online" : has("online shop") ? "Browses products in your online shop" : "Reads about your services on your website");
  if (has("booking system")) journey.push("Books online");
  else if (has("quote request")) journey.push("Requests a quote");
  else if (has("online shop")) journey.push("Orders online");
  else journey.push("Gets in touch by phone, email or form");
  if (has("reviews")) journey.push("Leaves a review");

  const channels = ["Website", ...socials.map(cap)];
  if (has("newsletter")) channels.push("Email newsletter");
  if (has("contact form")) channels.push("Contact form");

  return {
    name,
    industry,
    industryLabel: ind.label,
    summary:
      site.description ||
      `${name} is a ${ind.label.toLowerCase()} business. We built this profile from the public information on your website.`,
    offerings,
    customerJourney: journey,
    channels: Array.from(new Set(channels)),
    facts,
    regulatedNote: ind.regulated,
  };
}

export function heuristicOpportunity(
  p: Playbook,
  profile: BusinessProfile,
  score: ScoreBreakdown,
  signals: string[],
  answers?: Answers,
): Opportunity {
  const reasons: string[] = [];
  if (score.fit >= 4) reasons.push(`it's one of the strongest uses of AI for ${profile.industryLabel.toLowerCase()} businesses`);
  const pains = answers?.pain ?? [];
  const painLabel = QUESTION_BANK.pain.options.find((o) => pains.includes(o.id) && p.painPoints.includes(o.id))?.label;
  if (painLabel) reasons.push(`you told us "${painLabel.toLowerCase()}" takes up your time`);
  if (score.readiness >= 5) reasons.push("you already use the tools it builds on");
  if (score.ease >= 5) reasons.push("it's quick to set up");
  const rationale = reasons.length ? `Recommended because ${list(reasons)}.` : "A solid, low-risk use of AI for a business like yours.";
  return {
    playbookId: p.id,
    title: p.title,
    summary: p.solution,
    whatAiDoes: p.whatAiDoes,
    benefit: p.benefit,
    difficulty: p.difficulty,
    limitations: p.limitations,
    rationale,
    evidence: signals.map((s) => `Your website mentions “${s}”`),
    score,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
