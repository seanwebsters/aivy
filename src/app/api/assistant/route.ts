import { loadOwned } from "@/lib/access";
import { respond, type ChatMessage } from "@/lib/assistant";
import { body, fail, json } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { logEvent, saveAnalysis } from "@/lib/store";

export async function POST(req: Request) {
  const data = await body<{ analysisId?: string; message?: string; history?: ChatMessage[] }>(req, 40_000);
  const message = typeof data?.message === "string" ? data.message.trim().slice(0, 1000) : "";
  if (!data?.analysisId || !message) return fail("Missing message");
  const owned = await loadOwned(data.analysisId);
  if (!owned) return fail("Not found", 404);
  if (!owned.entitled) return fail("Ask Aivy is part of the full plan.", 402);
  const a = owned.analysis;
  const isDemo = a.mode === "demo";
  if (!isDemo && a.assistant.used >= a.assistant.limit) return fail(`You've used all ${a.assistant.limit} Ask Aivy messages included with your plan. Your guides and toolkit remain available forever.`, 429);
  const burst = rateLimit(`assist:${a.id}`, isDemo ? 20 : 12, 60_000);
  if (!burst.ok) return fail("Let's slow down a little — try again in a moment.", 429);
  const history = (Array.isArray(data.history) ? data.history : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  const r = await respond(a, message, history);
  if (!isDemo) a.assistant.used += 1;
  if (r.escalated) {
    a.assistant.flagged += 1;
    await logEvent({ level: "warn", type: "support_escalation", message: message.slice(0, 160), analysisId: a.id });
  }
  await saveAnalysis(a);
  return json({ ...r, remaining: isDemo ? null : a.assistant.limit - a.assistant.used });
}
