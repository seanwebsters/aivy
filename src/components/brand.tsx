"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";

export type AivyState = "idle" | "waving" | "thinking" | "scanning" | "discovering" | "celebrating" | "helping" | "laptop";

const DIMS: Record<AivyState, [number, number]> = {
  idle: [553, 720],
  waving: [642, 720],
  thinking: [548, 720],
  scanning: [720, 706],
  discovering: [592, 720],
  celebrating: [649, 720],
  helping: [628, 720],
  laptop: [630, 720],
};

const ALT: Record<AivyState, string> = {
  idle: "Aivy, a fluffy lavender cloud character with purple aviator goggles, smiling",
  waving: "Aivy waving hello",
  thinking: "Aivy thinking, paw on chin",
  scanning: "Aivy scanning with glowing goggles",
  discovering: "Aivy holding up a glowing star idea",
  celebrating: "Aivy jumping for joy",
  helping: "Aivy holding a clipboard and pointing helpfully",
  laptop: "Aivy typing on a tiny laptop",
};

/** The Aivy mascot. Subtle "alive" motion: float + breathe. Respects reduced motion. */
export function Aivy({
  state = "idle",
  height = 320,
  className,
  priority,
  float = true,
  glow = false,
}: {
  state?: AivyState;
  height?: number;
  className?: string;
  priority?: boolean;
  float?: boolean;
  glow?: boolean;
}) {
  const reduce = useReducedMotion();
  const [w, h] = DIMS[state];
  const width = Math.round((w / h) * height);
  return (
    <motion.div
      className={clsx("relative select-none", className)}
      style={{ width, height }}
      animate={float && !reduce ? { y: [0, -8, 0], scale: [1, 1.012, 1] } : undefined}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {glow && <div aria-hidden className="absolute inset-[12%] rounded-full bg-violet-400/40 blur-3xl" />}
      <motion.div key={state} initial={reduce ? false : { opacity: 0, scale: 0.94, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="relative h-full w-full">
        <Image src={`/aivy/aivy-${state}.webp`} alt={ALT[state]} width={width} height={height} priority={priority} className="h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(60,20,140,0.28)]" />
      </motion.div>
    </motion.div>
  );
}

export function AivyAvatar({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={clsx("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-violet-200 to-violet-100 ring-2 ring-white", className)} style={{ width: size, height: size }}>
      <Image src="/aivy/aivy-avatar.webp" alt="" width={size} height={size} className="scale-125" />
    </span>
  );
}

/** Star-A logomark, matching the badge on Aivy's satchel. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="aivy-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9dcff" />
          <stop offset="0.55" stopColor="#a47cff" />
          <stop offset="1" stopColor="#ff9ec7" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 9.2 27.8a1.3 1.3 0 0 0 2.3 1.1L16 22l4.5 6.9a1.3 1.3 0 0 0 2.3-1.1Z" fill="url(#aivy-g)" />
      <path d="M3.5 17.6c6.4-2.6 15.5-3.9 25-2.4.9.1.9 1.4 0 1.6-8.2 1.4-15.7 2.6-24.4 2.5-1 0-1.4-1.3-.6-1.7Z" fill="url(#aivy-g)" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" className={clsx("inline-flex items-center gap-2 font-extrabold tracking-tight", dark ? "text-white" : "text-ink", className)} aria-label="Aivy home">
      <LogoMark className="h-8 w-8" />
      <span className="text-[1.6rem] leading-none">Aivy</span>
    </Link>
  );
}
