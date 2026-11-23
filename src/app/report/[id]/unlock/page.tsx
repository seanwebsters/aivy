import { ArrowLeft, BookOpenCheck, Download, LayoutDashboard, ListOrdered, MessagesSquare, ReceiptText, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Aivy, Logo } from "@/components/brand";
import { CheckoutButton } from "@/components/checkout-button";
import { PlaybookIcon } from "@/components/icon";
import { loadOwned } from "@/lib/access";
import { getPlaybook } from "@/lib/playbooks";
import { getStripe } from "@/lib/payments";

export const metadata: Metadata = { title: "Unlock your plan", robots: { index: false } };

const items = [
  [Sparkles, "Complete AI opportunity report", "Every opportunity we found, fully explained"],
  [ListOrdered, "Prioritised roadmap", "What to do first, next and later"],
  [ReceiptText, "Tools & estimated costs", "Indicative monthly costs, before you commit"],
  [BookOpenCheck, "Step-by-step guides", "Written for non-technical owners"],
  [Wand2, "Ready-to-use templates", "Prompts and messages personalised to you"],
  [MessagesSquare, "Ask Aivy", "Your implementation assistant, on hand"],
  [Download, "Downloadable report", "Print or save as PDF any time"],
  [LayoutDashboard, "Your saved dashboard", "Track progress and results, for life"],
] as const;

export default async function UnlockPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cancelled?: string }> }) {
  const { id } = await params;
  const { cancelled } = await searchParams;
  const owned = await loadOwned(id);
  if (!owned) notFound();
  if (owned.entitled) redirect(`/dashboard/${id}`);
  const a = owned.analysis;
  if (a.status !== "complete" || !a.opportunities) redirect(`/analyse/${id}`);
  const name = a.profile?.name ?? a.domain;
  const testMode = !getStripe();

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-night-900">
      <Image src="/aivy/hero-bg.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-70" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-night-950/95 via-night-900/80 to-night-900/40" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo dark />
        <Link href={`/report/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-100/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-300">For {name}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-[3.2rem] sm:leading-[1.05]">
            Your complete <span className="text-gradient italic">AI upgrade plan</span> is ready.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-violet-50/80">
            {a.opportunities.length} personalised opportunities, ranked and ready to implement — with everything you need to put them to work.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {items.map(([Icon, t, s]) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/20 text-violet-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-white">{t}</span>
                  <span className="text-sm text-violet-100/60">{s}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            {a.opportunities.map((o) => (
              <span key={o.playbookId} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3 text-sm text-violet-50/85 ring-1 ring-white/10">
                <PlaybookIcon name={getPlaybook(o.playbookId)!.icon} size="sm" className="!h-7 !w-7 !rounded-full" /> {o.title}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:pt-6">
          <div className="relative">
            <Aivy state="celebrating" height={170} className="absolute -top-36 right-4 z-10 hidden lg:block" />
            <div className="rounded-[32px] bg-gradient-to-b from-violet-300/60 to-white/20 p-[1.5px] shadow-glow">
              <div className="rounded-[31px] bg-white p-7 sm:p-9">
                {cancelled && <p className="mb-5 rounded-2xl bg-violet-50 p-3 text-sm text-violet-800">No problem — you weren&apos;t charged. Your results are saved whenever you&apos;re ready.</p>}
                <p className="font-semibold text-ink">Complete AI Upgrade Plan</p>
                <p className="mt-3 flex items-end gap-2">
                  <span className="text-6xl font-extrabold tracking-tight">£99</span>
                  <span className="mb-2 text-ink-soft">one-time</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">No subscription. Lifetime access to your plan, guides and toolkit.</p>
                <div className="my-6 h-px bg-violet-100" />
                <CheckoutButton analysisId={id} />
                <div className="mt-5 space-y-2.5 text-sm text-ink-soft">
                  <p className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> Secure payment by Stripe. We never see your card details.
                  </p>
                  <p className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> Not right for you? Email us within 14 days for a refund.
                  </p>
                  <p className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> Third-party AI tools are billed separately by their providers.
                  </p>
                </div>
                {testMode && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Test mode: Stripe isn&apos;t configured, so checkout is simulated and no real payment is taken.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
