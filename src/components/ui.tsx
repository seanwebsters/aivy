import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/types";

type Variant = "primary" | "glow" | "secondary" | "ghost" | "dark";

const variants: Record<Variant, string> = {
  primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-[0_10px_24px_-10px_rgba(109,61,245,0.8)]",
  glow: "bg-gradient-to-r from-violet-300 via-violet-200 to-[#f6d9ff] text-night-900 hover:brightness-105 shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_16px_40px_-12px_rgba(164,124,255,0.9)]",
  secondary: "bg-white text-ink ring-1 ring-violet-200 hover:ring-violet-300 hover:bg-violet-50",
  ghost: "text-ink-soft hover:text-ink hover:bg-violet-50",
  dark: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 backdrop-blur",
};

const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-[0.95rem]", lg: "h-14 px-7 text-base" };

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={clsx(base, variants[variant], sizes[size], className)} {...p} />;
}

export function Card({ className, children, ...p }: ComponentProps<"div">) {
  return (
    <div className={clsx("rounded-3xl bg-white shadow-soft ring-1 ring-violet-100/80", className)} {...p}>
      {children}
    </div>
  );
}

export function Pill({ tone = "violet", children, className }: { tone?: "violet" | "mint" | "amber" | "grey" | "rose"; children: ReactNode; className?: string }) {
  const t = {
    violet: "bg-violet-100 text-violet-700",
    mint: "bg-mint-soft text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    grey: "bg-slate-100 text-slate-600",
    rose: "bg-rose-50 text-rose-700",
  }[tone];
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", t, className)}>{children}</span>;
}

export function DifficultyPill({ d }: { d: Difficulty }) {
  return (
    <Pill tone={d === 1 ? "mint" : d === 2 ? "amber" : "rose"}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={clsx("h-1.5 w-1.5 rounded-full", i <= d ? "bg-current" : "bg-current/25")} />
        ))}
      </span>
      {DIFFICULTY_LABEL[d]}
    </Pill>
  );
}

/** Impact score ring — the number is explained by the transparent criteria wherever it's shown. */
export function ScoreRing({ value, size = 56, dark = false }: { value: number; size?: number; dark?: boolean }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Impact score ${value} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} className={dark ? "stroke-white/10" : "stroke-violet-100"} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} fill="none" strokeLinecap="round" stroke="url(#ring-g)" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8a5cff" />
            <stop offset="1" stopColor="#ff9ec7" />
          </linearGradient>
        </defs>
      </svg>
      <span className={clsx("absolute inset-0 flex items-center justify-center text-sm font-bold", dark ? "text-white" : "text-ink")}>{value}</span>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, sub, dark, center }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; dark?: boolean; center?: boolean }) {
  return (
    <div className={clsx("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className={clsx("mb-3 text-sm font-semibold uppercase tracking-[0.14em]", dark ? "text-violet-300" : "text-violet-600")}>{eyebrow}</p>}
      <h2 className={clsx("text-3xl font-extrabold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]", dark ? "text-white" : "text-ink")}>{title}</h2>
      {sub && <p className={clsx("mt-4 text-lg leading-relaxed", dark ? "text-violet-100/75" : "text-ink-soft")}>{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-violet-100", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blush transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export const gbp = (n: number) => (n === 0 ? "£0" : `£${n}`);
