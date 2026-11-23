import { after } from "next/server";
import { loadOwned } from "@/lib/access";
import { runRecommendations } from "@/lib/analysis/pipeline";
import { body, fail, json } from "@/lib/http";
import type { Answers } from "@/lib/types";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if (!owned) return fail("Not found", 404);
  const a = owned.analysis;
  if (a.status !== "awaiting_answers") return fail("This analysis isn't waiting for answers.", 409);
  const data = await body<{ answers?: Record<string, unknown> }>(req);
  const answers: Answers = {};
  for (const q of a.questions ?? []) {
    const raw = data?.answers?.[q.id];
    const vals = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((v): v is string => typeof v === "string" && q.options.some((o) => o.id === v));
    if (vals.length) answers[q.id] = q.kind === "single" ? vals.slice(0, 1) : vals;
  }
  after(() => runRecommendations(id, answers));
  return json({ ok: true });
}
