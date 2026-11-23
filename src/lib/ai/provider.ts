import "server-only";
import { apiFetch } from "../net";
import type { z } from "zod";
import type { CostEvent } from "../types";
import { spendToday, recordSpend } from "../store";

/**
 * Provider abstraction for OpenAI and Anthropic.
 * - JSON outputs validated with Zod (one repair retry)
 * - per-call token caps
 * - global daily budget guard (AIVY_DAILY_AI_BUDGET_USD)
 * - cost recorded for every call
 */

export type ProviderName = "openai" | "anthropic";

export interface AiConfig {
  provider: ProviderName;
  model: string;
  inPerM: number; // USD per 1M input tokens (estimate — set via env)
  outPerM: number;
}

export function aiConfig(): AiConfig | null {
  const forced = process.env.AIVY_AI_PROVIDER as ProviderName | undefined;
  if (process.env.AIVY_AI_DISABLED === "true") return null;
  const preferAnthropic = forced === "anthropic" && !!process.env.ANTHROPIC_API_KEY;
  if (process.env.OPENAI_API_KEY && !preferAnthropic) {
    return {
      provider: "openai",
      model: process.env.AIVY_OPENAI_MODEL ?? "gpt-4.1-mini",
      inPerM: Number(process.env.AIVY_PRICE_IN_PER_M ?? 0.4),
      outPerM: Number(process.env.AIVY_PRICE_OUT_PER_M ?? 1.6),
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: process.env.AIVY_ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      inPerM: Number(process.env.AIVY_PRICE_IN_PER_M ?? 3),
      outPerM: Number(process.env.AIVY_PRICE_OUT_PER_M ?? 15),
    };
  }
  return null;
}

export class BudgetExceededError extends Error {}

interface RawResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

async function callOpenAI(cfg: AiConfig, system: string, user: string, json: boolean, maxTokens: number): Promise<RawResult> {
  const res = await apiFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_completion_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const d = (await res.json()) as { choices: { message: { content: string } }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
  return { text: d.choices[0]?.message?.content ?? "", inputTokens: d.usage?.prompt_tokens ?? 0, outputTokens: d.usage?.completion_tokens ?? 0 };
}

async function callAnthropic(cfg: AiConfig, system: string, user: string, json: boolean, maxTokens: number): Promise<RawResult> {
  const res = await apiFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      system: json ? `${system}\nRespond with a single JSON object only, no prose.` : system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const d = (await res.json()) as { content: { type: string; text?: string }[]; usage?: { input_tokens: number; output_tokens: number } };
  const text = d.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  return { text, inputTokens: d.usage?.input_tokens ?? 0, outputTokens: d.usage?.output_tokens ?? 0 };
}

async function call(cfg: AiConfig, system: string, user: string, json: boolean, maxTokens: number, purpose: string, costs: CostEvent[]) {
  const budget = Number(process.env.AIVY_DAILY_AI_BUDGET_USD ?? 20);
  if ((await spendToday()) >= budget) throw new BudgetExceededError("Daily AI budget reached");
  const fn = cfg.provider === "openai" ? callOpenAI : callAnthropic;
  const r = await fn(cfg, system, user, json, maxTokens);
  const usd = (r.inputTokens * cfg.inPerM + r.outputTokens * cfg.outPerM) / 1_000_000;
  const ev: CostEvent = { at: new Date().toISOString(), provider: cfg.provider, model: cfg.model, purpose, inputTokens: r.inputTokens, outputTokens: r.outputTokens, usd };
  costs.push(ev);
  await recordSpend(usd);
  return r.text;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in response");
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateJson<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  purpose: string;
  costs: CostEvent[];
  maxTokens?: number;
}): Promise<T> {
  const cfg = aiConfig();
  if (!cfg) throw new Error("No AI provider configured");
  const maxTokens = opts.maxTokens ?? 4000;
  let text = await call(cfg, opts.system, opts.user, true, maxTokens, opts.purpose, opts.costs);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = opts.schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      if (attempt === 1) throw new Error(parsed.error.message.slice(0, 500));
      text = await call(
        cfg,
        opts.system,
        `${opts.user}\n\nYour previous answer failed validation:\n${parsed.error.message.slice(0, 800)}\nReturn corrected JSON only.`,
        true,
        maxTokens,
        `${opts.purpose}:repair`,
        opts.costs,
      );
    } catch (e) {
      if (attempt === 1) throw e;
      text = await call(cfg, opts.system, `${opts.user}\n\nReturn valid JSON only.`, true, maxTokens, `${opts.purpose}:repair`, opts.costs);
    }
  }
  throw new Error("Unreachable");
}

export async function generateText(opts: { system: string; user: string; purpose: string; costs: CostEvent[]; maxTokens?: number }) {
  const cfg = aiConfig();
  if (!cfg) throw new Error("No AI provider configured");
  return call(cfg, opts.system, opts.user, false, opts.maxTokens ?? 900, opts.purpose, opts.costs);
}
