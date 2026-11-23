import "server-only";
import Stripe from "stripe";
import { newId } from "./analysis/pipeline";
import { sendPurchaseEmail } from "./email";
import { getAnalysis, getSession, grantEntitlement, logEvent, saveSession } from "./store";

export const PRICE_PENCE = 9900;
export const CURRENCY = "gbp";

let stripe: Stripe | null | undefined;
export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  return stripe;
}

/** Simulated checkout is a development affordance only. It is never available when Stripe is configured or in production unless explicitly enabled. */
export function simulatedPaymentsAllowed() {
  if (getStripe()) return false;
  if (process.env.AIVY_ALLOW_SIMULATED_PAYMENTS === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function createCheckout(analysisId: string, ownerKey: string): Promise<string> {
  const s = getStripe();
  if (s) {
    const session = await s.checkout.sessions.create(
      {
        mode: "payment",
        currency: CURRENCY,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CURRENCY,
              unit_amount: PRICE_PENCE,
              product_data: { name: "Aivy — Complete AI Upgrade Plan", description: "One-time payment. Lifetime access to your personalised plan, guides and toolkit." },
            },
          },
        ],
        client_reference_id: analysisId,
        metadata: { analysisId, ownerKey },
        payment_intent_data: { metadata: { analysisId } },
        allow_promotion_codes: true,
        success_url: `${appUrl()}/report/${analysisId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl()}/report/${analysisId}/unlock?cancelled=1`,
      },
      // Same customer + analysis within the window returns the same session, so double clicks never create duplicate charges.
      { idempotencyKey: `checkout:${analysisId}:${ownerKey}:${new Date().toISOString().slice(0, 13)}` },
    );
    await saveSession({ id: session.id, analysisId, ownerKey, provider: "stripe", status: "open", amount: PRICE_PENCE, currency: CURRENCY, createdAt: new Date().toISOString() });
    return session.url!;
  }
  if (!simulatedPaymentsAllowed()) throw new Error("Payments are not configured");
  const id = `sim_${newId(16)}`;
  await saveSession({ id, analysisId, ownerKey, provider: "simulated", status: "open", amount: PRICE_PENCE, currency: CURRENCY, createdAt: new Date().toISOString() });
  return `/checkout/simulated?session=${encodeURIComponent(id)}`;
}

/**
 * Server-side verification. Paid content is unlocked ONLY here or in the
 * webhook — never by the redirect alone. Both paths are idempotent.
 */
export async function verifyAndFulfil(sessionId: string, analysisId: string): Promise<{ ok: boolean; reason?: string }> {
  const s = getStripe();
  if (s && !sessionId.startsWith("sim_")) {
    const session = await s.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return { ok: false, reason: "Payment not completed yet" };
    if (session.client_reference_id !== analysisId) return { ok: false, reason: "Payment does not match this plan" };
    if (session.amount_total !== PRICE_PENCE || session.currency !== CURRENCY) return { ok: false, reason: "Unexpected payment amount" };
    await fulfil({ analysisId, sessionId, source: "stripe", amount: session.amount_total, email: session.customer_details?.email ?? undefined, ownerKey: session.metadata?.ownerKey ?? "" });
    return { ok: true };
  }
  const sim = await getSession(sessionId);
  if (!sim || sim.provider !== "simulated" || sim.analysisId !== analysisId) return { ok: false, reason: "Unknown checkout session" };
  if (sim.status !== "paid") return { ok: false, reason: "Payment not completed yet" };
  await fulfil({ analysisId, sessionId, source: "simulated", amount: sim.amount, email: sim.email, ownerKey: sim.ownerKey });
  return { ok: true };
}

export async function fulfil(p: { analysisId: string; sessionId: string; source: "stripe" | "simulated"; amount: number; email?: string; ownerKey: string }) {
  const a = await getAnalysis(p.analysisId);
  if (!a) throw new Error("Analysis not found for payment");
  const { created } = await grantEntitlement({
    analysisId: p.analysisId,
    ownerKey: p.ownerKey || a.ownerKey,
    source: p.source,
    sessionId: p.sessionId,
    amount: p.amount,
    currency: CURRENCY,
    email: p.email,
    createdAt: new Date().toISOString(),
  });
  if (created) {
    await logEvent({ level: "info", type: "purchase", message: `${a.domain} unlocked (${p.source})`, analysisId: a.id });
    if (p.email) await sendPurchaseEmail(p.email, a).catch((e) => logEvent({ level: "error", type: "email_failed", message: String(e), analysisId: a.id }));
  }
}
