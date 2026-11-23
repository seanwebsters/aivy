import { ExternalLink, PlugZap } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/dashboard/interactive";
import { PlaybookIcon } from "@/components/icon";
import { Pill } from "@/components/ui";
import { requireDashboard } from "@/lib/dashboard";
import { getPlaybook, personalise } from "@/lib/playbooks";
import type { PlaybookTool } from "@/lib/types";

export default async function Toolkit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "templates" } = await searchParams;
  const a = await requireDashboard(id);
  const pbs = a.opportunities.map((o) => getPlaybook(o.playbookId)!);
  const vars = { business_name: a.profile.name, industry: a.profile.industryLabel.toLowerCase() };
  const tools = new Map<string, PlaybookTool & { usedFor: string[] }>();
  for (const pb of pbs)
    for (const t of pb.tools) {
      const e = tools.get(t.name) ?? { ...t, usedFor: [] };
      e.usedFor.push(pb.title);
      tools.set(t.name, e);
    }
  const tabs = [
    ["templates", "Prompts & templates"],
    ["tools", "Recommended tools"],
    ["integrations", "Integrations"],
  ];
  return (
    <div>
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">AI toolkit</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Everything you need, ready to use</h1>
      </header>
      <div role="tablist" className="mb-6 inline-flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-violet-100">
        {tabs.map(([k, l]) => (
          <Link key={k} role="tab" aria-selected={tab === k} href={`?tab=${k}`} scroll={false} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-violet-600 text-white" : "text-ink-soft hover:text-ink"}`}>
            {l}
          </Link>
        ))}
      </div>

      {tab === "templates" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {pbs.flatMap((pb) =>
            pb.templates.map((t) => {
              const body = personalise(t.body, vars);
              return (
                <article key={`${pb.id}-${t.id}`} className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-soft ring-1 ring-violet-100">
                  <div className="flex items-center gap-3 border-b border-violet-100 p-4">
                    <PlaybookIcon name={pb.icon} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.title}</p>
                      <p className="truncate text-xs text-ink-faint">{pb.title} · {t.kind}</p>
                    </div>
                    <CopyButton text={body} />
                  </div>
                  <pre className="max-h-56 flex-1 overflow-auto whitespace-pre-wrap bg-[#faf8ff] p-4 font-sans text-[13px] leading-relaxed">{body}</pre>
                </article>
              );
            }),
          )}
        </div>
      )}

      {tab === "tools" && (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...tools.values()].map((t) => (
              <article key={t.name} className="rounded-[22px] bg-white p-5 shadow-soft ring-1 ring-violet-100">
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-lg font-bold hover:text-violet-700">
                  {t.name} <ExternalLink className="h-4 w-4" />
                </a>
                <p className="mt-1 text-sm text-ink-soft">{t.role}</p>
                <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800">{t.pricing}</p>
                <p className="mt-3 text-xs text-ink-faint">Used for: {t.usedFor.join(", ")}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-faint">Prices are indicative ranges for planning. Aivy has no affiliate relationship that affects these recommendations. Always confirm current pricing with the provider.</p>
        </div>
      )}

      {tab === "integrations" && (
        <div className="space-y-4">
          <div className="rounded-[22px] bg-violet-50/70 p-5 text-sm text-violet-900 ring-1 ring-violet-100">
            <p className="flex items-center gap-2 font-semibold">
              <PlugZap className="h-4 w-4" /> How integrations work in Aivy
            </p>
            <p className="mt-1.5">Today, every implementation uses <strong>guided setup</strong>: you connect tools yourself by following the guide, with Ask Aivy on hand. Aivy never shows something as &ldquo;active&rdquo; unless it has actually been configured and verified.</p>
          </div>
          <ul className="divide-y divide-violet-100 rounded-[22px] bg-white shadow-soft ring-1 ring-violet-100">
            {pbs.map((pb) => (
              <li key={pb.id} className="flex items-center gap-4 p-4">
                <PlaybookIcon name={pb.icon} size="sm" />
                <span className="flex-1 font-semibold">{pb.title}</span>
                <Pill tone="grey">Guided setup</Pill>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
