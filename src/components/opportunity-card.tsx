import { AlertTriangle, Sparkles, Zap } from "lucide-react";
import { PlaybookIcon } from "./icon";
import { DifficultyPill, ScoreRing } from "./ui";
import { SCORE_CRITERIA } from "@/lib/scoring";
import { getPlaybook } from "@/lib/playbooks";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({ o, rank, compact = false }: { o: Opportunity; rank: number; compact?: boolean }) {
  const pb = getPlaybook(o.playbookId)!;
  return (
    <article className="group relative overflow-hidden rounded-[28px] bg-white p-6 shadow-lift ring-1 ring-violet-100 transition hover:ring-violet-200 sm:p-8">
      <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl transition group-hover:bg-violet-300/40" />
      <div className="relative flex items-start gap-4">
        <PlaybookIcon name={pb.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-500">Opportunity #{rank}</p>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">{o.title}</h3>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ScoreRing value={o.score.total} size={60} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Impact</span>
        </div>
      </div>
      <p className="relative mt-4 text-[1.02rem] leading-relaxed text-ink-soft">{o.summary}</p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
          <Zap className="h-3 w-3" /> {o.benefit}
        </span>
        <DifficultyPill d={o.difficulty} />
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Setup {pb.setupTime}</span>
      </div>

      {!compact && (
        <div className="relative mt-6 grid gap-6 border-t border-violet-100 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold">What the AI would do</p>
            <ul className="mt-2 space-y-2">
              {o.whatAiDoes.map((w) => (
                <li key={w} className="flex gap-2 text-[0.95rem] text-ink-soft">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" /> {w}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">Worth knowing</p>
            <ul className="mt-2 space-y-2">
              {o.limitations.map((l) => (
                <li key={l} className="flex gap-2 text-[0.95rem] text-ink-soft">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="rounded-2xl bg-violet-50/70 p-4 text-sm leading-relaxed text-violet-900">
              <span className="font-semibold">Why Aivy picked this: </span>
              {o.rationale}
            </p>
            <ScoreBreakdownView o={o} />
          </div>
        </div>
      )}
    </article>
  );
}

export function ScoreBreakdownView({ o }: { o: Opportunity }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-violet-700 hover:text-violet-800">How this score was calculated</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SCORE_CRITERIA.map((c) => {
          const v = o.score[c.key];
          return (
            <div key={c.key}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-ink">{c.label}</span>
                <span className="text-ink-soft">{v}/5</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-violet-100">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${(v / 5) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-faint">{c.help}</p>
            </div>
          );
        })}
      </div>
      {o.score.risk > 0 && <p className="mt-3 text-xs text-amber-700">−{o.score.risk * 4} points for regulatory or sensitive-data considerations.</p>}
      {o.evidence.length > 0 && <p className="mt-3 text-xs text-ink-faint">Evidence: {o.evidence.join(" · ")}</p>}
    </details>
  );
}
