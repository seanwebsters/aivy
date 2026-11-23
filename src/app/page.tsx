import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  Dumbbell,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  Home,
  Lock,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { Aivy } from "@/components/brand";
import { PlaybookIcon } from "@/components/icon";
import { PlanPreview } from "@/components/landing/plan-preview";
import { Reveal, TrackVisit } from "@/components/landing/reveal";
import { UrlForm } from "@/components/landing/url-form";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { DifficultyPill, ScoreRing, SectionTitle } from "@/components/ui";

const steps = [
  { state: "laptop", n: 1, title: "Tell us about your business", body: "Enter your website. Aivy reads your public pages and asks a few quick questions." },
  { state: "thinking", n: 2, title: "Get your AI plan", body: "See the AI opportunities that genuinely fit — ranked by transparent criteria." },
  { state: "helping", n: 3, title: "Set it up with our guides", body: "Follow step-by-step playbooks with tools, costs, templates and Ask Aivy." },
  { state: "celebrating", n: 4, title: "Start saving time and growing", body: "Track what you've implemented and the results you see." },
] as const;

const industries = [
  [UtensilsCrossed, "Hospitality"],
  [Store, "Retail"],
  [ShoppingBag, "E-commerce"],
  [HeartPulse, "Healthcare"],
  [HardHat, "Construction & trades"],
  [Briefcase, "Professional services"],
  [GraduationCap, "Education"],
  [Home, "Real estate"],
  [Scissors, "Hair & beauty"],
  [Dumbbell, "Fitness"],
  [Factory, "Manufacturing"],
  [Building2, "And many more"],
] as const;

const sample = [
  { icon: "calendar", title: "AI Booking Assistant", body: "Help customers make reservations and answer common questions — sending them to your booking page to confirm.", score: 86, d: 2 as const, benefit: "More bookings" },
  { icon: "megaphone", title: "AI Marketing Assistant", body: "Create campaign drafts, social content and promotional emails in your voice, in one sitting a month.", score: 82, d: 1 as const, benefit: "Time saved" },
  { icon: "message", title: "AI Customer Support", body: "Handle routine customer enquiries and route complex requests to staff.", score: 79, d: 1 as const, benefit: "Faster response" },
];

const included = [
  "Complete personalised AI opportunity report",
  "Prioritised implementation roadmap",
  "Recommended tools and estimated costs",
  "Step-by-step implementation guides",
  "Ready-to-use prompts and templates",
  "Ask Aivy — your implementation assistant",
  "Downloadable report",
  "Your saved Aivy dashboard, for life",
];

const faqs = [
  ["How does the free analysis work?", "Enter your website and Aivy reads your public pages — what you offer, how customers find and contact you. It then asks 3–5 quick questions about things a website can't show, like where your time goes. You'll see your top three AI opportunities free, with no sign-up."],
  ["What do I get for £99?", "Your complete personalised plan: every opportunity we found, a prioritised roadmap, recommended tools with indicative costs, step-by-step setup guides, ready-to-use templates, progress tracking, Ask Aivy, and a downloadable report. It's a one-time payment with lifetime access."],
  ["Is there a subscription?", "No. Aivy is £99, once. Some AI tools we recommend have their own free tiers or paid plans — those are billed by the provider, and we always show indicative costs up front so there are no surprises."],
  ["Will Aivy set everything up for me?", "Aivy gives you guided, step-by-step setup that a non-technical owner can follow, plus an assistant to help when you get stuck. We don't claim to install software into your systems automatically — and we never mark something as \"active\" unless it has actually been set up."],
  ["How do you work out what will help?", "Every recommendation comes from our library of tested AI playbooks. We score each one on business fit, your priorities, readiness and ease, and show you that breakdown. We don't invent savings figures or guess your internal costs."],
  ["Does it work for regulated businesses?", "Yes, with care. For healthcare, legal, financial services and anything involving children, Aivy only recommends appropriate non-advisory uses and flags the specific precautions you need to take."],
  ["What if it isn't useful?", "If your analysis fails or the plan isn't right for your business, email us within 14 days of purchase and we'll refund you."],
];

