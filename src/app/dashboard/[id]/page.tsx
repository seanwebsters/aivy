import { ArrowRight, CheckCircle2, Circle, MessageSquareText, Globe, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Aivy } from "@/components/brand";
import { PlaybookIcon } from "@/components/icon";
import { Card, DifficultyPill, Pill, ProgressBar, ScoreRing } from "@/components/ui";
import { overallProgress, playbookProgress, requireDashboard } from "@/lib/dashboard";
import { getPlaybook } from "@/lib/playbooks";

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireDashboard(id);
  const p = a.profile;
  const prog = overallProgress(a);
  const next = a.opportunities.find((o) => !playbookProgress(a, o.playbookId).complete) ?? a.opportunities[0];
  const nextPb = getPlaybook(next.playbookId)!;
  const nextProg = playbookProgress(a, next.playbookId);
  const nextStep = nextPb.steps.find((s) => !(a.progress[next.playbookId]?.done ?? []).includes(s.id));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-night-900 p-6 text-white sm:p-9">
        <div aria-hidden className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-violet-500/40 blur-[90px]" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blush/20 blur-[90px]" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-violet-300">{greet} 👋</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{p.name}&apos;s AI headquarters</h1>
            <p className="mt-2 max-w-xl text-violet-100/75">
              {prog.completed === 0 ? `You have ${a.opportunities.length} AI opportunities ready. Let's start with a quick win.` : `${prog.completed} of ${prog.total} implementations complete. Lovely progress.`}
            </p>
            <div className="mt-6 max-w-md">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold">Overall progress</span>
                <span className="text-violet-200">{prog.pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-blush" style={{ width: `${Math.max(prog.pct, 2)}%` }} />
              </div>
            </div>
          </div>
          <Aivy state={prog.completed > 0 ? "celebrating" : "waving"} height={200} className="mx-auto hidden md:block" />
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          [Sparkles, "Opportunities", a.opportunities.length],
          [Circle, "In progress", prog.inProgress],
          [CheckCircle2, "Completed", prog.completed],
          [Trophy, "Results logged", a.outcomes.length],
        ].map(([Icon, label, v]) => {
          const I = Icon as typeof Sparkles;
          return (
            <Card key={label as string} className="p-5">
              <I className="h-5 w-5 text-violet-500" />
              <p className="mt-3 text-3xl font-extrabold tracking-tight">{v as number}</p>
              <p className="text-sm text-ink-soft">{label as string}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Next action */}
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">Your next step</p>
          <div className="mt-4 flex items-start gap-4">
            <PlaybookIcon name={nextPb.icon} size="lg" />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{next.title}</h2>
              <p className="mt-1 text-ink-soft">{nextStep ? `Step: ${nextStep.title}` : "Finish your completion checklist"}</p>
            </div>
          </div>
          <ProgressBar value={nextProg.pct} className="mt-5" />
          <p className="mt-2 text-xs text-ink-faint">
            {nextProg.done} of {nextProg.total} steps and checks done · about {nextPb.setupTime} in total
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/dashboard/${id}/implement/${next.playbookId}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700">
              {nextProg.started ? "Continue guide" : "Start guide"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={`/dashboard/${id}/ask`} className="inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50">
              <MessageSquareText className="h-4 w-4" /> Ask Aivy for help
            </Link>
          </div>
        </Card>

        {/* Business summary */}
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">Your business</p>
          <p className="mt-3 leading-relaxed text-ink-soft">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>
              <Globe className="h-3 w-3" /> {a.domain}
            </Pill>
            <Pill>{p.industryLabel}</Pill>
            {p.location && <Pill tone="grey">{p.location}</Pill>}
          </div>
          <p className="mt-5 text-sm font-semibold">What we know</p>
          <ul className="mt-2 space-y-1.5">
            {p.facts.slice(0, 5).map((f) => (
              <li key={f.statement} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-ink-soft">{f.statement}</span>
                <Pill tone={f.source === "website" ? "mint" : f.source === "answer" ? "violet" : "grey"} className="shrink-0 !py-0.5 !text-[10px]">
                  {f.source === "website" ? "From website" : f.source === "answer" ? "You told us" : "Unknown"}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top opportunities */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold">Your top opportunities</h2>
          <Link href={`/dashboard/${id}/roadmap`} className="text-sm font-semibold text-violet-700 hover:text-violet-800">
            Full roadmap →
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-violet-100">
          {a.opportunities.slice(0, 5).map((o) => {
            const pb = getPlaybook(o.playbookId)!;
            const pr = playbookProgress(a, o.playbookId);
            return (
              <li key={o.playbookId}>
                <Link href={`/dashboard/${id}/implement/${o.playbookId}`} className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-violet-50/60">
                  <PlaybookIcon name={pb.icon} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{o.title}</p>
                    <p className="truncate text-sm text-ink-soft">{o.benefit}</p>
                  </div>
                  <span className="hidden sm:block">
                    <DifficultyPill d={o.difficulty} />
                  </span>
                  {pr.complete ? <Pill tone="mint">Complete</Pill> : pr.started ? <Pill tone="amber">{pr.pct}%</Pill> : <ScoreRing value={o.score.total} size={44} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
