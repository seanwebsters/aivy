"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useState } from "react";

export function CheckoutButton({ analysisId }: { analysisId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function go() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ analysisId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.assign(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout is unavailable right now.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button onClick={go} disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-base font-semibold text-white shadow-[0_16px_32px_-12px_rgba(109,61,245,0.9)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Opening secure checkout…" : "Unlock my plan — £99"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
