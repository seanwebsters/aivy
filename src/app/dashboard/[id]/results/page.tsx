import { OutcomeForm } from "@/components/dashboard/interactive";
import { PlaybookIcon } from "@/components/icon";
import { Pill } from "@/components/ui";
import { playbookProgress, requireDashboard } from "@/lib/dashboard";
import { getPlaybook } from "@/lib/playbooks";

export default async function Results({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireDashboard(id);
  const completed = a.opportunities.filter((o) => playbookProgress(a, o.playbookId).complete);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">Your results</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">What's changed since you started</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">Results here are entered by you. Aivy doesn&apos;t estimate or invent savings — your own numbers are the honest measure.</p>
      </header>
      <section>
        <h2 className="mb-3 text-lg font-bold">Implemented ({completed.length})</h2>
        {completed.length ? (
          <div className="flex flex-wrap gap-3">
            {completed.map((o) => (
              <span key={o.playbookId} className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-soft ring-1 ring-violet-100">
                <PlaybookIcon name={getPlaybook(o.playbookId)!.icon} size="sm" className="!h-8 !w-8 !rounded-full" />
                <span className="font-semibold">{o.title}</span>
                <Pill tone="mint">Done</Pill>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-ink-soft">Complete a guide&apos;s steps and checklist to see it here.</p>
        )}
      </section>
      <OutcomeForm analysisId={id} options={a.opportunities.map((o) => ({ id: o.playbookId, title: o.title }))} initial={a.outcomes} />
    </div>
  );
}
