import { loadOwned } from "@/lib/access";
import { newId } from "@/lib/analysis/pipeline";
import { body, fail, json } from "@/lib/http";
import { getPlaybook } from "@/lib/playbooks";
import { saveAnalysis } from "@/lib/store";

export async function POST(req: Request) {
  const d = await body<{ analysisId?: string; playbookId?: string; metric?: string; before?: string; after?: string; note?: string; remove?: string }>(req);
  if (!d?.analysisId) return fail("Missing fields");
  const owned = await loadOwned(d.analysisId);
  if (!owned?.entitled) return fail("Not found", 404);
  const a = owned.analysis;
  if (d.remove) {
    a.outcomes = a.outcomes.filter((o) => o.id !== d.remove);
  } else {
    if (!d.playbookId || !getPlaybook(d.playbookId) || !d.metric?.trim()) return fail("Please choose an implementation and describe what you measured.");
    if (a.outcomes.length >= 100) return fail("Too many results recorded.");
    const s = (v?: string, n = 80) => (typeof v === "string" ? v.trim().slice(0, n) : undefined) || undefined;
    a.outcomes.unshift({ id: newId(8), playbookId: d.playbookId, metric: s(d.metric, 120)!, before: s(d.before), after: s(d.after), note: s(d.note, 300), at: new Date().toISOString(), verified: false });
  }
  await saveAnalysis(a);
  return json({ outcomes: a.outcomes });
}
