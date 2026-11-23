import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Analysis, AppEvent, CheckoutSession, Entitlement } from "./types";

/**
 * Persistence layer.
 *
 * Prototype implementation: a single JSON file (`.data/db.json`) with an
 * in-process cache and serialised atomic writes. Good for local development
 * and a single long-running server.
 *
 * Production: replace with the Supabase implementation described in
 * `supabase/migrations/0001_init.sql` (same function signatures). Serverless
 * hosts like Vercel do NOT keep files between requests.
 */

interface Db {
  analyses: Record<string, Analysis>;
  entitlements: Record<string, Entitlement>; // key: analysisId
  sessions: Record<string, CheckoutSession>;
  processedStripeEvents: string[];
  events: AppEvent[];
  spend: Record<string, number>; // YYYY-MM-DD -> USD
  visits: Record<string, number>; // YYYY-MM-DD -> count
}

const empty = (): Db => ({ analyses: {}, entitlements: {}, sessions: {}, processedStripeEvents: [], events: [], spend: {}, visits: {} });

const g = globalThis as unknown as { __aivyDb?: Db; __aivyWrite?: Promise<void>; __aivyLoad?: Promise<Db> };
const DIR = process.env.AIVY_DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

async function load(): Promise<Db> {
  if (g.__aivyDb) return g.__aivyDb;
  if (!g.__aivyLoad) {
    g.__aivyLoad = (async () => {
      try {
        const raw = await fs.readFile(FILE, "utf8");
        g.__aivyDb = { ...empty(), ...(JSON.parse(raw) as Partial<Db>) };
      } catch {
        g.__aivyDb = empty();
      }
      return g.__aivyDb;
    })();
  }
  return g.__aivyLoad;
}

function persist(): Promise<void> {
  const run = async () => {
    await fs.mkdir(DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(g.__aivyDb));
    await fs.rename(tmp, FILE);
  };
  g.__aivyWrite = (g.__aivyWrite ?? Promise.resolve()).then(run, run);
  return g.__aivyWrite;
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- analyses ---------------- */

export async function getAnalysis(id: string): Promise<Analysis | undefined> {
  const db = await load();
  const a = db.analyses[id];
  return a ? structuredClone(a) : undefined;
}

export async function saveAnalysis(a: Analysis): Promise<void> {
  const db = await load();
  a.updatedAt = new Date().toISOString();
  db.analyses[a.id] = structuredClone(a);
  await persist();
}

export async function updateAnalysis(id: string, fn: (a: Analysis) => void | Promise<void>): Promise<Analysis | undefined> {
  const a = await getAnalysis(id);
  if (!a) return undefined;
  await fn(a);
  await saveAnalysis(a);
  return a;
}

export async function listAnalyses(): Promise<Analysis[]> {
  const db = await load();
  return Object.values(db.analyses).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- entitlements ---------------- */

export async function getEntitlement(analysisId: string): Promise<Entitlement | undefined> {
  const db = await load();
  const e = db.entitlements[analysisId];
  return e && !e.refundedAt ? e : undefined;
}

/** Idempotent: granting twice for the same analysis/session is a no-op. */
export async function grantEntitlement(e: Entitlement): Promise<{ created: boolean }> {
  const db = await load();
  if (db.entitlements[e.analysisId]) return { created: false };
  db.entitlements[e.analysisId] = e;
  await persist();
  return { created: true };
}

export async function markRefunded(analysisId: string) {
  const db = await load();
  const e = db.entitlements[analysisId];
  if (e && !e.refundedAt) {
    e.refundedAt = new Date().toISOString();
    await persist();
  }
}

export async function listEntitlements(): Promise<Entitlement[]> {
  const db = await load();
  return Object.values(db.entitlements);
}

/* ---------------- checkout sessions ---------------- */

export async function saveSession(s: CheckoutSession) {
  const db = await load();
  db.sessions[s.id] = s;
  await persist();
}
export async function getSession(id: string) {
  const db = await load();
  return db.sessions[id];
}

/** Returns true the first time an event id is seen (webhook idempotency). */
export async function markStripeEventProcessed(eventId: string): Promise<boolean> {
  const db = await load();
  if (db.processedStripeEvents.includes(eventId)) return false;
  db.processedStripeEvents.push(eventId);
  if (db.processedStripeEvents.length > 5000) db.processedStripeEvents.splice(0, 1000);
  await persist();
  return true;
}

/* ---------------- ops: events, spend, visits ---------------- */

export async function logEvent(ev: Omit<AppEvent, "at">) {
  const db = await load();
  const full = { ...ev, at: new Date().toISOString() };
  db.events.unshift(full);
  if (db.events.length > 500) db.events.length = 500;
  console[ev.level === "error" ? "error" : ev.level === "warn" ? "warn" : "log"](JSON.stringify({ svc: "aivy", ...full }));
  await persist();
}

export async function listEvents() {
  return (await load()).events;
}

export async function spendToday(): Promise<number> {
  return (await load()).spend[today()] ?? 0;
}

export async function recordSpend(usd: number) {
  const db = await load();
  db.spend[today()] = (db.spend[today()] ?? 0) + usd;
  await persist();
}

export async function recordVisit() {
  const db = await load();
  db.visits[today()] = (db.visits[today()] ?? 0) + 1;
  await persist();
}

export async function opsSnapshot() {
  const db = await load();
  return { spend: db.spend, visits: db.visits };
}
