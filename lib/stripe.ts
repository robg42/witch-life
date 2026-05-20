import Stripe from "stripe";

/*
  Server-side Stripe client. Returns null when no STRIPE_SECRET_KEY is
  configured — every paid route checks this before doing real work so
  the app boots cleanly during dev without Stripe set up.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/stripe must not be imported in client code");
}

let _stripe: Stripe | null | undefined;

export function stripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    _stripe = null;
    return null;
  }
  // Stripe SDK is pinned to its bundled apiVersion; we only override
  // when we explicitly want to test against a newer surface.
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/*
  Stripe Price IDs. Configure these in the Stripe dashboard for the live
  account, and paste the IDs into the env. Subscription prices are the
  same Stripe product with two recurring intervals; report prices are
  one-time purchases.
*/
export const STRIPE_PRICES = {
  subMonthly: process.env.STRIPE_PRICE_SUB_MONTHLY ?? "",
  subYearly: process.env.STRIPE_PRICE_SUB_YEARLY ?? "",
  reportNatal: process.env.STRIPE_PRICE_REPORT_NATAL ?? "",
  reportYearAhead: process.env.STRIPE_PRICE_REPORT_YEAR_AHEAD ?? "",
  reportSaturnReturn: process.env.STRIPE_PRICE_REPORT_SATURN_RETURN ?? "",
  reportEclipseSeason: process.env.STRIPE_PRICE_REPORT_ECLIPSE_SEASON ?? "",
} as const;