export default function LandingPage() {
  return (
    <main className="overflow-x-clip bg-night-900">
      <TrackVisit />
      <SiteNav />

      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative isolate min-h-[100svh] overflow-hidden" id="start">
        <Image src="/aivy/hero-bg.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[60%_50%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,8,34,0.92)_0%,rgba(21,13,51,0.72)_38%,rgba(21,13,51,0.12)_70%,rgba(21,13,51,0.05)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-night-900 to-transparent" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:pt-36">
          <div className="relative z-10">
            <Reveal>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-violet-100 ring-1 ring-white/15 backdrop-blur">
                <Sparkles className="h-4 w-4 text-violet-300" /> Meet your new AI expert
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl lg:text-[3.9rem] xl:text-[4.5rem]">
                Your business.
                <br />
                <span className="text-gradient italic sm:whitespace-nowrap pr-2">Upgraded with AI.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-violet-50/85 sm:text-xl">
                Discover exactly how AI could save your business time, reduce costs and unlock new opportunities.
              </p>
            </Reveal>
            <Reveal delay={0.2} className="mt-9 max-w-[640px]">
              <UrlForm />
            </Reveal>
            <Reveal delay={0.28}>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-violet-100/75">
                {["Free analysis in about 60 seconds", "No sign-up", "Any business, any industry"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-violet-300" /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="relative flex min-h-[420px] min-w-0 flex-col items-center justify-end lg:min-h-[560px]">
            <div className="absolute -right-4 top-0 hidden w-[92%] lg:block xl:-right-10">
              <PlanPreview />
            </div>
            <div className="relative z-10 -mb-2 lg:mr-[52%] lg:-mb-6">
              <span aria-hidden className="absolute -top-6 right-6 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-5 w-1 animate-twinkle rounded-full bg-amber" style={{ transform: `rotate(${(i - 1) * 28}deg)`, animationDelay: `${i * 0.3}s` }} />
                ))}
              </span>
              <Aivy state="waving" height={380} priority glow className="max-sm:!h-[300px] max-sm:!w-[268px]" />
            </div>
            <div className="mt-6 w-full lg:hidden">
              <PlanPreview />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- HOW IT WORKS */}
      <section id="how" className="relative scroll-mt-20 bg-night-900 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionTitle dark eyebrow="How it works" title={<>From website to working AI <span className="text-gradient">in four steps</span></>} sub="No consultants, no calls, no jargon. Aivy does the thinking, then walks you through every step." />
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <li className="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 ring-1 ring-white/10 transition hover:ring-violet-300/40">
                  <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl transition group-hover:bg-violet-500/30" />
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-violet-300 to-violet-500 font-bold text-night-900">{s.n}</span>
                    <Aivy state={s.state} height={130} float={false} className="-mr-2 -mt-2 transition duration-500 group-hover:-translate-y-1" />
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-violet-100/70">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ SAMPLE REVEAL */}
      <section className="relative bg-cream py-24 sm:py-28">
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night-900 to-transparent opacity-0" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionTitle
              eyebrow="A real result, for a sample café"
              title={<>We found <span className="text-gradient-ink">8 ways</span> AI could help Riverside Café</>}
              sub="Every opportunity explains what the AI would do, the kind of benefit to expect, how hard it is and its limitations. Scores come from clear criteria — never made-up percentages."
            />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/demo" className="inline-flex h-12 items-center gap-2 rounded-full bg-violet-600 px-6 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(109,61,245,0.8)] transition hover:bg-violet-700">
                Explore the full demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#start" className="font-semibold text-violet-700 hover:text-violet-800">
                Try it on your business →
              </Link>
            </div>
          </Reveal>
          <div className="relative">
            <Aivy state="discovering" height={170} className="absolute -right-2 -top-28 z-10 hidden sm:block" />
            <div className="space-y-4">
              {sample.map((o, i) => (
                <Reveal key={o.title} delay={i * 0.1}>
                  <article className="flex gap-4 rounded-3xl bg-white p-5 shadow-lift ring-1 ring-violet-100 sm:p-6">
                    <PlaybookIcon name={o.icon} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">#{i + 1} opportunity</p>
                          <h3 className="text-lg font-bold">{o.title}</h3>
                        </div>
                        <ScoreRing value={o.score} size={52} />
                      </div>
                      <p className="mt-1.5 text-ink-soft">{o.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <DifficultyPill d={o.d} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          <Zap className="h-3 w-3" /> {o.benefit}
                        </span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
              <Reveal delay={0.3}>
                <div className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-violet-200 p-5 text-ink-soft">
                  <Lock className="h-5 w-5 text-violet-500" /> + 5 more opportunities, a roadmap and setup guides in the full plan
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- INDUSTRIES */}
      <section id="industries" className="scroll-mt-20 bg-cream pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-[36px] bg-white p-8 shadow-soft ring-1 ring-violet-100 sm:p-12">
            <Reveal>
              <SectionTitle center eyebrow="Industries" title="Built for any business" sub="From cafés to construction firms, Aivy tailors every recommendation to how your kind of business actually works." />
            </Reveal>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {industries.map(([Icon, label], i) => (
                <Reveal key={label} delay={i * 0.03}>
                  <li className="flex h-full flex-col items-center gap-3 rounded-2xl bg-violet-50/60 p-5 text-center ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-soft">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold">{label}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
              <ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" /> Regulated industries get extra care: Aivy only recommends appropriate uses and flags the precautions you need.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- PRICING */}
      <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-night-900 py-24 sm:py-28">
        <div aria-hidden className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <SectionTitle dark eyebrow="What you get" title={<>Free to discover. <span className="text-gradient">£99 to transform.</span></>} sub="See your top three opportunities for free. Unlock everything you need to make them happen with one simple payment." />
            <div className="mt-8 flex items-center gap-4">
              <Aivy state="helping" height={200} />
              <p className="max-w-xs text-violet-100/70">“I'll be right here in your dashboard whenever you need a hand.”</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[32px] bg-gradient-to-b from-violet-300/50 to-white/10 p-[1.5px] shadow-glow">
              <div className="rounded-[31px] bg-night-800/95 p-8 backdrop-blur sm:p-10">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-semibold text-white">Complete AI Upgrade Plan</p>
                  <span className="rounded-full bg-violet-400/20 px-3 py-1 text-xs font-semibold text-violet-200">One-time</span>
                </div>
                <p className="mt-4 flex items-end gap-2 text-white">
                  <span className="text-6xl font-extrabold tracking-tight">£99</span>
                  <span className="mb-2 text-violet-100/60">once. No subscription.</span>
                </p>
                <ul className="mt-8 space-y-3">
                  {included.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-violet-50/90">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/25">
                        <Check className="h-3.5 w-3.5 text-violet-200" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="#start" className="mt-9 flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-300 via-violet-200 to-[#f6d9ff] text-base font-semibold text-night-900 shadow-[0_16px_40px_-12px_rgba(164,124,255,0.9)] transition hover:brightness-105">
                  Start with a free analysis <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-xs text-violet-100/50">Third-party AI tools are billed separately by their providers. Indicative costs are shown in your plan.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ TRUST */}
      <section className="bg-cream py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionTitle center eyebrow="Straight talking" title="Honest about what AI can do for you" />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl bg-white p-8 shadow-soft ring-1 ring-violet-100">
                <p className="mb-5 font-bold text-emerald-700">Aivy will</p>
                <ul className="space-y-3">
                  {["Only recommend tested, supported AI workflows", "Separate what we found on your website from what you told us", "Show indicative tool costs before you commit", "Flag risks, limitations and privacy precautions", "Keep a person in the loop for anything customer-facing"].map((t) => (
                    <li key={t} className="flex gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl bg-white p-8 shadow-soft ring-1 ring-violet-100">
                <p className="mb-5 font-bold text-rose-700">Aivy won&apos;t</p>
                <ul className="space-y-3">
                  {["Invent savings figures or guess your internal costs", "Pretend software is installed when it isn't", "Recommend AI for medical, legal or financial advice", "Lock you into a subscription", "Sell your data"].map((t) => (
                    <li key={t} className="flex gap-3">
                      <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQS */}
      <section id="faqs" className="scroll-mt-20 bg-cream pb-24 sm:pb-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <SectionTitle center eyebrow="FAQs" title="Questions, answered" />
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white p-5 shadow-soft ring-1 ring-violet-100 open:ring-violet-200 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- FINAL CTA */}
      <section className="relative isolate overflow-hidden py-24 sm:py-32">
        <Image src="/aivy/hero-bg-sm.webp" alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-night-900/70" />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
          <Aivy state="celebrating" height={210} />
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to meet <span className="text-gradient italic">your AI expert?</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-violet-50/80">It takes about a minute to find out what AI could do for your business.</p>
          <div className="mt-8 w-full max-w-xl text-left">
            <UrlForm size="md" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
