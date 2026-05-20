import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/*
  Free-tier philosophy: /reading and /draw work without an account so the
  daily habit can form before any paywall. Journal, spread, reports and
  the matching paid APIs require auth. The /api/reading API is public so
  unauthenticated visitors can still pull a reading from localStorage —
  abuse mitigation (rate limiting by IP) will come in Phase 7.

  Without Clerk env vars (e.g. a preview deployment before keys are
  pasted), the middleware falls through and protected routes show their
  Clerk-rendered fallbacks instead of 500-ing the whole site.
*/
const isProtectedRoute = createRouteMatcher([
  "/journal(.*)",
  "/spread(.*)",
  "/reports(.*)",
  "/account(.*)",
  "/api/spread(.*)",
  "/api/report(.*)",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  return protectedMiddleware(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
