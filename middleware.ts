import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/*
  Protected routes require a signed-in Clerk user. Everything else (the
  landing page, sign-in/sign-up, Clerk + Stripe webhooks) is public.
  Paywall gates on subscription_status live inside the route handlers
  themselves — middleware only enforces "logged in or not".
*/
/*
  Free-tier philosophy: /reading and /draw work without an account so the
  daily habit can form before any paywall. Journal, spread, reports and
  the matching paid APIs require auth. The /api/reading API is public so
  unauthenticated viewers can still pull a reading from localStorage —
  abuse mitigation (rate limiting by IP) will come in Phase 7.
*/
const isProtectedRoute = createRouteMatcher([
  "/journal(.*)",
  "/spread(.*)",
  "/reports(.*)",
  "/account(.*)",
  "/api/spread(.*)",
  "/api/report(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
