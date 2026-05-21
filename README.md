# Witch Life

A personalised cosmic energy service. Reads the live state of the sky —
sun, moon, planets — and tells the reader how to move through that
energy. Not a horoscope. Not a prediction.

Three layers:

- **Daily ritual** — a living, breathing energetic picture that updates each day.
- **Natal chart** — personalised readings against the reader's birth chart.
- **Question layer** — the reader can ask something and the oracle speaks directly to it.

---

## Stack

- **Next.js 14** App Router, TypeScript strict
- **Supabase** (Postgres + Row-Level Security) — Auth disabled; Clerk handles identity via a JWT template
- **Clerk** for auth (email/password + Google)
- **Stripe** for subscriptions (£9/mo or £79/yr) and one-time reports (£15–25)
- **Anthropic Claude** (Sonnet 4.5 default; Opus 4.7 optional for reports) — server-side only
- **Tailwind + shadcn primitives**, heavily customised
- **Vitest** for tests

The astronomical engine is hand-rolled in [`lib/astro.ts`](lib/astro.ts) — no external astronomy libraries. Julian Day, sun/moon/planet ecliptic longitudes, Mercury retrograde (incl. shadow periods), ascendant, Saturn return windows, eclipse season detection.

---

## Setup

```sh
pnpm install
cp .env.local.example .env.local
# fill in your keys
pnpm dev
```

### Required env (minimum to boot locally)

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `ANTHROPIC_API_KEY` | Claude API key (server only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk → Supabase webhook signing secret |

### Required env to enable paid features

| Var | Notes |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_SUB_MONTHLY` | Stripe price ID for £9/month |
| `STRIPE_PRICE_SUB_YEARLY` | Stripe price ID for £79/year |
| `STRIPE_PRICE_REPORT_NATAL` | Stripe price ID for natal report |
| `STRIPE_PRICE_REPORT_YEAR_AHEAD` | Stripe price ID for year-ahead report |
| `STRIPE_PRICE_REPORT_SATURN_RETURN` | Stripe price ID for Saturn-return report |
| `STRIPE_PRICE_REPORT_ECLIPSE_SEASON` | Stripe price ID for eclipse-season report |

Without Stripe configured, the paid routes return 503 with a clear
message and the rest of the app continues to work normally.

---

## Supabase setup

Apply the schema once:

```sh
# Supabase SQL editor, or:
psql "$DATABASE_URL" -f supabase/migrations/0001_initial.sql
```

RLS policies in the migration authenticate via the Clerk JWT `sub` claim.
In Clerk, create a JWT Template named **`supabase`** that signs requests
with your Supabase JWT Secret. The server-side helper at
[`lib/supabase/server.ts`](lib/supabase/server.ts) attaches that token to
per-user requests.

The Clerk webhook (`/api/webhooks/clerk`) keeps the `users` table in sync
on `user.created`, `user.updated`, and `user.deleted`.

---

## Stripe setup

1. Create one subscription product with two prices: monthly £9 and yearly £79.
2. Create one product for each report type, each as a one-time payment.
3. Paste the resulting `price_…` IDs into the env vars above.
4. Add a webhook endpoint pointing at `/api/webhooks/stripe`, subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Scripts

| Command | What |
|---|---|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the Vitest test suite |
| `pnpm test:watch` | Watch mode |
| `pnpm lint` | ESLint |

---

## Routes

| Route | Auth | Tier |
|---|---|---|
| `/` | — | Public |
| `/onboarding` | — | Public |
| `/reading` | — | Free |
| `/draw` | — | Free |
| `/journal` | Required | Free |
| `/spread` | Required | Paid |
| `/reports` | Required | Free to view, paid per report |
| `/reports/[slug]` | Required | Owns-row only |
| `/account` | Required | Free |
| `/sign-in` · `/sign-up` | — | Clerk |
| `/debug/sky` | — | **Dev only** (404 in production) |

---

## Build philosophy

- Tokens are the source of truth. Every colour/font/spacing value flows from CSS custom properties in [`app/globals.css`](app/globals.css). Changing a token reskins the entire app.
- The oracle is the product. The voice prompts in [`lib/voices.ts`](lib/voices.ts) are exact — do not soften them. The model's character depends on those words.
- All Anthropic calls run through [`lib/anthropic.ts`](lib/anthropic.ts) (or [`lib/reports.ts`](lib/reports.ts) for long-form). Never expose the API key to the client.
- The astronomical engine is pure TypeScript with no side effects — safe to call from server or client. The reading page actually computes the SkyState client-side and ships it to the API to avoid a round-trip.
