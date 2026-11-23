import { readOwnerKey } from "@/lib/access";
import { body, fail, json } from "@/lib/http";
import { simulatedPaymentsAllowed } from "@/lib/payments";
import { getSession, saveSession } from "@/lib/store";

/** Development only: marks a simulated session as paid. Disabled whenever Stripe is configured. */
export async function POST(req: Request) {
  if (!simulatedPaymentsAllowed()) return fail("Not available", 404);
  const data = await body<{ session?: string; email?: string }>(req);
  const s = data?.session ? await getSession(data.session) : undefined;
  const owner = await readOwnerKey();
  if (!s || s.provider !== "simulated" || s.ownerKey !== owner) return fail("Unknown session", 404);
  const email = typeof data?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? data.email.slice(0, 200) : undefined;
  if (s.status !== "paid") await saveSession({ ...s, status: "paid", email });
  return json({ url: `/report/${s.analysisId}/success?session_id=${encodeURIComponent(s.id)}` });
}
