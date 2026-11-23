import { ArrowLeft, ClipboardCheck, ExternalLink, FlaskConical, Info, ListChecks, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton, GuideSteps } from "@/components/dashboard/interactive";
import { PlaybookIcon } from "@/components/icon";
import { DifficultyPill, Pill, ProgressBar } from "@/components/ui";
import { playbookProgress, requireDashboard } from "@/lib/dashboard";
import { getPlaybook, personalise } from "@/lib/playbooks";

export default async function Guide({ params }: { params: Promise<{ id: string; playbook: string }> }) {
  const { id, playbook } = await params;
  const a = await requireDashboard(id);
  const pb = getPlaybook(playbook);
  if (!pb) notFound();
  const opp = a.opportunities.find((o) => o.playbookId === pb.id);
  const pr = playbookProgress(a, pb.id);
  const vars = { business_name: a.profile.name, industry: a.profile.industryLabel.toLowerCase() };

  return (
    <div>
      <Link href={`/dashboard/${id}/implement`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>

      <header className="mt-4 rounded-[30px] bg-white p-6 shadow-soft ring-1 ring-violet-100 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <PlaybookIcon name={pb.icon} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{opp?.title ?? pb.title}</h1>
              {pr.complete ? <Pill tone="mint">Implemented</Pill> : <Pill tone="grey">Guided setup</Pill>}
            </div>
            <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">{opp?.summary ?? pb.solution}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <DifficultyPill d={pb.difficulty} />
              <Pill tone="grey">{pb.setupTime}</Pill>
              <Pill tone="grey">
                ~£{pb.monthlyCost.low}–£{pb.monthlyCost.high}/month in tools
              </Pill>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-semibold">Your progress</span>
            <span className="text-ink-soft">{pr.pct}%</span>
          </div>
          <ProgressBar value={pr.pct} />
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          <section className="rounded-[26px] bg-violet-50/70 p-5 ring-1 ring-violet-100 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-violet-800">
              <Info className="h-4 w-4" /> The problem this solves
            </p>
            <p className="mt-2 text-ink-soft">{pb.problem}</p>
          </section>

          <GuideSteps analysisId={id} playbookId={pb.id} steps={pb.steps} checklist={pb.checklist} initial={a.progress[pb.id]?.done ?? []} />

          <section>
            <h2 className="mb-3 text-xl font-bold">Ready-to-use templates</h2>
            <div className="space-y-4">
              {pb.templates.map((t) => {
                const body = personalise(t.body, vars);
                return (
                  <div key={t.id} className="overflow-hidden rounded-[22px] bg-white shadow-soft ring-1 ring-violet-100">
                    <div className="flex items-center justify-between gap-3 border-b border-violet-100 px-5 py-3">
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-xs capitalize text-ink-faint">{t.kind}</p>
                      </div>
                      <CopyButton text={body} />
                    </div>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap bg-[#faf8ff] p-5 font-sans text-sm leading-relaxed text-ink">{body}</pre>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <Panel icon={ListChecks} title="Before you start">
            <ul className="space-y-2">
              {pb.prerequisites.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /> {x}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel icon={Wrench} title="Recommended tools">
            <ul className="space-y-3">
              {pb.tools.map((t) => (
                <li key={t.name} className="rounded-2xl bg-violet-50/60 p-3.5">
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-violet-700">
                    {t.name} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <p className="text-sm text-ink-soft">{t.role}</p>
                  <p className="mt-1 text-xs font-medium text-violet-700">{t.pricing}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-faint">Prices are indicative and change often — always confirm on the provider&apos;s site. {pb.monthlyCost.note}</p>
          </Panel>
          <Panel icon={FlaskConical} title="How to test it">
            <ul className="space-y-2">
              {pb.testing.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-ink-soft">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" /> {x}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel icon={ShieldCheck} title="Security & privacy">
            <ul className="space-y-2">
              {pb.security.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-ink-soft">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {x}
                </li>
              ))}
            </ul>
            {a.profile.regulatedNote && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{a.profile.regulatedNote}</p>}
          </Panel>
          <Panel icon={Info} title="Limitations">
            <ul className="space-y-2">
              {(opp?.limitations ?? pb.limitations).map((x) => (
                <li key={x} className="text-sm text-ink-soft">
                  • {x}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-violet-100">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <Icon className="h-4 w-4 text-violet-600" /> {title}
      </h2>
      {children}
    </section>
  );
}
