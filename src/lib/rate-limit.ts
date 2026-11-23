import "server-only";
import { headers } from "next/headers";

/** In-memory sliding-window limiter. Production: swap for Upstash/Redis or a Supabase table. */
const g = globalThis as unknown as { __aivyRl?: Map<string, number[]> };
const buckets = (g.__aivyRl ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (hits.length >= limit) return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
