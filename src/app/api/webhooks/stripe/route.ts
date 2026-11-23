import type Stripe from "stripe";
import { fail, json } from "@/lib/http";
import { fulfil, getStripe, PRICE_PENCE } from "@/lib/payments";
import { logEvent, markRefunded, markStripeEventProcessed } from "@/lib/store";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return fail("Not configured", 404);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return fail("Missing signature", 400);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return fail("Invalid signature", 400);
  }
  if (!(await markStripeEventProcessed(event.id))) return json({ received: true, duplicate: true });
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status === "paid" && s.client_reference_id && s.amount_total === PRICE_PENCE) {
        await fulfil({ analysisId: s.client_reference_id, sessionId: s.id, source: "stripe", amount: s.amount_total, email: s.customer_details?.email ?? undefined, ownerKey: s.metadata?.ownerKey ?? "" });
      }
    } else if (event.type === "charge.refunded") {
      const c = event.data.object as Stripe.Charge;
      const id = c.metadata?.analysisId;
      if (id) {
        await markRefunded(id);
        await logEvent({ level: "warn", type: "refund", message: `Refund processed`, analysisId: id });
      }
    }
  } catch (e) {
    await logEvent({ level: "error", type: "webhook_failed", message: String(e) });
    return fail("Processing failed", 500); // Stripe retries automatically
  }
  return json({ received: true });
}
