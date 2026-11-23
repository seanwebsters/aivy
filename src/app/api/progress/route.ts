import { loadOwned } from "@/lib/access";
import { body, fail, json } from "@/lib/http";
import { getPlaybook } from "@/lib/playbooks";
import { saveAnalysis } from "@/lib/store";

export async function POST(req: Request) {
  const d = await body<{ analysisId?: string; playbookId?: string; itemId?: string; done?: boolean }>(req);
  if (!d?.analysisId || !d.playbookId || !d.itemId) return fail("Missing fields");
  const owned = await loadOwned(d.analysisId);
  if (!owned?.entitled) return fail("Not found", 404);
  const pb = getPlaybook(d.playbookId);
  if (!pb) return fail("Unknown guide");
  const valid = [...pb.steps.map((s) => s.id), ...pb.checklist];
  if (!valid.includes(d.itemId)) return fail("Unknown step");
  const a = owned.analysis;
  const p = (a.progress[pb.id] ??= { done: [] });
  p.startedAt ??= new Date().toISOString();
  p.done = d.done ? Array.from(new Set([...p.done, d.itemId])) : p.done.filter((x) => x !== d.itemId);
  const complete = valid.every((v) => p.done.includes(v));
  p.completedAt = complete ? (p.completedAt ?? new Date().toISOString()) : undefined;
  await saveAnalysis(a);
  return json({ progress: p, complete });
}
