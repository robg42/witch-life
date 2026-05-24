# Witch Life

A daily practice tool, shaped by the moon, the season, and your chart. Not a horoscope. Not a prediction. Every AI-generated output is a concrete practice you can do in five to fifteen minutes — gather these real things, do these specific steps, then write this in your journal.

Built around four surfaces:

- **Today's practice** — a generated ritual scaffolded by today's moon phase, season, and your natal chart. Gather. Do. Reflect.
- **The card** — one of twenty-eight botanical / elemental / animist cards, read as an action you take today rather than a meaning to interpret.
- **The Library** — a searchable reference of correspondences (herbs, stones, days, moon phases, elements, objects) and the eight wheel-of-the-year sabbats. Each correspondence can be turned into a tailored 5–10 minute practice.
- **The journal** — what you did, what's moving, the rest. Read by the oracle before it speaks again.

Three voices the oracle speaks in: **The Root** (ancient, earthy, unhurried), **The Blade** (sharp, direct, precise), **The Tide** (oceanic, emotional, honest).

---

## Stack

- **Next.js 14** App Router, TypeScript strict
- **Supabase** (Postgres + Row-Level Security) — Auth disabled; Clerk handles identity via a JWT template
- **Clerk** for auth (email/password + Google)
- **Stripe** for subscriptions (£9/mo or £79/yr) and one-time reports (£15–25)
- **Anthropic Claude** (Sonnet 4.5, model pinned in `lib/anthropic.ts` and `lib/reports.ts`) — server-side only
- **Tailwind**, custom design tokens
- **Vitest** for tests (43+ tests including astronomical, deck, correspondences, sabbats)

The astronomical engine is hand-rolled in [`lib/astro.ts`](lib/astro.ts) — no external astronomy libraries. Julian Day, sun/moon/planet ecliptic longitudes, Mercury retrograde (incl. shadow periods), ascendant, Saturn return windows, eclipse season detection.

The seasonal copy (what is happening on the land, the wheel-of-the-year markers) lives in [`lib/almanac.ts`](lib/almanac.ts) and is hemisphere-aware.

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
| `STRIPE_PRICE_REPORT_NATAL` | Your chart, as practice — £20 |
| `STRIPE_PRICE_REPORT_YEAR_AHEAD` | A year of practice — £25 |
| `STRIPE_PRICE_REPORT_SATURN_RETURN` | The Saturn-return practice — £18 |
| `STRIPE_PRICE_REPORT_ECLIPSE_SEASON` | The eclipse practice — £15 |

Without Stripe configured, the paid routes return 503 with a clear message and the rest of the app continues to work normally.

---

## Supabase setup

Apply both migrations in order:

```sh
# Supabase SQL editor, or via psql:
psql "$DATABASE_URL" -f supabase/migrations/0001_initial.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_practice.sql
```

`0001` creates users, journal_entries, readings, reports.
`0002` adds `hemisphere` and `practice_frequency` to users, plus the `user_intentions` and `practices` tables. RLS policies on both.

RLS policies authenticate via the Clerk JWT `sub` claim. In Clerk, create a JWT Template named **`supabase`** that signs requests with your Supabase Legacy JWT Secret. The server-side helper at [`lib/supabase/server.ts`](lib/supabase/server.ts) attaches that token to per-user requests.

The Clerk webhook (`/api/webhooks/clerk`) keeps the `users` table in sync on `user.created`, `user.updated`, and `user.deleted`.

---

## Stripe setup

1. Create one subscription product with two prices: monthly £9 and yearly £79.
2. Create one product for each of the four reports, each as a one-time payment.
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
| `/` | — | Public (unauth visitors redirected to `/sign-in`) |
| `/onboarding` | — | Public (three-step ritual: date, intentions, voice) |
| `/reading` | — | Free — Today's practice |
| `/draw` | — | Free — Single card pull |
| `/library` | — | Free preview / Paid full |
| `/library/sabbats/[key]` | — | Free preview / Paid full |
| `/journal` | Required | Free (markdown export behind `journal-export` flag) |
| `/spread` | Required | Paid (£9/mo subscription); share button behind `shared-spreads` flag |
| `/share/[token]` | — | Public — view a shared spread by token |
| `/reports` | Required | Free to view, paid per report |
| `/reports/[slug]` | Required | Owns-row only |
| `/practice` | Required | Free — your log + chart + intentions |
| `/account` | Required | Free — billing only |
| `/admin` | Admin | Dashboard: counts, costs, errors |
| `/admin/users` · `/admin/users/[id]` | Admin | User list + per-user feature overrides |
| `/admin/flags` | Admin | Global feature flag toggles |
| `/admin/api-calls` | Admin | Anthropic call log (filterable) |
| `/sign-in` · `/sign-up` | — | Clerk |
| `/debug/sky` | — | **Dev only** (404 in production) |

