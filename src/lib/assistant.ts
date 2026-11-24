import "server-only";
import { aiConfig, generateText } from "./ai/provider";
import { PLAYBOOKS, getPlaybook, personalise } from "./playbooks";
import type { Analysis, Playbook } from "./types";

/**
 * Ask Aivy — retrieval-grounded assistant.
 * Answers are built from the approved playbook library plus the customer's
 * own report. With an AI provider configured, the model rephrases and
 * converses using ONLY the retrieved content; without one, a deterministic
 * guide responds directly from the library.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
export interface Source {
  playbookId: string;
  label: string;
}
export interface AssistantReply {
  reply: string;
  sources: Source[];
  escalated: boolean;
}

interface Chunk {
  playbookId: string;
  label: string;
  text: string;
  tokens: Set<string>;
}

const STOP = new Set("a an the and or to of in on for with my our we i you your is are be do does how what can it this that me set up setup use get help about which".split(" "));
const tok = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

const ALIASES: Record<string, string[]> = {
  "booking-assistant": ["booking", "bookings", "reservation", "reservations", "appointment", "appointments", "table"],
  "faq-assistant": ["faq", "chatbot", "chat", "questions", "support", "widget"],
  "social-content": ["social", "instagram", "facebook", "tiktok", "posts", "marketing"],
  "email-marketing": ["newsletter", "campaign", "mailchimp", "promotional"],
  "review-responses": ["review", "reviews", "google", "tripadvisor"],
  "enquiry-triage": ["inbox", "triage", "emails", "enquiries"],
  "invoice-extraction": ["invoice", "invoices", "receipts", "xero", "quickbooks", "accounts"],
  "meeting-summaries": ["meeting", "meetings", "notes", "transcribe"],
  "knowledge-assistant": ["staff", "handbook", "procedures", "onboarding", "sop"],
  "quote-drafting": ["quote", "quotes", "proposal", "estimate"],
  "lead-qualification": ["leads", "lead", "qualify", "crm"],
  "product-descriptions": ["product", "products", "descriptions", "shopify", "seo"],
  "reporting-automation": ["report", "reporting", "numbers", "metrics", "kpi"],
  "feedback-analysis": ["feedback", "survey", "themes"],
  "document-summaries": ["document", "documents", "contract", "summarise", "tender"],
  "sales-followup": ["follow", "followup", "chase"],
};

let INDEX: Chunk[] | null = null;
function index(): Chunk[] {
  if (INDEX) return INDEX;
  const chunks: Chunk[] = [];
  const add = (p: Playbook, label: string, text: string) => chunks.push({ playbookId: p.id, label, text, tokens: tok(`${p.title} ${(ALIASES[p.id] ?? []).join(" ")} ${text}`) });
  for (const p of PLAYBOOKS) {
    add(p, `${p.title} — overview`, `${p.problem} ${p.solution} Prerequisites: ${p.prerequisites.join("; ")}. Tools: ${p.tools.map((t) => `${t.name} (${t.role}; ${t.pricing})`).join("; ")}. Typical monthly software cost £${p.monthlyCost.low}–£${p.monthlyCost.high}. Setup time ${p.setupTime}.`);
    p.steps.forEach((s, i) => add(p, `${p.title} — step ${i + 1}: ${s.title}`, `${s.title}. ${s.body} ${(s.details ?? []).join(". ")}`));
    p.templates.forEach((t) => add(p, `${p.title} — template: ${t.title}`, `${t.title}: ${t.body}`));
    add(p, `${p.title} — testing`, `How to test: ${p.testing.join(". ")}`);
    add(p, `${p.title} — privacy & security`, `Security and privacy: ${p.security.join(". ")} Limitations: ${p.limitations.join(". ")}`);
  }
  INDEX = chunks;
  return chunks;
}

export function retrieve(query: string, a: Analysis, k = 5): Chunk[] {
  const q = tok(query);
  const recommended = new Set((a.opportunities ?? []).map((o) => o.playbookId));
  return index()
    .map((c) => {
      let s = 0;
      q.forEach((w) => c.tokens.has(w) && (s += 1));
      if (s > 0 && recommended.has(c.playbookId)) s += 0.5;
      return { c, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.c);
}

function detectPlaybook(text: string): Playbook | undefined {
  const q = tok(text);
  let best: { id: string; s: number } | undefined;
  for (const [id, words] of Object.entries(ALIASES)) {
    const s = words.filter((w) => q.has(w)).length;
    if (s && (!best || s > best.s)) best = { id, s };
  }
  return best ? getPlaybook(best.id) : undefined;
}

const ESCALATE = /\b(refund|charge[ds]?|billing|invoice from aivy|cancel my|money back|complain|complaint about aivy|delete my (data|account)|gdpr request|lawyer|legal action)\b/i;
const SUPPORT = process.env.AIVY_SUPPORT_EMAIL ?? "support@aivy.ai";

export async function respond(a: Analysis, message: string, history: ChatMessage[]): Promise<AssistantReply> {
  if (ESCALATE.test(message)) {
    return {
      reply: `That's one for our support team rather than me. Email ${SUPPORT} with your business name and they'll sort it — refunds within 14 days of purchase are handled with no fuss. I've flagged this conversation so it doesn't get lost.`,
      sources: [],
      escalated: true,
    };
  }
  const chunks = retrieve(`${message} ${history.slice(-2).map((m) => m.content).join(" ")}`, a);
  const sources = dedupeSources(chunks);
  if (aiConfig()) {
    try {
      const reply = await aiReply(a, message, history, chunks);
      return { reply, sources, escalated: false };
    } catch {
      /* fall through to deterministic guide */
    }
  }
  return { reply: guideReply(a, message, history, chunks), sources, escalated: false };
}

