import { ArrowRight, Clock, PoundSterling, Zap } from "lucide-react";
import Link from "next/link";
import { PlaybookIcon } from "@/components/icon";
import { ScoreBreakdownView } from "@/components/opportunity-card";
import { DifficultyPill, Pill, ScoreRing } from "@/components/ui";
import { playbookProgress, requireDashboard, roadmapPhases } from "@/lib/dashboard";
import { getPlaybook } from "@/lib/playbooks";

export default async function Roadmap({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireDashboard(id);
  const phases = roadmapPhases(a);
  let n = 0;
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">Your AI roadmap</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">What to do, and in what order</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">Quick wins come first so you see value fast. Impact scores combine business fit, your priorities, readiness and ease — open any card to see exactly how.</p>
      </header>
      <ol className="relative space-y-10 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-violet-300 before:to-violet-100 sm:before:left-[23px]">
        {phases.map((ph, pi) => (
          <li key={ph.key} className="relative pl-14 sm:pl-16">
            <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold text-white ring-4 ring-violet-100 sm:h-12 sm:w-12">{pi + 1}</span>
            <h2 className="text-xl font-bold sm:pt-2">{ph.title}</h2>
            <p className="text-sm text-ink-soft">{ph.sub}</p>
            <div className="mt-4 space-y-4">
              {ph.items.map((o) => {
                n += 1;
                const pb = getPlaybook(o.playbookId)!;
                const pr = playbookProgress(a, o.playbookId);
                return (
                  <article key={o.playbookId} className="rounded-[26px] bg-white p-5 shadow-soft ring-1 ring-violet-100 sm:p-6">
                    <div className="flex items-start gap-4">
                      <PlaybookIcon name={pb.icon} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">{o.title}</h3>
                          {pr.complete ? <Pill tone="mint">Complete</Pill> : pr.started ? <Pill tone="amber">In progress · {pr.pct}%</Pill> : null}
                        </div>
                        <p className="mt-1 text-ink-soft">{o.summary}</p>
                      </div>
                      <ScoreRing value={o.score.total} size={54} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <Pill>
                        <Zap className="h-3 w-3" /> {o.benefit}
                      </Pill>
                      <DifficultyPill d={o.difficulty} />
                      <Pill tone="grey">
                        <Clock className="h-3 w-3" /> {pb.setupTime}
                      </Pill>
                      <Pill tone="grey">
                        <PoundSterling className="h-3 w-3" /> ~£{pb.monthlyCost.low}–£{pb.monthlyCost.high}/mo in tools
                      </Pill>
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <ScoreBreakdownView o={o} />
                      <Link href={`/dashboard/${id}/implement/${o.playbookId}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700">
                        {pr.started ? "Continue" : "Start guide"} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <span className="sr-only">Priority {n}</span>
                  </article>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
