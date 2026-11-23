import { loadOwned, readOwnerKey } from "@/lib/access";
import { body, fail, json } from "@/lib/http";
import { createCheckout } from "@/lib/payments";
import { logEvent } from "@/lib/store";

export async function POST(req: Request) {
  const data = await body<{ analysisId?: string }>(req);
  if (!data?.analysisId) return fail("Missing plan");
  const owned = await loadOwned(data.analysisId);
  const owner = await readOwnerKey();
  if (!owned || !owner) return fail("Not found", 404);
  if (owned.entitled) return json({ url: `/dashboard/${owned.analysis.id}` }); // never charge twice
  if (owned.analysis.status !== "complete") return fail("Your analysis isn't finished yet.", 409);
  try {
    return json({ url: await createCheckout(owned.analysis.id, owner) });
  } catch (e) {
    await logEvent({ level: "error", type: "checkout_failed", message: String(e), analysisId: owned.analysis.id });
    return fail("Checkout is temporarily unavailable. Please try again shortly.", 503);
  }
}
