"use client";

import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

export function UrlForm({ size = "lg", id }: { size?: "lg" | "md"; id?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!url.trim()) return setError("Please enter your website address.");
    setBusy(true);
    try {
      const res = await fetch("/api/analyses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/analyse/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate id={id}>
      <div
        className={clsx(
          "group flex flex-col gap-2 rounded-[28px] bg-white/95 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_24px_60px_-20px_rgba(109,61,245,0.7)] backdrop-blur transition sm:flex-row sm:items-center sm:rounded-full",
          error && "ring-2 ring-rose-300",
        )}
      >
        <label className="flex flex-1 items-center gap-3 pl-4">
          <Globe className="h-5 w-5 shrink-0 text-violet-500" aria-hidden />
          <span className="sr-only">Your business website</span>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your business website…"
            className={clsx("w-full bg-transparent text-ink placeholder:text-ink-faint focus:outline-none", size === "lg" ? "h-12 text-[1.05rem]" : "h-10")}
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : undefined}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className={clsx(
            "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 font-semibold text-white shadow-[0_10px_24px_-8px_rgba(109,61,245,0.9)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70",
            size === "lg" ? "h-13 px-6 py-3.5 text-[0.98rem]" : "h-11 px-5 text-sm",
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Starting…" : "Discover my AI opportunities"}
          {!busy && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </div>
      <p id="url-error" role="alert" className={clsx("mt-3 min-h-5 pl-5 text-sm font-medium", error ? "text-rose-200" : "text-transparent")}>
        {error ?? "."}
      </p>
    </form>
  );
}
