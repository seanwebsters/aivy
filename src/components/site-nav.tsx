"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Logo } from "./brand";

const links = [
  ["How it works", "/#how"],
  ["Industries", "/#industries"],
  ["What you get", "/#pricing"],
  ["FAQs", "/#faqs"],
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "bg-night-900/80 py-3 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl" : "py-5")}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <Logo dark />
        <ul className="hidden items-center gap-9 md:flex">
          {links.map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-[0.95rem] font-medium text-violet-50/85 transition hover:text-white">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/demo" className="text-[0.95rem] font-medium text-violet-50/85 hover:text-white">
            See a demo
          </Link>
          <Link href="/#start" className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-violet-300 to-[#efd9ff] px-5 font-semibold text-night-900 shadow-[0_10px_30px_-10px_rgba(196,168,255,0.9)] transition hover:brightness-105">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <button className="rounded-full p-2 text-white md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="mx-4 mt-3 rounded-3xl bg-night-800/95 p-4 backdrop-blur-xl md:hidden">
          {[...links, ["See a demo", "/demo"]].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 font-medium text-white hover:bg-white/5">
              {label}
            </Link>
          ))}
          <Link href="/#start" onClick={() => setOpen(false)} className="mt-2 flex h-12 items-center justify-center rounded-full bg-violet-300 font-semibold text-night-900">
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-night-950 text-violet-100/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">Meet your new AI expert. Personalised AI plans and step-by-step guides for every kind of business.</p>
        </div>
        {[
          ["Product", [["How it works", "/#how"], ["See a demo", "/demo"], ["Pricing", "/#pricing"]]],
          ["Company", [["FAQs", "/#faqs"], ["Contact", "mailto:support@aivy.ai"]]],
          ["Legal", [["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"]]],
        ].map(([title, items]) => (
          <div key={title as string}>
            <p className="mb-3 text-sm font-semibold text-white">{title as string}</p>
            <ul className="space-y-2 text-sm">
              {(items as string[][]).map(([l, h]) => (
                <li key={l}>
                  <Link href={h} className="hover:text-white">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs">© {new Date().getFullYear()} Aivy. Third-party AI tools are billed separately by their providers.</div>
    </footer>
  );
}
