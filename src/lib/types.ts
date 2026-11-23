import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Playbooks — the validated implementation library                   */
/* ------------------------------------------------------------------ */

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Easy",
  2: "Moderate",
  3: "Advanced",
};

export type BenefitType =
  | "Time saved"
  | "Faster response"
  | "More bookings"
  | "More sales"
  | "Better insight"
  | "Fewer errors"
  | "Consistency";

export interface PlaybookTool {
  name: string;
  role: string;
  /** Indicative pricing — always verify on the vendor's site. */
  pricing: string;
  url: string;
}

export interface PlaybookStep {
  id: string;
  title: string;
  body: string;
  details?: string[];
}

export interface PlaybookTemplate {
  id: string;
  title: string;
  kind: "prompt" | "email" | "message" | "policy" | "checklist";
  body: string;
}

export interface Playbook {
  id: string;
  title: string;
  icon: string; // lucide icon key, see components/icon.tsx
  category: "Customers" | "Marketing" | "Sales" | "Operations" | "Knowledge";
  problem: string;
  solution: string;
  whatAiDoes: string[];
  benefit: BenefitType;
  difficulty: Difficulty;
  setupTime: string;
  suitableFor: string[]; // industry ids, or "*" for all
  prerequisites: string[];
  tools: PlaybookTool[];
  monthlyCost: { low: number; high: number; note: string };
  steps: PlaybookStep[];
  templates: PlaybookTemplate[];
  testing: string[];
  security: string[];
  checklist: string[];
  limitations: string[];
  /** The first question Ask Aivy asks before guiding setup. */
  kickoffQuestion: string;
  /** Words on a website that suggest this playbook fits. */
  signals: string[];
  /** Which answers (question option ids) make this more relevant. */
  painPoints: string[];
  /** "guided" = step-by-step instructions only. No auto-deploy claims. */
  integration: "guided";
}

/* ------------------------------------------------------------------ */
/*  Industries                                                         */
/* ------------------------------------------------------------------ */

export interface Industry {
  id: string;
  label: string;
  keywords: string[];
  /** 0 = not suitable, 3 = excellent fit */
  fit: Record<string, 0 | 1 | 2 | 3>;
  regulated?: string; // note shown when regulated
}

/* ------------------------------------------------------------------ */
/*  Analysis                                                           */
/* ------------------------------------------------------------------ */

export type AnalysisStatus =
  | "queued"
  | "fetching"
  | "profiling"
  | "awaiting_answers"
  | "recommending"
  | "complete"
  | "failed";

export const FactSchema = z.object({
  statement: z.string().min(1).max(300),
  source: z.enum(["website", "answer", "assumption"]),
  evidence: z.string().max(300).optional(),
});
export type Fact = z.infer<typeof FactSchema>;

export const BusinessProfileSchema = z.object({
  name: z.string().min(1).max(120),
  industry: z.string(),
  industryLabel: z.string(),
  summary: z.string().max(600),
  offerings: z.array(z.string().max(120)).max(12),
  customerJourney: z.array(z.string().max(160)).max(8),
  channels: z.array(z.string().max(60)).max(12),
  facts: z.array(FactSchema).max(20),
  regulatedNote: z.string().max(400).optional(),
  location: z.string().max(120).optional(),
});
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

export interface Question {
  id: string;
  prompt: string;
  why: string;
  kind: "single" | "multi";
  options: { id: string; label: string }[];
}

export type Answers = Record<string, string[]>;

export interface ScoreBreakdown {
  fit: number; // 0-5
  need: number; // 0-5
  ease: number; // 0-5
  readiness: number; // 0-5
  risk: number; // 0-5 penalty
  total: number; // 0-100
}

export interface Opportunity {
  playbookId: string;
  title: string;
  summary: string;
  whatAiDoes: string[];
  benefit: BenefitType;
  difficulty: Difficulty;
  limitations: string[];
  rationale: string;
  evidence: string[];
  score: ScoreBreakdown;
}

export interface CostEvent {
  at: string;
  provider: string;
  model: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
}

export interface SiteSnapshot {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
  signals: string[];
  fetchedVia: "direct" | "firecrawl" | "demo";
}

export interface StepProgress {
  done: string[]; // step ids + checklist ids
  startedAt?: string;
  completedAt?: string;
}

export interface Outcome {
  id: string;
  playbookId: string;
  metric: string;
  before?: string;
  after?: string;
  note?: string;
  at: string;
  verified: false; // user-entered; never displayed as verified
}

export interface Analysis {
  id: string;
  ownerKey: string;
  url: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  status: AnalysisStatus;
  error?: string;
  mode: "ai" | "heuristic" | "demo";
  site?: SiteSnapshot;
  profile?: BusinessProfile;
  questions?: Question[];
  answers?: Answers;
  opportunities?: Opportunity[];
  progress: Record<string, StepProgress>;
  outcomes: Outcome[];
  assistant: { used: number; limit: number; flagged: number };
  costs: CostEvent[];
  email?: string;
  attempts: number;
}

export interface Entitlement {
  analysisId: string;
  ownerKey: string;
  source: "stripe" | "simulated" | "demo";
  sessionId: string;
  amount: number;
  currency: string;
  email?: string;
  createdAt: string;
  refundedAt?: string;
}

export interface CheckoutSession {
  id: string;
  analysisId: string;
  ownerKey: string;
  provider: "stripe" | "simulated";
  status: "open" | "paid" | "expired";
  amount: number;
  currency: string;
  createdAt: string;
  email?: string;
}

export interface AppEvent {
  at: string;
  level: "info" | "warn" | "error";
  type: string;
  message: string;
  analysisId?: string;
}
