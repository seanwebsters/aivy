"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

export function SimulatedForm({ session }: { session: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/checkout/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session, email }) });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error);
      setBusy(false);
      return;
    }
    window.location.assign(d.url);
  }
  return (
    <form onSubmit={pay} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200 sm:p-8">
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-violet-500 focus:outline-none" />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Card information
        <input disabled value="4242 4242 4242 4242   12/34   123" className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500" />
      </label>
      <button disabled={busy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 font-semibold text-white hover:bg-violet-700 disabled:opacity-70">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay £99.00 (test)
      </button>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </form>
  );
}
