import { after } from "next/server";
import { loadOwned } from "@/lib/access";
import { runDiscovery } from "@/lib/analysis/pipeline";
import { fail, json } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if (!owned) return fail("Not found", 404);
  if (owned.analysis.status !== "failed") return fail("Nothing to retry.", 409);
  if (owned.analysis.attempts >= 3) return fail("We've tried this site three times without success. Please contact support.", 429);
  after(() => runDiscovery(id));
  return json({ ok: true });
}
