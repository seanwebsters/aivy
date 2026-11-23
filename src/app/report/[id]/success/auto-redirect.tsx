"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRedirect({ href, delay = 3200 }: { href: string; delay?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push(href), delay);
    return () => clearTimeout(t);
  }, [href, delay, router]);
  return null;
}