function dedupeSources(chunks: Chunk[]): Source[] {
  const seen = new Set<string>();
  return chunks.filter((c) => !seen.has(c.playbookId) && seen.add(c.playbookId)).slice(0, 3).map((c) => ({ playbookId: c.playbookId, label: getPlaybook(c.playbookId)!.title }));
}

function vars(a: Analysis) {
  return { business_name: a.profile?.name, industry: a.profile?.industryLabel.toLowerCase() };
}

function guideReply(a: Analysis, message: string, history: ChatMessage[], chunks: Chunk[]): string {
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const lastLower = lastAssistant.toLowerCase();
  const awaiting = PLAYBOOKS.find((p) => lastLower.includes(p.kickoffQuestion.toLowerCase()));
  if (awaiting) {
    const done = new Set(a.progress[awaiting.id]?.done ?? []);
    const next = awaiting.steps.find((s) => !done.has(s.id)) ?? awaiting.steps[0];
    const idx = awaiting.steps.indexOf(next) + 1;
    return `Perfect, thanks — that helps. Here's where to start.\n\n**Step ${idx}: ${next.title}**\n${next.body}${next.details ? `\n${next.details.map((d) => `• ${d}`).join("\n")}` : ""}\n\nTell me when that's done (or if you get stuck) and we'll move to the next step. You can also tick it off in your ${awaiting.title} guide.`;
  }
  const pb = detectPlaybook(message) ?? (chunks[0] ? getPlaybook(chunks[0].playbookId) : undefined);
  const wantsSetup = /\b(set ?up|start|install|begin|implement|how do i|how to|help me)\b/i.test(message);
  if (pb && wantsSetup) {
    const inPlan = a.opportunities?.some((o) => o.playbookId === pb.id);
    return `I can guide you through that${inPlan ? " — it's in your roadmap" : ""}. It usually takes ${pb.setupTime} and costs roughly £${pb.monthlyCost.low}–£${pb.monthlyCost.high}/month in third-party tools.\n\nFirst, ${pb.kickoffQuestion.charAt(0).toLowerCase()}${pb.kickoffQuestion.slice(1)}`;
  }
  if (pb && /\b(template|prompt|wording|write)\b/i.test(message) && pb.templates[0]) {
    const t = pb.templates[0];
    return `Here's the **${t.title}** from your toolkit, already personalised:\n\n${personalise(t.body, vars(a))}\n\nReplace anything in [square brackets] with your details.`;
  }
  if (pb && /\b(safe|privacy|gdpr|data|secure|risk)\b/i.test(message)) {
    return `Good question. For ${pb.title}:\n${pb.security.map((s) => `• ${s}`).join("\n")}\n\nAnd worth knowing:\n${pb.limitations.map((s) => `• ${s}`).join("\n")}`;
  }
  if (pb && /\b(cost|price|how much|expensive|budget)\b/i.test(message)) {
    return `${pb.title} typically costs £${pb.monthlyCost.low}–£${pb.monthlyCost.high}/month in third-party tools${pb.monthlyCost.note ? ` (${pb.monthlyCost.note.toLowerCase()})` : ""}.\n\n${pb.tools.map((t) => `• **${t.name}** — ${t.pricing}`).join("\n")}\n\nPrices change, so always confirm on the vendor's site before you sign up.`;
  }
  if (chunks[0]) {
    const c = chunks[0];
    return `Here's what I've got from your **${getPlaybook(c.playbookId)!.title}** guide:\n\n${clip(personalise(c.text, vars(a)), 600)}\n\nWould you like me to walk you through setting it up step by step?`;
  }
  const top = a.opportunities?.[0];
  return `I'm best at helping you put your AI plan into action. ${top ? `A great place to start is **${top.title}** — want me to guide you through it?` : ""} You can ask things like “How do I set up the booking assistant?” or “Is this safe for customer data?”`;
}

async function aiReply(a: Analysis, message: string, history: ChatMessage[], chunks: Chunk[]) {
  const p = a.profile!;
  const progress = Object.entries(a.progress)
    .map(([id, s]) => `${getPlaybook(id)?.title}: ${s.completedAt ? "complete" : `${s.done.length} items done`}`)
    .join("; ");
  const system = `You are Aivy, a friendly, expert AI implementation guide inside a customer's dashboard.
Business: ${p.name} (${p.industryLabel}). ${p.summary}
Their roadmap: ${(a.opportunities ?? []).map((o, i) => `${i + 1}. ${o.title}`).join("; ")}.
Progress: ${progress || "not started"}.
${p.regulatedNote ? `Regulatory note: ${p.regulatedNote}` : ""}
Rules:
- Use ONLY the approved guide content below for instructions, tools and prices. If it isn't covered, say so and suggest the closest supported playbook.
- Guide in small steps: give at most one step at a time and ask one clarifying question when needed (e.g. which system they use).
- Never claim you can install, connect or configure anything for them. Never invent prices, savings or features.
- No medical, legal or financial advice. For billing, refunds or account issues, direct them to ${SUPPORT}.
- Warm, concise, British English. Under 160 words. Use **bold** for step titles.
Approved guide content:
${chunks.map((c) => `[${c.label}] ${personalise(c.text, vars(a))}`).join("\n")}`;
  const convo = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Customer" : "Aivy"}: ${m.content}`)
    .join("\n");
  return generateText({ system, user: `${convo}\nCustomer: ${message}\nAivy:`, purpose: "assistant", costs: a.costs, maxTokens: 700 });
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trim()}…` : s);
