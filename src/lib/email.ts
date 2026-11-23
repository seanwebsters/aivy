import "server-only";
import { apiFetch } from "./net";
import type { Analysis } from "./types";
import { logEvent } from "./store";

/** Transactional email via Resend. Without RESEND_API_KEY, emails are logged (simulated). */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await logEvent({ level: "info", type: "email_simulated", message: `To ${to.replace(/(.).+@/, "$1***@")}: ${subject}` });
    return;
  }
  const res = await apiFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.AIVY_EMAIL_FROM ?? "Aivy <hello@aivy.ai>", to, subject, html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

export async function sendPurchaseEmail(to: string, a: Analysis) {
  const url = `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/dashboard/${a.id}`;
  const name = a.profile?.name ?? a.domain;
  await sendEmail(
    to,
    `Your AI upgrade plan for ${name} is ready`,
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#2a1f47">
      <h1 style="color:#6d3df5">Welcome aboard ✦</h1>
      <p>Thanks for your purchase. Your complete AI upgrade plan for <strong>${escapeHtml(name)}</strong> is ready.</p>
      <p><a href="${url}" style="display:inline-block;background:#6d3df5;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Open my Aivy dashboard</a></p>
      <p style="color:#6b6385;font-size:14px">One-time payment of £99. No subscription. Third-party tools you choose to use are billed separately by their providers.</p>
    </div>`,
  );
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
