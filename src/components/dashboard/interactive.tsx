"use client";

import { Check, ChevronDown, Copy, Loader2, PartyPopper, Printer, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { Outcome, PlaybookStep } from "@/lib/types";

async function saveProgress(analysisId: string, playbookId: string, itemId: string, done: boolean) {
  const r = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ analysisId, playbookId, itemId, done }) });
  if (!r.ok) throw new Error("save failed");
  return (await r.json()) as { complete: boolean };
}

function useProgress(analysisId: string, playbookId: string, initial: string[]) {
  const [done, setDone] = useState(new Set(initial));
  const [saving, setSaving] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const router = useRouter();
  async function toggle(itemId: string) {
    const next = !done.has(itemId);
    setDone((s) => {
      const c = new Set(s);
      if (next) c.add(itemId);
      else c.delete(itemId);
      return c;
    });
    setSaving(itemId);
    try {
      const r = await saveProgress(analysisId, playbookId, itemId, next);
      if (r.complete) setCelebrate(true);
      router.refresh();
    } catch {
      setDone((s) => {
        const c = new Set(s);
        if (next) c.delete(itemId);
        else c.add(itemId);
        return c;
      });
    } finally {
      setSaving(null);
    }
  }
  return { done, toggle, saving, celebrate, setCelebrate };
}

