"use client";

import { ArrowUp, BookOpen, Loader2, MessagesSquare, X } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AivyAvatar } from "../brand";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: { playbookId: string; label: string }[];
}

const STORAGE = (id: string) => `aivy_chat_${id}`;

function useChat(analysisId: string, greeting: string) {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE(analysisId));
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, [analysisId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE(analysisId), JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages, analysisId]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content }]);
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ analysisId, message: content, history }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessages((m) => [...m, { role: "assistant", content: d.reply, sources: d.sources }]);
      setRemaining(d.remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  const reset = () => setMessages([{ role: "assistant", content: greeting }]);
  return { messages, busy, remaining, error, send, reset };
}

/** Very small, safe markdown: **bold**, line breaks and bullets. No HTML injection. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className={clsx("block", line === "" && "h-2")}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>))}
        </span>
      ))}
    </>
  );
}

export function ChatPanel({ analysisId, greeting, suggestions, full = false }: { analysisId: string; greeting: string; suggestions: string[]; full?: boolean }) {
  const { messages, busy, remaining, error, send, reset } = useChat(analysisId, greeting);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length > 1 || busy) end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  return (
    <div className={clsx("flex min-h-0 flex-col", full ? "h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-9rem)]" : "h-full")}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-2.5", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && <AivyAvatar size={32} className="mt-1" />}
            <div className={clsx("max-w-[85%] rounded-3xl px-4 py-3 text-[0.95rem] leading-relaxed", m.role === "user" ? "rounded-br-lg bg-violet-600 text-white" : "rounded-tl-lg bg-violet-50 text-ink")}>
              <Rich text={m.content} />
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-violet-200/60 pt-2.5">
                  {m.sources.map((s) => (
                    <Link key={s.playbookId} href={`/dashboard/${analysisId}/implement/${s.playbookId}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                      <BookOpen className="h-3 w-3" /> {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2.5">
            <AivyAvatar size={32} />
            <div className="flex gap-1 rounded-3xl rounded-tl-lg bg-violet-50 px-4 py-4">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="h-2 w-2 rounded-full bg-violet-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />
              ))}
            </div>
          </div>
        )}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pl-10">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-white px-3.5 py-2 text-left text-sm font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50">
                {s}
              </button>
            ))}
          </div>
        )}
        {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
          setInput("");
        }}
        className="border-t border-violet-100 p-3"
      >
        <div className="flex items-end gap-2 rounded-3xl bg-violet-50/70 p-1.5 ring-1 ring-violet-100 focus-within:ring-violet-300">
          <label className="sr-only" htmlFor={`chat-${full ? "full" : "panel"}`}>
            Message Aivy
          </label>
          <textarea
            id={`chat-${full ? "full" : "panel"}`}
            rows={1}
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
                setInput("");
              }
            }}
            placeholder="Ask Aivy anything about your plan…"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.95rem] focus:outline-none"
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-1.5 flex justify-between px-2 text-[11px] text-ink-faint">
          <span>{remaining != null ? `${remaining} messages left in your plan` : "Answers come from your approved Aivy guides"}</span>
          <button type="button" onClick={reset} className="hover:text-ink">
            New chat
          </button>
        </div>
      </form>
    </div>
  );
}

/** Floating Ask Aivy launcher available throughout the dashboard. */
export function ChatLauncher(props: { analysisId: string; greeting: string; suggestions: string[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (path.endsWith("/ask") || path.endsWith("/report")) return null;
  return (
    <div className="no-print">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-4 z-40 flex h-[min(620px,calc(100dvh-8rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(45,20,120,0.45)] ring-1 ring-violet-100 lg:bottom-24 lg:right-8"
            role="dialog"
            aria-label="Ask Aivy"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-white">
              <AivyAvatar size={36} />
              <div className="flex-1">
                <p className="font-bold leading-tight">Ask Aivy</p>
                <p className="text-xs text-violet-100">Your implementation assistant</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ChatPanel {...props} />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-violet-600 py-1.5 pl-1.5 pr-4 font-semibold text-white shadow-[0_16px_40px_-12px_rgba(109,61,245,0.9)] transition hover:bg-violet-700 lg:bottom-8 lg:right-8"
      >
        <AivyAvatar size={36} />
        {open ? "Close" : "Ask Aivy"}
        <MessagesSquare className="h-4 w-4" />
      </button>
    </div>
  );
}
