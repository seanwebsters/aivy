import { loadOwned } from "@/lib/access";
import { fail, json } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if (!owned) return fail("Not found", 404);
  const a = owned.analysis;
  return json({
    id: a.id,
    status: a.status,
    error: a.error,
    domain: a.domain,
    attempts: a.attempts,
    name: a.profile?.name,
    industry: a.profile?.industryLabel,
    facts: a.profile?.facts.filter((f) => f.source === "website").slice(0, 4).map((f) => f.statement),
    questions: a.status === "awaiting_answers" ? a.questions : undefined,
    opportunityCount: a.opportunities?.length,
  });
}
