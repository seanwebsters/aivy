import { ArrowRight, Check, Globe, Lock, MessageSquareText, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Aivy, Logo } from "@/components/brand";
import { PlaybookIcon } from "@/components/icon";
import { OpportunityCard } from "@/components/opportunity-card";
import { loadOwned } from "@/lib/access";
import { FREE_OPPORTUNITIES } from "@/lib/analysis/pipeline";
import { getPlaybook } from "@/lib/playbooks";

export const metadata: Metadata = { title: "Your AI opportunities", robots: { index: false } };

const numberWord = (n: number) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await loadOwned(id);
  if (!owned) notFound();
  const { analysis: a, entitled } = owned;
  if (a.status !== "complete" || !a.profile || !a.opportunities) redirect(`/analyse/${id}`);
  const p = a.profile;
  const free = a.opportunities.slice(0, FREE_OPPORTUNITIES);
  // Locked opportunities: only titles/icons are sent to the browser.
  const locked = a.opportunities.slice(FREE_OPPORTUNITIES).map((o) => ({ id: o.playbookId, title: o.title, icon: getPlaybook(o.playbookId)!.icon }));
  const n = a.opportunities.length;
  const websiteFacts = p.facts.filter((f) => f.source === "website");
  const answerCount = Object.keys(a.answers ?? {}).length;

  return (
    <main className="min-h-dvh bg-cream">
      {/* Header */}
      <section className="relative isolate overflow-hidden bg-night-900 pb-28 pt-6">
        <Image src="/aivy/hero-bg.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-60" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night-900 via-night-900/80 to-night-900/30" />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo dark />
          {entitled ? (
            <Link href={`/dashboard/${id}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href={`/report/${id}/unlock`} className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-300 px-4 text-sm font-semibold text-night-900 hover:brightness-105">
              Unlock full plan · £99
            </Link>
          )}
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl items-end gap-6 px-5 sm:px-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-violet-100 ring-1 ring-white/15">
              <Globe className="h-4 w-4" /> {a.domain} · {p.industryLabel}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-[3.4rem] sm:leading-[1.05]">
              We&apos;ve found <span className="text-gradient italic">{numberWord(n)} ways</span>
              <br className="hidden sm:block" /> AI could help {p.name}.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-violet-50/80">{p.summary}</p>
          </div>
          <Aivy state="discovering" height={230} priority className="hidden md:block" />
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-6xl px-5 pb-24 sm:px-8">
        {/* What we know */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-6 shadow-lift ring-1 ring-violet-100 md:col-span-2">
            <p className="text-sm font-bold">What we found on your website</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {websiteFacts.slice(0, 8).map((f) => (
                <li key={f.statement} className="flex gap-2 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    {f.statement}
                    {f.evidence && <span className="block text-xs text-ink-faint">{f.evidence}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-lift ring-1 ring-violet-100">
            <p className="flex items-center gap-2 text-sm font-bold">
              <MessageSquareText className="h-4 w-4 text-violet-600" /> What you told us
            </p>
            <p className="mt-2 text-sm text-ink-soft">{answerCount ? `You answered ${answerCount} questions — we used these to rank what matters to you.` : "You skipped the questions, so rankings rely on your website and industry."}</p>
            <p className="mt-3 text-xs text-ink-faint">We never assume your costs, staffing or internal systems from your website.</p>
          </div>
        </div>

        {p.regulatedNote && (
          <div className="mt-4 flex gap-3 rounded-[24px] bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>
              <span className="font-semibold">Regulated industry. </span>
              {p.regulatedNote}
            </p>
          </div>
        )}

        <div className="mt-14 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-600">Your top {free.length}, free</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Your strongest AI opportunities</h2>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          {free.map((o, i) => (
            <OpportunityCard key={o.playbookId} o={o} rank={i + 1} />
          ))}
        </div>

        {/* Locked */}
        {locked.length > 0 && (
          <section className="relative mt-14 overflow-hidden rounded-[36px] bg-night-900 p-6 text-white shadow-glow sm:p-10">
            <div aria-hidden className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-500/30 blur-[90px]" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
                  <Lock className="h-4 w-4" /> {locked.length} more opportunities in your full plan
                </p>
                <ul className="mt-5 space-y-2.5">
                  {locked.map((l, i) => (
                    <li key={l.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                      <PlaybookIcon name={l.icon} size="sm" />
                      <span className="flex-1 font-semibold">{entitled ? l.title : l.title}</span>
                      <span className="hidden h-2 w-24 rounded-full bg-white/10 sm:block" />
                      <span className="text-xs text-violet-200/60">#{i + FREE_OPPORTUNITIES + 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center lg:text-left">
                <Aivy state="helping" height={170} className="mx-auto lg:mx-0" />
                <h3 className="mt-4 text-2xl font-bold">Your complete AI upgrade plan is ready.</h3>
                <p className="mt-2 text-violet-100/70">Every opportunity, a prioritised roadmap, setup guides, templates and Ask Aivy — for a one-time £99.</p>
                <Link href={entitled ? `/dashboard/${id}` : `/report/${id}/unlock`} className="mt-6 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-violet-300 via-violet-200 to-[#f6d9ff] px-7 font-semibold text-night-900 shadow-[0_16px_40px_-12px_rgba(164,124,255,0.9)] hover:brightness-105">
                  {entitled ? "Open my dashboard" : "Unlock my full plan — £99"} <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-xs text-violet-100/50">One-time payment. No subscription.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
