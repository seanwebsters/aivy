import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PlaybookIcon } from "@/components/icon";
import { DifficultyPill, Pill, ProgressBar } from "@/components/ui";
import { playbookProgress, requireDashboard } from "@/lib/dashboard";
import { getPlaybook } from "@/lib/playbooks";

export default async function ImplementIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireDashboard(id);
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">Implementation</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Your setup guides</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">Step-by-step playbooks written for busy owners. Every guide shows the tools, costs, templates, how to test it and how to keep data safe.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {a.opportunities.map((o) => {
          const pb = getPlaybook(o.playbookId)!;
          const pr = playbookProgress(a, o.playbookId);
          return (
            <Link key={o.playbookId} href={`/dashboard/${id}/implement/${o.playbookId}`} className="group flex flex-col rounded-[26px] bg-white p-6 shadow-soft ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-violet-200">
              <div className="flex items-start gap-4">
                <PlaybookIcon name={pb.icon} />
                <div className="flex-1">
                  <h2 className="font-bold">{o.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {pb.steps.length} steps · {pb.setupTime}
                  </p>
                </div>
                {pr.complete ? <Pill tone="mint">Complete</Pill> : pr.started ? <Pill tone="amber">In progress</Pill> : <Pill tone="grey">Not started</Pill>}
              </div>
              <ProgressBar value={pr.pct} className="mt-5" />
              <div className="mt-4 flex items-center justify-between">
                <DifficultyPill d={o.difficulty} />
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition group-hover:gap-2">
                  {pr.started ? "Continue" : "Start"} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