## Admin portal

`/admin` is gated by `public.users.is_admin = true`. The hardcoded list in [`lib/admin.ts`](lib/admin.ts) (`HARDCODED_ADMIN_EMAILS`) auto-grants admin to listed emails on `user.created` / `user.updated` via the Clerk webhook. Non-admins hitting any `/admin/**` route get a 404 — the surface is not acknowledged.

Every admin mutation:
1. Calls `requireAdmin()` (throws `AdminRequiredError` otherwise).
2. Validates input with zod.
3. Writes a row to `public.admin_actions` for the audit log.
4. Calls `revalidatePath()` so the table refreshes.

## Feature flags

The full registry lives in [`lib/features.ts`](lib/features.ts) — the source of truth for which flags exist and what tier they belong to. The DB rows in `public.feature_flags` hold the globally-enabled state; `public.user_feature_overrides` holds per-user grants.

Resolution order (in `hasFeature()`): **user override** → **global flag** → **hardcoded default**. Tier gating then applies: `free` allows everyone, `paid` requires active subscription (or admin), `admin` requires admin.

Currently registered: `streaks`, `journal-export`, `sky-alerts`, `shared-spreads`, `voice-listen`, `daily-email`.

## Cost, rate-limit, cache (Anthropic efficiency)

| Concern | Module | Behaviour |
|---|---|---|
| Telemetry | [`lib/telemetry.ts`](lib/telemetry.ts) | Every call logs endpoint, model, tokens, cost (USD), duration, status to `public.api_calls`. Best-effort: telemetry failures never break a user request. |
| Reading cache | [`lib/reading-cache.ts`](lib/reading-cache.ts) | Today's reading cached per `(user, date, voice)`, keyed by sha256 of inputs. Without it the Leaf regenerates on every page load. Sets the `X-Cache: HIT` response header on hits. |
| Rate limit | [`lib/rate-limit.ts`](lib/rate-limit.ts) | DB-backed counter on `api_calls`. Per-endpoint buckets: `/api/reading` 20/h, `/api/card` 30/h, `/api/spread` 10/h, `/api/library/practice` 20/h, `/api/report` 5/h. Returns `429` with `Retry-After`. |
| Prompt cache | [`lib/anthropic.ts`](lib/anthropic.ts) | The voice system prompt is sent with `cache_control: ephemeral`; Anthropic reuses it for ~5 min. |
| ASCII fold | [`lib/anthropic.ts`](lib/anthropic.ts) | Normalises em dashes, curly quotes, NBSP into ASCII before sending — prevents `ByteString` errors in intermediate proxies. |

---

## Build philosophy

- **The product is a practice tool**, not a horoscope reader. Every AI output is a concrete practice the reader can do in 5–15 minutes with things they already have. The astrology engine tells us when to do what; it doesn't write the headlines.
- **Tokens are the source of truth**. Every colour/font/spacing value flows from CSS custom properties in [`app/globals.css`](app/globals.css). Changing a token reskins the entire app.
- **The voice IS the product**. The voice prompts in [`lib/voices.ts`](lib/voices.ts) are exact — do not soften them. The model's character depends on those words. The house rules enforce the practice contract (gather/do/reflect + banned-phrase list).
- **All Anthropic calls** run through [`lib/anthropic.ts`](lib/anthropic.ts) (short-form) or [`lib/reports.ts`](lib/reports.ts) (long-form). Never expose the API key to the client.
- **The astronomical engine is pure TypeScript** with no side effects — safe to call from server or client. The reading page computes SkyState client-side and ships it to the API to avoid a round-trip.
- **Almanac copy** is curated, not AI-generated. Seasonal text and sabbat content come from [`lib/almanac.ts`](lib/almanac.ts) and [`lib/sabbats.ts`](lib/sabbats.ts).
- **47 correspondences** in [`lib/correspondences.ts`](lib/correspondences.ts) — every entry tested against an intention key so the Library search always returns something.
