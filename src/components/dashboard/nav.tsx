"use client";

import { BarChart3, Download, LayoutDashboard, Map, MessagesSquare, Wand2, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Logo } from "../brand";

export function DashboardNav({ id, name, demo }: { id: string; name: string; demo: boolean }) {
  const path = usePathname();
  const base = `/dashboard/${id}`;
  const items = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/roadmap`, label: "AI Roadmap", icon: Map },
    { href: `${base}/implement`, label: "Implementation", icon: Wrench },
    { href: `${base}/toolkit`, label: "AI Toolkit", icon: Wand2 },
    { href: `${base}/ask`, label: "Ask Aivy", icon: MessagesSquare },
    { href: `${base}/results`, label: "Your Results", icon: BarChart3 },
  ];
  const active = (h: string, exact?: boolean) => (exact ? path === h : path.startsWith(h));
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-violet-100 bg-white/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-6 rounded-2xl bg-violet-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">{demo ? "Demo workspace" : "Your workspace"}</p>
          <p className="truncate font-bold">{name}</p>
        </div>
        <nav className="mt-6 flex-1 space-y-1" aria-label="Dashboard">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active(it.href, it.exact) ? "page" : undefined}
              className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition", active(it.href, it.exact) ? "bg-violet-600 text-white shadow-[0_8px_20px_-10px_rgba(109,61,245,0.9)]" : "text-ink-soft hover:bg-violet-50 hover:text-ink")}
            >
              <it.icon className="h-[18px] w-[18px]" /> {it.label}
            </Link>
          ))}
        </nav>
        <Link href={`${base}/report`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium text-ink-soft hover:bg-violet-50 hover:text-ink">
          <Download className="h-[18px] w-[18px]" /> Download report
        </Link>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-violet-100 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo className="scale-90" />
        <p className="max-w-[50%] truncate text-sm font-semibold text-ink-soft">{name}</p>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-violet-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Dashboard">
        {items.map((it) => (
          <Link key={it.href} href={it.href} aria-current={active(it.href, it.exact) ? "page" : undefined} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", active(it.href, it.exact) ? "text-violet-600" : "text-ink-faint")}>
            <it.icon className="h-5 w-5" />
            {it.label.replace("AI ", "").replace("Your ", "")}
          </Link>
        ))}
      </nav>
    </>
  );
}
