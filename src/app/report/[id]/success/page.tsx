import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Aivy, Logo } from "@/components/brand";
import { loadOwned } from "@/lib/access";
import { verifyAndFulfil } from "@/lib/payments";
import { logEvent } from "@/lib/store";
import { AutoRedirect } from "./auto-redirect";

export const metadata: Metadata = { title: "Welcome aboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { id } = await params;
  const { session_id } = await searchParams;
  const owned = await loadOwned(id);
  if (!owned) notFound();

  // Verify payment on the server — the redirect alone never unlocks anything.
  let ok = owned.entitled;
  let reason: string | undefined;
  if (!ok && session_id) {
    try {
      const r = await verifyAndFulfil(session_id, id);
      ok = r.ok;
      reason = r.reason;
    } catch (e) {
      reason = "We couldn't confirm your payment just yet.";
      await logEvent({ level: "error", type: "verify_failed", message: String(e), analysisId: id });
    }
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night-900 px-5 text-center">
      <Image src="/aivy/hero-bg.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-60" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-night-900/60" />
      <div className="absolute left-0 right-0 top-0 mx-auto flex max-w-6xl px-5 py-6">
        <Logo dark />
      </div>
      <Aivy state={ok ? "celebrating" : "thinking"} height={280} priority glow />
      {ok ? (
        <>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            You&apos;re all set. <span className="text-gradient italic">Let&apos;s upgrade.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-violet-50/80">Payment confirmed. Your personalised AI headquarters is ready — I&apos;ll take you there now.</p>
          <Link href={`/dashboard/${id}`} className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-violet-300 via-violet-200 to-[#f6d9ff] px-8 font-semibold text-night-900 shadow-[0_16px_40px_-12px_rgba(164,124,255,0.9)]">
            Open my dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <AutoRedirect href={`/dashboard/${id}`} />
        </>
      ) : (
        <>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Confirming your payment…</h1>
          <p className="mt-4 max-w-lg text-violet-50/80">{reason ?? "This can take a few seconds."} If you've been charged, your plan will unlock automatically — no need to pay again.</p>
          <Link href={`/report/${id}/success${session_id ? `?session_id=${encodeURIComponent(session_id)}` : ""}`} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 font-semibold text-white ring-1 ring-white/20">
            <RefreshCw className="h-4 w-4" /> Check again
          </Link>
          <p className="mt-6 text-sm text-violet-100/60">Still stuck? Email support@aivy.ai with your receipt.</p>
        </>
      )}
    </main>
  );
}
