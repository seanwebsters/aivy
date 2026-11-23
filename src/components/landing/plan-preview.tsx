"use client";

import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, Check, FileText, LayoutGrid, Megaphone, MessageCircle, Wrench, BookOpen } from "lucide-react";
import { LogoMark } from "../brand";

const rows = [
  { icon: CalendarDays, title: "AI Booking Assistant", sub: "Take reservations 24/7" },
  { icon: Megaphone, title: "AI Marketing Assistant", sub: "Create posts, emails and offers" },
  { icon: MessageCircle, title: "AI Customer Support", sub: "Answer common questions instantly" },
];

/** Product preview card in the hero — a stylised view of the real dashboard. */
export function PlanPreview() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30, rotateY: -12 }}
      animate={{ opacity: 1, y: 0, rotateY: -6 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1400 }}
      className="w-[min(560px,100%)] rounded-[26px] bg-gradient-to-b from-white/25 to-white/5 p-[1.5px] shadow-glow"
      aria-label="Preview of an Aivy implementation plan"
      role="img"
    >
      <div className="flex overflow-hidden rounded-[25px] bg-night-900/90 backdrop-blur-xl">
        <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-white/5 bg-night-950/60 p-3 sm:flex">
          <div className="mb-3 flex items-center gap-1.5 px-2 pt-1 text-sm font-bold text-white">
            <LogoMark className="h-4 w-4" /> Aivy
          </div>
          {[
            [LayoutGrid, "Your Plan", true],
            [Wrench, "AI Tools"],
            [BookOpen, "Setup Guides"],
            [FileText, "Templates"],
          ].map(([I, label, active]) => {
            const Icon = I as typeof LayoutGrid;
            return (
              <div key={label as string} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${active ? "bg-violet-500/25 text-white" : "text-violet-100/60"}`}>
                <Icon className="h-3.5 w-3.5" /> {label as string}
              </div>
            );
          })}
        </div>
        <div className="relative flex-1 p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
          <p className="text-[15px] font-bold text-white sm:text-lg">Your AI Implementation Plan</p>
          <p className="mb-4 text-xs text-violet-200/70">Riverside Café · Sample</p>
          <div className="space-y-2.5">
            {rows.map((r, i) => (
              <motion.div
                key={r.title}
                initial={reduce ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.18, duration: 0.5 }}
                className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/[0.06]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-white">
                  <r.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white">{r.title}</p>
                  <p className="truncate text-[11px] text-violet-100/60">{r.sub}</p>
                </div>
                <span className="hidden items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-300 sm:inline-flex">
                  <Check className="h-3 w-3" /> Ready to set up
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
