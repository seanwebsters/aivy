import type { Industry, Question } from "./types";

type Fit = Industry["fit"];
const base = (overrides: Partial<Fit>): Fit => ({
  "faq-assistant": 2,
  "booking-assistant": 0,
  "enquiry-triage": 2,
  "social-content": 2,
  "email-marketing": 2,
  "review-responses": 2,
  "feedback-analysis": 2,
  "lead-qualification": 1,
  "sales-followup": 1,
  "quote-drafting": 0,
  "knowledge-assistant": 1,
  "document-summaries": 1,
  "invoice-extraction": 2,
  "meeting-summaries": 1,
  "product-descriptions": 0,
  "reporting-automation": 2,
  ...overrides,
});

export const INDUSTRIES: Industry[] = [
  {
    id: "hospitality",
    label: "Hospitality",
    keywords: ["restaurant", "cafe", "café", "coffee shop", "cocktail bar", "wine bar", "pub", "bistro", "brunch", "dining", "hotel", "b&b", "bed and breakfast", "bakery", "tapas", "eatery", "book a table", "afternoon tea"],
    fit: base({ "booking-assistant": 3, "faq-assistant": 3, "review-responses": 3, "social-content": 3, "product-descriptions": 2, "feedback-analysis": 3 }),
  },
  {
    id: "retail",
    label: "Retail",
    keywords: ["shop", "store", "boutique", "gifts", "homeware", "florist", "stockist", "in store", "high street"],
    fit: base({ "product-descriptions": 3, "social-content": 3, "email-marketing": 3, "review-responses": 3 }),
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    keywords: ["add to cart", "add to basket", "checkout", "free delivery", "free shipping", "shopify", "woocommerce", "returns", "dispatch", "order online"],
    fit: base({ "product-descriptions": 3, "email-marketing": 3, "faq-assistant": 3, "enquiry-triage": 3, "feedback-analysis": 3, "reporting-automation": 3 }),
  },
  {
    id: "healthcare",
    label: "Healthcare",
    keywords: ["clinic", "dental", "dentist", "physio", "physiotherapy", "gp", "patients", "treatment", "chiropractor", "osteopath", "optician", "pharmacy", "therapy", "counselling", "medical"],
    fit: base({ "booking-assistant": 2, "faq-assistant": 1, "enquiry-triage": 1, "knowledge-assistant": 2, "meeting-summaries": 0, "feedback-analysis": 2 }),
    regulated:
      "Healthcare is regulated. Aivy only recommends non-clinical uses (admin, marketing, scheduling information). AI must never give medical advice, and patient data must not be entered into general AI tools. Check guidance from your regulator (e.g. CQC, GDC, HCPC) and your data protection obligations.",
  },
  {
    id: "trades",
    label: "Construction & Trades",
    keywords: ["builder", "construction", "plumber", "plumbing", "electrician", "electrical", "roofing", "joinery", "kitchens", "bathrooms", "landscaping", "renovation", "extension", "decorating", "heating", "boiler", "installer"],
    fit: base({ "quote-drafting": 3, "lead-qualification": 3, "sales-followup": 3, "review-responses": 2, "booking-assistant": 1, "meeting-summaries": 1 }),
  },
  {
    id: "professional",
    label: "Professional Services",
    keywords: ["accountant", "accountancy", "solicitor", "law firm", "legal", "consultancy", "consulting", "agency", "architect", "surveyor", "bookkeeping", "advisory", "recruitment", "marketing agency"],
    fit: base({ "lead-qualification": 3, "sales-followup": 3, "document-summaries": 3, "meeting-summaries": 3, "knowledge-assistant": 2, "quote-drafting": 2, "booking-assistant": 1 }),
    regulated:
      "Some professional services (legal, financial, accountancy) are regulated. Aivy recommends AI for drafting and admin only — professional advice must always be reviewed by a qualified person, and client confidentiality rules apply to any tool you use.",
  },
  {
    id: "education",
    label: "Education & Training",
    keywords: ["tutor", "tutoring", "school", "nursery", "academy", "courses", "lessons", "training", "classes", "learning", "students"],
    fit: base({ "faq-assistant": 3, "booking-assistant": 2, "email-marketing": 2, "knowledge-assistant": 2, "lead-qualification": 2, "meeting-summaries": 1 }),
    regulated:
      "If you work with children, safeguarding rules apply. Never enter children's personal data into AI tools, and keep a person responsible for all communication with parents and pupils.",
  },
  {
    id: "realestate",
    label: "Real Estate",
    keywords: ["estate agent", "lettings", "property", "properties", "for sale", "to let", "landlord", "valuation", "rentals", "mortgage"],
    fit: base({ "lead-qualification": 3, "sales-followup": 3, "product-descriptions": 2, "enquiry-triage": 3, "document-summaries": 2, "meeting-summaries": 2 }),
  },
  {
    id: "beauty",
    label: "Hair & Beauty",
    keywords: ["salon", "hair", "barber", "beauty", "nails", "lashes", "brows", "spa", "massage", "facial", "aesthetics", "treatments"],
    fit: base({ "booking-assistant": 3, "social-content": 3, "review-responses": 3, "faq-assistant": 3, "email-marketing": 2 }),
  },
  {
    id: "fitness",
    label: "Fitness & Wellbeing",
    keywords: ["gym", "fitness", "yoga", "pilates", "personal trainer", "classes", "membership", "studio", "crossfit", "wellness"],
    fit: base({ "booking-assistant": 3, "social-content": 3, "email-marketing": 3, "faq-assistant": 3, "lead-qualification": 2, "sales-followup": 2 }),
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    keywords: ["manufacturer", "manufacturing", "engineering", "fabrication", "factory", "production", "industrial", "components", "machining", "wholesale"],
    fit: base({ "quote-drafting": 3, "document-summaries": 3, "invoice-extraction": 3, "knowledge-assistant": 3, "lead-qualification": 2, "reporting-automation": 3, "product-descriptions": 2, "social-content": 1 }),
  },
  {
    id: "finance",
    label: "Financial Services",
    keywords: ["financial adviser", "financial advice", "wealth", "insurance broker", "mortgage adviser", "pensions", "investment", "fca"],
    fit: base({ "faq-assistant": 1, "lead-qualification": 1, "document-summaries": 2, "meeting-summaries": 2, "knowledge-assistant": 2, "social-content": 1, "email-marketing": 1 }),
    regulated:
      "Financial services are FCA-regulated. Aivy only recommends internal drafting and admin uses. AI must never give financial advice or communicate financial promotions without compliance approval.",
  },
  {
    id: "other",
    label: "General Business",
    keywords: [],
    fit: base({ "lead-qualification": 2, "sales-followup": 2, "knowledge-assistant": 2, "document-summaries": 2 }),
  },
];

