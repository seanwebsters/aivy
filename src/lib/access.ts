import "server-only";
import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { getAnalysis, getEntitlement } from "./store";
import type { Analysis } from "./types";

/**
 * Prototype access model: each browser gets an unguessable, httpOnly
 * owner key. Analyses are bound to it. Phase 3 replaces this with
 * Supabase Auth (magic link) — paid customers will also be able to sign
 * in from any device using the email they paid with.
 */
export const OWNER_COOKIE = "aivy_owner";

export async function readOwnerKey(): Promise<string | undefined> {
  return (await cookies()).get(OWNER_COOKIE)?.value;
}

/** Only callable from route handlers / server actions (sets a cookie). */
export async function ensureOwnerKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(OWNER_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{20,}$/.test(existing)) return existing;
  const key = randomBytes(24).toString("base64url");
  jar.set(OWNER_COOKIE, key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 400 });
  return key;
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function canView(a: Analysis): Promise<boolean> {
  if (a.ownerKey === "*") return true;
  const key = await readOwnerKey();
  return !!key && same(key, a.ownerKey);
}

export async function loadOwned(id: string) {
  const a = await getAnalysis(id);
  if (!a || !(await canView(a))) return null;
  const entitlement = await getEntitlement(id);
  return { analysis: a, entitled: !!entitlement, entitlement };
}
