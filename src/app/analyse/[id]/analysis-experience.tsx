"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Aivy, type AivyState } from "@/components/brand";
import type { AnalysisStatus, Question } from "@/lib/types";

interface StatusPayload {
  status: AnalysisStatus;
  error?: string;
  domain: string;
  attempts: number;
  name?: string;
  industry?: string;
  facts?: string[];
  questions?: Question[];
  opportunityCount?: number;
}

const STAGES = [
  { key: "fetching", label: "Getting to know your business", state: "scanning" },
  { key: "profiling", label: "Understanding your services", state: "thinking" },
  { key: "journey", label: "Exploring your customer experience", state: "thinking" },
  { key: "recommending", label: "Identifying opportunities", state: "discovering" },
  { key: "building", label: "Building your AI recommendations", state: "discovering" },
] as const;

function stageIndex(s: AnalysisStatus): number {
  switch (s) {
    case "queued":
    case "fetching":
      return 0;
    case "profiling":
      return 1;
    case "awaiting_answers":
      return 2;
    case "recommending":
      return 3;
    case "complete":
      return 5;
    default:
      return 0;
  }
}

export function AnalysisExperience({ id }: { id: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [data, setData] = useState<StatusPayload | null>(null);
  const [shown, setShown] = useState(0); // smoothed stage for pacing
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [qIndex, setQIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);
  const answered = useRef(false);

  // Poll status
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const r = await fetch(`/api/analyses/${id}`, { cache: "no-store" });
        if (r.status === 404) {
          setNetError("We couldn't find this analysis. It may belong to another browser.");
          return;
        }
        const d = (await r.json()) as StatusPayload;
        if (!stop) setData(d);
        setNetError(null);
        if (d.status === "complete" || d.status === "failed") return;
      } catch {
        setNetError("Connection hiccup — retrying…");
      }
      if (!stop) timer = setTimeout(tick, 1100);
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, submitting]);

  // Pace the visual stages so progress feels considered, not instant
  const target = data ? stageIndex(data.status) : 0;
  useEffect(() => {
    if (shown >= target) return;
    const t = setTimeout(() => setShown((s) => Math.min(s + 1, target)), reduce ? 50 : 1300);
    return () => clearTimeout(t);
  }, [shown, target, reduce]);

  const done = data?.status === "complete" && shown >= 5;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push(`/report/${id}`), reduce ? 400 : 2400);
    return () => clearTimeout(t);
  }, [done, id, router, reduce]);

  const asking = data?.status === "awaiting_answers" && shown >= 2 && !answered.current;
  const questions = data?.questions ?? [];

  async function submitAnswers(final: Record<string, string[]>) {
    answered.current = true;
    setSubmitting(true);
    await fetch(`/api/analyses/${id}/answers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: final }) });
    setData((d) => (d ? { ...d, status: "recommending", questions: undefined } : d));
    setSubmitting(false);
  }

  async function retry() {
    setData(null);
    setShown(0);
    answered.current = false;
    const r = await fetch(`/api/analyses/${id}/retry`, { method: "POST" });
    if (!r.ok) setNetError((await r.json()).error);
    setSubmitting((s) => !s); // restart polling
  }

  const mascot: AivyState = data?.status === "failed" ? "thinking" : done ? "celebrating" : asking ? "helping" : (STAGES[Math.min(shown, 4)]?.state ?? "scanning");

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:pt-32">
      {/* Mascot + stage */}
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <div className="relative">
          <div aria-hidden className="absolute inset-0 -z-10 m-auto h-64 w-64 rounded-full bg-violet-500/30 blur-[80px]" />
          {mascot === "scanning" && !reduce && (
            <motion.div aria-hidden className="absolute inset-x-6 top-[22%] h-0.5 rounded-full bg-gradient-to-r from-transparent via-violet-200 to-transparent shadow-[0_0_20px_4px_rgba(196,168,255,0.7)]" animate={{ y: [0, 120, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
          )}
          <Aivy state={mascot} height={300} priority />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-violet-300">{data?.domain ?? "Starting up"}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {data?.status === "failed" ? "Hmm, I hit a snag." : done ? "All done — here's what I found!" : asking ? "A few quick questions" : data?.name ? `Getting to know ${data.name}` : "Aivy is on it…"}
        </h1>
        <p className="mt-3 max-w-md text-violet-100/70" aria-live="polite">
          {data?.status === "failed"
            ? data.error
            : asking
              ? "Your website can't tell me everything. Your answers help me separate facts from guesses."
              : done
                ? "Opening your results…"
                : "This usually takes under a minute. Please keep this page open."}
        </p>
        {netError && <p className="mt-3 text-sm text-amber">{netError}</p>}
      </div>

      {/* Right panel */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {data?.status === "failed" ? (
            <motion.div key="fail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-white/[0.06] p-7 ring-1 ring-white/10">
              <p className="font-semibold text-white">What you can do</p>
              <ul className="mt-3 space-y-2 text-violet-100/75">
                <li>• Check the address is your public website (e.g. yourbusiness.co.uk)</li>
                <li>• Try your homepage rather than a specific page</li>
                <li>• Some sites block automated visitors — try again in a minute</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                {data.attempts < 3 && (
                  <button onClick={retry} className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-300 px-5 font-semibold text-night-900 hover:brightness-105">
                    <RotateCcw className="h-4 w-4" /> Try again
                  </button>
                )}
                <Link href="/#start" className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
                  Use a different address
                </Link>
              </div>
            </motion.div>
          ) : asking && questions.length ? (
            <Questions key="q" questions={questions} index={qIndex} setIndex={setQIndex} answers={answers} setAnswers={setAnswers} onDone={submitAnswers} busy={submitting} />
          ) : (
            <motion.div key="progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur sm:p-8">
              <ol className="space-y-1">
                {STAGES.map((s, i) => {
                  const state = i < shown ? "done" : i === shown && !done ? "active" : done ? "done" : "todo";
                  return (
                    <li key={s.key} className={clsx("flex items-center gap-4 rounded-2xl px-3 py-3 transition", state === "active" && "bg-white/[0.06]")}>
                      <span className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition", state === "done" ? "bg-emerald-400/20 text-emerald-300" : state === "active" ? "bg-violet-400/25 text-violet-200" : "bg-white/5 text-white/30")}>
                        {state === "done" ? <Check className="h-4 w-4" /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      <span className={clsx("font-medium", state === "todo" ? "text-white/35" : "text-white")}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>
              {(data?.industry || data?.facts?.length) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Found on your website</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data?.industry && <span className="rounded-full bg-violet-400/20 px-3 py-1.5 text-sm text-violet-100">{data.industry}</span>}
                    {data?.facts?.map((f, i) => (
                      <motion.span key={f} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.25 }} className="rounded-full bg-white/[0.07] px-3 py-1.5 text-sm text-violet-50/85">
                        {f}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
              {done && (
                <Link href={`/report/${id}`} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-300 to-[#f6d9ff] px-6 font-semibold text-night-900">
                  See my {data?.opportunityCount} opportunities <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Questions({
  questions,
  index,
  setIndex,
  answers,
  setAnswers,
  onDone,
  busy,
}: {
  questions: Question[];
  index: number;
  setIndex: (n: number) => void;
  answers: Record<string, string[]>;
  setAnswers: (a: Record<string, string[]>) => void;
  onDone: (a: Record<string, string[]>) => void;
  busy: boolean;
}) {
  const q = questions[index];
  const sel = answers[q.id] ?? [];
  const last = index === questions.length - 1;
  const toggle = (opt: string) => {
    let next: string[];
    if (q.kind === "single") next = [opt];
    else if (opt === "none") next = sel.includes("none") ? [] : ["none"];
    else next = sel.includes(opt) ? sel.filter((x) => x !== opt) : [...sel.filter((x) => x !== "none"), opt];
    const updated = { ...answers, [q.id]: next };
    setAnswers(updated);
    if (q.kind === "single") setTimeout(() => (last ? onDone(updated) : setIndex(index + 1)), 280);
  };
  return (
    <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }} className="rounded-[28px] bg-white p-6 shadow-lift sm:p-8">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-violet-600">
          Question {index + 1} of {questions.length}
        </span>
        <button type="button" onClick={() => (last ? onDone(answers) : setIndex(index + 1))} className="text-ink-faint hover:text-ink">
          Skip
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blush transition-all duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink" id={`q-${q.id}`}>
        {q.prompt}
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">{q.why}</p>
      <div role={q.kind === "single" ? "radiogroup" : "group"} aria-labelledby={`q-${q.id}`} className={clsx("mt-5 grid gap-2.5", q.options.length > 5 && "sm:grid-cols-2")}>
        {q.options.map((o) => {
          const on = sel.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role={q.kind === "single" ? "radio" : "checkbox"}
              aria-checked={on}
              onClick={() => toggle(o.id)}
              className={clsx("flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-medium ring-1 transition", on ? "bg-violet-50 text-violet-800 ring-2 ring-violet-500" : "text-ink ring-violet-100 hover:bg-violet-50/60 hover:ring-violet-200")}
            >
              <span className={clsx("flex h-5 w-5 shrink-0 items-center justify-center border-2 transition", q.kind === "single" ? "rounded-full" : "rounded-md", on ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200")}>
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-0">
          ← Back
        </button>
        {q.kind === "multi" && (
          <button type="button" disabled={busy} onClick={() => (last ? onDone(answers) : setIndex(index + 1))} className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-6 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {last ? "Build my recommendations" : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
