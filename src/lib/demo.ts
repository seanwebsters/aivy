import "server-only";
import { buildOpportunities } from "./analysis/pipeline";
import { heuristicProfile } from "./analysis/heuristic";
import { questionsFor } from "./industries";
import { getAnalysis, getEntitlement, grantEntitlement, saveAnalysis } from "./store";
import type { Analysis, SiteSnapshot } from "./types";

/** A fictional sample business used for the public demo. */
export const DEMO_ID = "demo-riverside-cafe";

const site: SiteSnapshot = {
  url: "https://riverside-cafe.example",
  finalUrl: "https://riverside-cafe.example/",
  fetchedVia: "demo",
  title: "Riverside Café | Brunch, coffee & riverside dining in Bath",
  description:
    "Independent riverside café in Bath serving seasonal brunch, speciality coffee and homemade cakes. Book a table, order a celebration cake or join us for supper club Fridays.",
  headings: ["Seasonal brunch", "Speciality coffee", "Homemade cakes to order", "Friday supper club", "Private hire", "Book a table", "What our guests say", "Opening hours", "Find us"],
  links: ["Menu", "Book a table", "Cakes", "Supper club", "Private hire", "Gift cards", "Contact"],
  text:
    "Welcome to Riverside Café, an independent café on the river in Bath. Brunch menu served daily. Book a table online through our reservations page. Celebration cakes to order — please allow 72 hours. Friday supper club with a seasonal set menu. Private hire for up to 40 guests. Dog friendly terrace. Vegan and gluten free options — please tell us about allergies. Read our reviews on Google and Tripadvisor. Follow us on Instagram and Facebook. Join our newsletter for seasonal offers. Frequently asked questions: parking, high chairs, accessibility. Contact us using the form below.",
  signals: ["booking system", "menu", "contact form", "faq page", "reviews", "newsletter", "instagram", "facebook"],
};

export async function ensureDemo(): Promise<Analysis> {
  const existing = await getAnalysis(DEMO_ID);
  if (existing && existing.opportunities?.length) {
    if (!(await getEntitlement(DEMO_ID))) await grantDemo();
    return existing;
  }
  const profile = heuristicProfile(site, "riverside-cafe.example");
  profile.name = "Riverside Café";
  profile.location = "Bath, UK";
  profile.summary =
    "Riverside Café is an independent riverside café in Bath serving seasonal brunch, speciality coffee and celebration cakes, with a Friday supper club and private hire.";
  profile.offerings = ["Seasonal brunch", "Speciality coffee", "Celebration cakes to order", "Friday supper club", "Private hire (up to 40)", "Gift cards"];
  const answers = { pain: ["enquiries", "bookings", "social", "reviews"], tools: ["google", "booking", "emailtool"], volume: ["100-500"], team: ["2-10"], comfort: ["medium"] };
  const now = new Date().toISOString();
  const a: Analysis = {
    id: DEMO_ID,
    ownerKey: "*",
    url: site.url,
    domain: "riverside-cafe.example",
    createdAt: now,
    updatedAt: now,
    status: "complete",
    mode: "demo",
    site,
    profile,
    questions: questionsFor("hospitality"),
    answers,
    progress: {
      "faq-assistant": { done: ["collect", "tidy", "install"], startedAt: now },
      "review-responses": { done: ["voice", "prompt", "backlog", "routine", "Reply style agreed", "Prompt saved", "Backlog cleared", "Weekly reminder set"], startedAt: now, completedAt: now },
    },
    outcomes: [
      { id: "o1", playbookId: "review-responses", metric: "Unanswered Google reviews", before: "46", after: "0", note: "Cleared backlog in one afternoon", at: now, verified: false },
    ],
    assistant: { used: 0, limit: 150, flagged: 0 },
    costs: [],
    attempts: 1,
  };
  a.opportunities = buildOpportunities(a).map((o) => {
    if (o.playbookId === "booking-assistant")
      return {
        ...o,
        summary: "Help guests make reservations and answer booking questions 24/7 — sending them straight to your existing reservations page to confirm.",
        whatAiDoes: ["Answers questions about tables, groups, dogs and high chairs", "Sends guests your booking link instead of taking bookings by DM", "Collects details for private hire and supper club enquiries"],
      };
    if (o.playbookId === "social-content")
      return { ...o, title: "AI Marketing Assistant", summary: "Create a month of on-brand posts, supper club promotions and seasonal emails in one sitting." };
    if (o.playbookId === "faq-assistant")
      return { ...o, title: "AI Customer Support", summary: "Answer common questions instantly — parking, allergens policy, cake orders — and pass anything unusual to your team." };
    return o;
  });
  await saveAnalysis(a);
  await grantDemo();
  return a;
}

async function grantDemo() {
  await grantEntitlement({ analysisId: DEMO_ID, ownerKey: "*", source: "demo", sessionId: "demo", amount: 0, currency: "gbp", createdAt: new Date().toISOString() });
}
