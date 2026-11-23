# Aivy — meet your new AI expert

Aivy is a character-led web platform. A business owner enters their website, Aivy works out how AI could help, and £99 (one-time) unlocks a personalised implementation plan with step-by-step guides, templates and an assistant.

```
Landing → Analyse (fetch site → profile → 3–5 questions → recommendations)
        → Free reveal (top 3) → £99 unlock (Stripe) → server-verified entitlement
        → Dashboard: Overview · Roadmap · Implementation · Toolkit · Ask Aivy · Results · Report
```

## Run it

```bash
npm install
cp .env.example .env.local   # optional — everything works without keys
npm run dev                  # http://localhost:3000
```

- **Demo workspace:** http://localhost:3000/demo (Riverside Café, a fictional sample business)
- **Ops dashboard:** http://localhost:3000/admin (open in dev only; set `ADMIN_TOKEN` for production)
- `npm test` runs unit tests for URL safety, extraction, classification, scoring and the playbook library
- `npm run lint` runs the TypeScript type check

## Architecture

| Area | Implementation |
| --- | --- |
| App | Next.js 16 App Router, TypeScript, Tailwind CSS 4, Motion |
| Website analysis | `src/lib/analysis/` — strict URL validation, SSRF guard (private-IP checks at DNS and connect time, re-checked on every redirect), 10s timeout, 1.5MB cap, HTML-only. Optional Firecrawl. Page content is treated as untrusted data. |
| AI | `src/lib/ai/provider.ts` — OpenAI or Anthropic, JSON validated with Zod (one repair retry), per-call cost tracking, daily budget cap. Without a key, a deterministic analyser is used. |
| Recommendations | `src/lib/playbooks.ts` — 16 validated playbooks. The AI can only select and personalise from these; it can't invent workflows. `src/lib/scoring.ts` holds the transparent score (fit 35%, need 30%, readiness 20%, ease 15%, minus a regulatory-risk penalty). |
| Payments | `src/lib/payments.ts` — Stripe Checkout, idempotency keys, server-side verification on the success page **and** a signed webhook (`/api/webhooks/stripe`). Both grants are idempotent. Refunds revoke access. A redirect alone never unlocks anything. |
| Ask Aivy | `src/lib/assistant.ts` — retrieval over the playbook library and the customer's own report; the LLM may only use retrieved content. There is a per-purchase message cap, burst limiting, and billing/refund questions are escalated. |
| Email | Resend (`src/lib/email.ts`), or logged when not configured |
| Storage | **Prototype:** JSON file store (`src/lib/store.ts`). **Production:** `supabase/migrations/0001_init.sql` (tables + RLS) |
| Ops | `/admin` shows visitors, conversion, revenue and refunds, AI cost per customer, estimated gross margin, failed analyses, escalations and system health. Logs are structured JSON. |

## What's real vs simulated

**Real now:** the safe website fetch and extraction, industry classification, the question flow, scoring, AI profiling and personalisation (when a key is set), the playbook library, progress tracking, outcomes, Ask Aivy (AI or deterministic), the printable report, the Stripe integration code paths, the webhook handler, cost limits, rate limits and the admin metrics.

**Simulated / prototype:**
- Payments use a clearly labelled test checkout unless `STRIPE_SECRET_KEY` is set. Simulated checkout is disabled in production.
- Accounts use an anonymous httpOnly browser key instead of Supabase Auth. Customers can't sign in from another device yet.
- Storage is a local JSON file. It won't persist on Vercel; use the Supabase schema.
- Sentry isn't wired up yet (structured logs only). Rate limiting is in-memory.
- Tool prices in the playbooks are indicative planning ranges and must be reviewed regularly.
- The legal pages and the 14-day refund wording are placeholders. Confirm the policy before launch.

## Remaining phases

3. Supabase Auth (magic link, using the email from checkout) plus a Supabase store adapter and RLS. Stripe live-mode setup.
4. More playbooks, verified direct integrations (only shown as "active" once verified), and an assistant evaluation set.
5. Sentry, a Redis rate limiter, a queue for analysis jobs with retries (e.g. Inngest or QStash), alerting on cost and failures, e2e tests in CI, and Vercel deployment.
