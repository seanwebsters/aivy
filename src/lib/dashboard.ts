import "server-only";
import { notFound, redirect } from "next/navigation";
import { loadOwned } from "./access";
import { getPlaybook } from "./playbooks";
import type { Analysis } from "./types";

export async function requireDashboard(id: string) {
  const owned = await loadOwned(id);
  if (!owned) notFound();
  if (!owned.entitled) redirect(`/report/${id}/unlock`);
  const a = owned.analysis;
  if (!a.profile || !a.opportunities) redirect(`/analyse/${id}`);
  return a as Analysis & Required<Pick<Analysis, "profile" | "opportunities">>;
}

/** Progress for one playbook: steps + checklist items. */
export function playbookProgress(a: Analysis, playbookId: string) {
  const pb = getPlaybook(playbookId)!;
  const total = pb.steps.length + pb.checklist.length;
  const done = (a.progress[playbookId]?.done ?? []).length;
  const complete = !!a.progress[playbookId]?.completedAt;
  return { total, done: Math.min(done, total), pct: total ? Math.round((Math.min(done, total) / total) * 100) : 0, complete, started: done > 0 };
}

export function overallProgress(a: Analysis) {
  const opps = a.opportunities ?? [];
  const per = opps.map((o) => playbookProgress(a, o.playbookId));
  return {
    completed: per.filter((p) => p.complete).length,
    inProgress: per.filter((p) => p.started && !p.complete).length,
    total: opps.length,
    pct: opps.length ? Math.round(per.reduce((s, p) => s + p.pct, 0) / opps.length) : 0,
  };
}

/** Roadmap phases: quick wins first, then the rest by score. */
export function roadmapPhases(a: Analysis) {
  const opps = a.opportunities ?? [];
  const quick = opps.filter((o) => o.difficulty === 1).slice(0, 3);
  const rest = opps.filter((o) => !quick.includes(o));
  return [
    { key: "now", title: "Quick wins", sub: "Weeks 1–2 · easy setups with high impact", items: quick },
    { key: "next", title: "Next up", sub: "Weeks 3–6 · build on your quick wins", items: rest.slice(0, 3) },
    { key: "later", title: "When you're ready", sub: "Month 2+ · bigger projects", items: rest.slice(3) },
  ].filter((p) => p.items.length);
}