export const INDUSTRY_BY_ID = Object.fromEntries(INDUSTRIES.map((i) => [i.id, i]));

export function getIndustry(id: string): Industry {
  return INDUSTRY_BY_ID[id] ?? INDUSTRY_BY_ID.other;
}

/* ------------------------------------------------------------------ */
/*  Question bank — validated questions that separate fact from guess   */
/* ------------------------------------------------------------------ */

export const QUESTION_BANK: Record<string, Question> = {
  pain: {
    id: "pain",
    prompt: "What takes up the most time each week?",
    why: "Your website can't tell us where your time goes — this lets us rank what matters to you.",
    kind: "multi",
    options: [
      { id: "enquiries", label: "Answering customer questions" },
      { id: "bookings", label: "Managing bookings" },
      { id: "social", label: "Social media & marketing" },
      { id: "email", label: "Emails & follow-ups" },
      { id: "sales", label: "Quotes & winning new work" },
      { id: "reviews", label: "Reviews & feedback" },
      { id: "admin", label: "Admin, invoices & paperwork" },
      { id: "docs", label: "Reading documents & contracts" },
      { id: "reporting", label: "Keeping track of numbers" },
      { id: "knowledge", label: "Training & answering staff questions" },
    ],
  },
  volume: {
    id: "volume",
    prompt: "Roughly how many customer enquiries do you get in a typical week?",
    why: "Some tools only pay off above a certain volume.",
    kind: "single",
    options: [
      { id: "lt20", label: "Fewer than 20" },
      { id: "20-100", label: "20–100" },
      { id: "100-500", label: "100–500" },
      { id: "500+", label: "More than 500" },
    ],
  },
  tools: {
    id: "tools",
    prompt: "Which of these do you already use?",
    why: "We'll only recommend setups that work with what you have.",
    kind: "multi",
    options: [
      { id: "google", label: "Google Workspace / Gmail" },
      { id: "microsoft", label: "Microsoft 365 / Outlook" },
      { id: "booking", label: "An online booking system" },
      { id: "ecommerce", label: "An online shop (Shopify etc.)" },
      { id: "crm", label: "A CRM" },
      { id: "accounting", label: "Accounting software (Xero, QuickBooks…)" },
      { id: "emailtool", label: "An email marketing tool" },
      { id: "none", label: "None of these" },
    ],
  },
  team: {
    id: "team",
    prompt: "How many people work in the business?",
    why: "This shapes which tools are worth the cost.",
    kind: "single",
    options: [
      { id: "solo", label: "Just me" },
      { id: "2-10", label: "2–10" },
      { id: "11-50", label: "11–50" },
      { id: "50+", label: "More than 50" },
    ],
  },
  comfort: {
    id: "comfort",
    prompt: "How comfortable are you setting up new software?",
    why: "We'll put the easiest wins first if you'd prefer.",
    kind: "single",
    options: [
      { id: "low", label: "I'd like it as simple as possible" },
      { id: "medium", label: "Happy to follow clear steps" },
      { id: "high", label: "Confident with tech" },
    ],
  },
  sensitive: {
    id: "sensitive",
    prompt: "Do you handle sensitive personal information (health, financial or children's data)?",
    why: "This changes which AI uses are appropriate for you.",
    kind: "single",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "Not sure" },
    ],
  },
};

export function questionsFor(industryId: string): Question[] {
  const ind = getIndustry(industryId);
  const q = [QUESTION_BANK.pain, QUESTION_BANK.tools, QUESTION_BANK.volume, QUESTION_BANK.comfort];
  if (ind.regulated) q.push(QUESTION_BANK.sensitive);
  else q.splice(3, 0, QUESTION_BANK.team);
  return q.slice(0, 5);
}
