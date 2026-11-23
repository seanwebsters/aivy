import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readOwnerKey } from "@/lib/access";
import { simulatedPaymentsAllowed } from "@/lib/payments";
import { getAnalysis, getSession } from "@/lib/store";
import { SimulatedForm } from "./simulated-form";
import { LogoMark } from "@/components/brand";

export const metadata: Metadata = { title: "Test checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SimulatedCheckout({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  if (!simulatedPaymentsAllowed()) notFound();
  const { session } = await searchParams;
  const s = session ? await getSession(session) : undefined;
  if (!s || s.ownerKey !== (await readOwnerKey())) notFound();
  const a = await getAnalysis(s.analysisId);
  return (
    <main className="min-h-dvh bg-[#f6f5fb]">
      <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">TEST MODE — this is a simulated checkout. No real payment will be taken.</div>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink-soft">
            <LogoMark className="h-6 w-6" /> Aivy
          </p>
          <p className="mt-8 text-ink-soft">Complete AI Upgrade Plan</p>
          <p className="text-5xl font-bold tracking-tight">£99.00</p>
          <p className="mt-2 text-sm text-ink-soft">For {a?.profile?.name ?? a?.domain}. One-time payment.</p>
        </div>
        <SimulatedForm session={s.id} />
      </div>
    </main>
  );
}
