import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { Activity, AlertTriangle, CircleDollarSign, Cpu, Eye, LifeBuoy, Percent, Receipt } from "lucide-react";
import { Logo } from "@/components/brand";
import { aiConfig } from "@/lib/ai/provider";
import { getStripe, PRICE_PENCE } from "@/lib/payments";
import { listAnalyses, listEntitlements, listEvents, opsSnapshot, spendToday } from "@/lib/store";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const STRIPE_FEE = (pence: number) => Math.round(pence * 0.015 + 20); // UK standard card estimate
const USD_TO_GBP = Number(process.env.AIVY_USD_TO_GBP ?? 0.79);

function authorised(token?: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!authorised(token)) notFound();

  const [analyses, ents, events, ops, today] = await Promise.all([listAnalyses(), listEntitlements(), listEvents(), opsSnapshot(), spendToday()]);
  const real = analyses.filter((a) => a.mode !== "demo");
  const paid = ents.filter((e) => e.source !== "demo");
  const refunded = paid.filter((e) => e.refundedAt);
  const visits = Object.values(ops.visits).reduce((s, n) => s + n, 0);
  const completed = real.filter((a) => a.status === "complete").length;
  const failed = real.filter((a) => a.status === "failed");
  const revenue = paid.filter((e) => !e.refundedAt).reduce((s, e) => s + e.amount, 0);
  const aiUsd = real.reduce((s, a) => s + a.costs.reduce((x, c) => x + c.usd, 0), 0);
  const aiGbpPence = Math.round(aiUsd * USD_TO_GBP * 100);
  const fees = paid.reduce((s, e) => s + STRIPE_FEE(e.amount), 0);
  const margin = revenue ? Math.round(((revenue - fees - aiGbpPence) / revenue) * 100) : 0;
  const escalations = events.filter((e) => e.type === "support_escalation");
  const errors = events.filter((e) => e.level === "error");
  const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  const stats = [
    [Eye, "Visitors", visits, "unique sessions"],
    [Activity, "Analyses", real.length, `${pct(completed, real.length)} completed`],
    [Percent, "Conversion", pct(paid.length, completed), "of completed analyses"],
    [CircleDollarSign, "Revenue", gbp(revenue), `${paid.length} purchases · ${refunded.length} refunds`],
    [Cpu, "AI cost / customer", real.length ? `$${(aiUsd / real.length).toFixed(3)}` : "—", `$${today.toFixed(2)} today`],
    [Receipt, "Gross margin (est.)", revenue ? `${margin}%` : "—", "after Stripe fees & AI"],
    [AlertTriangle, "Failed analyses", failed.length, `${errors.length} errors logged`],
    [LifeBuoy, "Support escalations", escalations.length, "from Ask Aivy"],
  ] as const;

  const health = [
    ["AI provider", aiConfig() ? `${aiConfig()!.provider} · ${aiConfig()!.model}` : "Not configured — heuristic mode", !!aiConfig()],
    ["Payments", getStripe() ? "Stripe (live keys? check dashboard)" : "Simulated (test mode)", !!getStripe()],
    ["Stripe webhook", process.env.STRIPE_WEBHOOK_SECRET ? "Signing secret set" : "Not configured", !!process.env.STRIPE_WEBHOOK_SECRET],
    ["Email", process.env.RESEND_API_KEY ? "Resend" : "Simulated (logged only)", !!process.env.RESEND_API_KEY],
    ["Website extraction", process.env.FIRECRAWL_API_KEY ? "Firecrawl + direct fallback" : "Direct fetch", true],
    ["Storage", "Local JSON file (prototype)", false],
    ["Error monitoring", process.env.SENTRY_DSN ? "Sentry DSN set" : "Structured logs only", !!process.env.SENTRY_DSN],
    ["Daily AI budget", `$${Number(process.env.AIVY_DAILY_AI_BUDGET_USD ?? 20)} cap`, true],
  ] as const;

  return (
    <main className="min-h-dvh bg-[#f6f4fb]">
      <header className="flex items-center justify-between border-b border-violet-100 bg-white px-6 py-4">
        <Logo />
        <span className="rounded-full bg-night-900 px-3 py-1 text-xs font-semibold text-white">Operations</span>
      </header>
      {!process.env.ADMIN_TOKEN && <p className="bg-amber-100 px-6 py-2 text-sm text-amber-900">ADMIN_TOKEN isn&apos;t set — this page is open in development only and hidden in production.</p>}
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([Icon, label, v, sub]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-violet-100">
              <Icon className="h-5 w-5 text-violet-500" />
              <p className="mt-3 text-2xl font-extrabold tracking-tight">{v}</p>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-ink-faint">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-violet-100">
            <h2 className="font-bold">System health</h2>
            <ul className="mt-3 divide-y divide-violet-50">
              {health.map(([k, v, ok]) => (
                <li key={k} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{k}</span>
                  <span className="flex items-center gap-2 text-right text-ink-soft">
                    {v} <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-amber"}`} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-violet-100">
            <h2 className="font-bold">Recent events</h2>
            <ul className="mt-3 max-h-96 space-y-1.5 overflow-auto text-sm">
              {events.slice(0, 60).map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.level === "error" ? "bg-rose-500" : e.level === "warn" ? "bg-amber" : "bg-violet-300"}`} />
                  <span className="w-36 shrink-0 text-xs text-ink-faint">{new Date(e.at).toLocaleString("en-GB")}</span>
                  <span className="font-mono text-xs text-violet-700">{e.type}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">{e.message}</span>
                </li>
              ))}
              {!events.length && <li className="text-ink-faint">No events yet.</li>}
            </ul>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-violet-100">
          <h2 className="p-5 font-bold">Analyses</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-violet-50/60 text-xs uppercase tracking-wider text-ink-faint">
                <tr>
                  {["Created", "Domain", "Industry", "Status", "Mode", "Opps", "AI cost", "Paid", "Assistant"].map((h) => (
                    <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50">
                {analyses.slice(0, 100).map((a) => {
                  const e = ents.find((x) => x.analysisId === a.id);
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-ink-faint">{new Date(a.createdAt).toLocaleString("en-GB")}</td>
                      <td className="px-5 py-2.5 font-medium">{a.domain}</td>
                      <td className="px-5 py-2.5">{a.profile?.industryLabel ?? "—"}</td>
                      <td className="px-5 py-2.5">
                        <span className={a.status === "failed" ? "text-rose-600" : a.status === "complete" ? "text-emerald-600" : "text-amber-700"}>{a.status}</span>
                        {a.error && <span className="block max-w-56 truncate text-xs text-ink-faint">{a.error}</span>}
                      </td>
                      <td className="px-5 py-2.5">{a.mode}</td>
                      <td className="px-5 py-2.5">{a.opportunities?.length ?? "—"}</td>
                      <td className="px-5 py-2.5">${a.costs.reduce((s, c) => s + c.usd, 0).toFixed(4)}</td>
                      <td className="px-5 py-2.5">{e ? `${e.source}${e.refundedAt ? " (refunded)" : ""}` : "—"}</td>
                      <td className="px-5 py-2.5">{a.assistant.used}/{a.assistant.limit}{a.assistant.flagged ? ` · ${a.assistant.flagged}⚑` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <p className="text-xs text-ink-faint">Price £{PRICE_PENCE / 100}. Stripe fees estimated at 1.5% + 20p; AI cost converted at {USD_TO_GBP} GBP/USD. Figures are estimates for operational monitoring.</p>
      </div>
    </main>
  );
}