export function GuideSteps({ analysisId, playbookId, steps, checklist, initial }: { analysisId: string; playbookId: string; steps: PlaybookStep[]; checklist: string[]; initial: string[] }) {
  const { done, toggle, saving, celebrate, setCelebrate } = useProgress(analysisId, playbookId, initial);
  const firstOpen = steps.find((s) => !done.has(s.id))?.id;
  const [open, setOpen] = useState<string | undefined>(firstOpen);
  const stepsDone = steps.filter((s) => done.has(s.id)).length;
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Setup steps</h2>
          <span className="text-sm text-ink-soft">
            {stepsDone}/{steps.length} done
          </span>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const isDone = done.has(s.id);
            const isOpen = open === s.id;
            return (
              <li key={s.id} className={clsx("rounded-[22px] bg-white ring-1 transition", isOpen ? "shadow-lift ring-violet-200" : "shadow-soft ring-violet-100")}>
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <button
                    onClick={() => toggle(s.id)}
                    aria-pressed={isDone}
                    aria-label={`Mark step ${i + 1} ${isDone ? "not done" : "done"}`}
                    className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition", isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-violet-200 text-violet-400 hover:border-violet-400")}
                  >
                    {saving === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </button>
                  <button onClick={() => setOpen(isOpen ? undefined : s.id)} className="flex flex-1 items-center justify-between gap-3 text-left" aria-expanded={isOpen}>
                    <span className={clsx("font-semibold", isDone && "text-ink-faint line-through")}>{s.title}</span>
                    <ChevronDown className={clsx("h-5 w-5 shrink-0 text-ink-faint transition", isOpen && "rotate-180")} />
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 pl-[3.75rem] sm:pl-[4.25rem]">
                        <p className="leading-relaxed text-ink-soft">{s.body}</p>
                        {s.details && (
                          <ul className="mt-3 space-y-1.5">
                            {s.details.map((d) => (
                              <li key={d} className="flex gap-2 text-sm text-ink-soft">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /> {d}
                              </li>
                            ))}
                          </ul>
                        )}
                        {!isDone && (
                          <button
                            onClick={() => {
                              toggle(s.id);
                              setOpen(steps[i + 1]?.id);
                            }}
                            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
                          >
                            <Check className="h-4 w-4" /> Mark as done
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Completion checklist</h2>
        <p className="mb-4 text-sm text-ink-soft">Tick these off once you&apos;ve checked them for real. Aivy only marks a guide complete when every step and check is done — it never assumes something is live.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklist.map((c) => {
            const on = done.has(c);
            return (
              <li key={c}>
                <button onClick={() => toggle(c)} aria-pressed={on} className={clsx("flex w-full items-center gap-3 rounded-2xl p-3.5 text-left text-sm font-medium ring-1 transition", on ? "bg-mint-soft text-emerald-800 ring-emerald-200" : "bg-white ring-violet-100 hover:ring-violet-200")}>
                  <span className={clsx("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2", on ? "border-emerald-500 bg-emerald-500 text-white" : "border-violet-200")}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                  {c}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/60 p-4 backdrop-blur-sm" onClick={() => setCelebrate(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-sm rounded-[32px] bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/aivy/aivy-celebrating.webp" alt="" className="mx-auto h-40" />
              <h3 className="mt-4 flex items-center justify-center gap-2 text-2xl font-extrabold">
                <PartyPopper className="h-6 w-6 text-violet-600" /> Implemented!
              </h3>
              <p className="mt-2 text-ink-soft">Brilliant work. Log any results you notice in Your Results so you can see the difference over time.</p>
              <button onClick={() => setCelebrate(false)} className="mt-6 h-11 rounded-full bg-violet-600 px-6 font-semibold text-white">
                Lovely
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition", copied ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700", className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="no-print inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700">
      <Printer className="h-4 w-4" /> Download / print PDF
    </button>
  );
}

export function OutcomeForm({ analysisId, options, initial }: { analysisId: string; options: { id: string; title: string }[]; initial: Outcome[] }) {
  const [outcomes, setOutcomes] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ playbookId: options[0]?.id ?? "", metric: "", before: "", after: "", note: "" });
  const titles = Object.fromEntries(options.map((o) => [o.id, o.title]));
  async function post(payload: Record<string, string>) {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/outcomes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ analysisId, ...payload }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    setOutcomes(d.outcomes);
    return true;
  }
  const field = "mt-1.5 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-[0.95rem] focus:border-violet-500 focus:outline-none";
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await post(form)) setForm({ ...form, metric: "", before: "", after: "", note: "" });
        }}
        className="h-fit rounded-[26px] bg-white p-6 shadow-soft ring-1 ring-violet-100"
      >
        <h2 className="text-lg font-bold">Log a result</h2>
        <p className="mt-1 text-sm text-ink-soft">Record what changed after an implementation — in your own words and numbers.</p>
        <label className="mt-4 block text-sm font-semibold">
          Implementation
          <select value={form.playbookId} onChange={(e) => setForm({ ...form, playbookId: e.target.value })} className={field}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold">
          What did you measure?
          <input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="e.g. Hours a week answering emails" className={field} required />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Before
            <input value={form.before} onChange={(e) => setForm({ ...form, before: e.target.value })} placeholder="e.g. 6" className={field} />
          </label>
          <label className="block text-sm font-semibold">
            After
            <input value={form.after} onChange={(e) => setForm({ ...form, after: e.target.value })} placeholder="e.g. 2" className={field} />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Note (optional)
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={field} />
        </label>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save result
        </button>
      </form>
      <div>
        {outcomes.length === 0 ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-violet-200 p-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aivy/aivy-thinking.webp" alt="" className="h-28" />
            <p className="mt-3 font-semibold">No results yet</p>
            <p className="mt-1 max-w-xs text-sm text-ink-soft">Once something&apos;s live for a couple of weeks, note what changed — even rough numbers help.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {outcomes.map((o) => (
              <li key={o.id} className="rounded-[22px] bg-white p-5 shadow-soft ring-1 ring-violet-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">{titles[o.playbookId] ?? o.playbookId}</p>
                    <p className="mt-0.5 font-bold">{o.metric}</p>
                  </div>
                  <button onClick={() => post({ remove: o.id })} aria-label="Delete result" className="rounded-full p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {(o.before || o.after) && (
                  <p className="mt-2 flex items-center gap-3 text-2xl font-extrabold tracking-tight">
                    <span className="text-ink-faint">{o.before ?? "—"}</span>
                    <span className="text-violet-400">→</span>
                    <span className="text-gradient-ink">{o.after ?? "—"}</span>
                  </p>
                )}
                {o.note && <p className="mt-1 text-sm text-ink-soft">{o.note}</p>}
                <p className="mt-2 text-xs text-ink-faint">Self-reported · {new Date(o.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
