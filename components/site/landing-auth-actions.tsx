"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

/*
  The header right-hand cluster on the landing page. Shows different
  controls depending on auth state — a Sign-out link when signed in, a
  small return-to-chart link when signed out. Lives in a client
  component so it can read Clerk's session.

  Gracefully no-ops without Clerk configured (useAuth returns
  isLoaded=true, userId=null).
*/
export function LandingAuthActions() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.refresh();
        }}
        className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash transition-base hover:text-parchment"
      >
        Sign out
      </button>
    );
  }
  return (
    <Link
      href="/sign-in"
      className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash transition-base hover:text-parchment"
    >
      Sign in
    </Link>
  );
}
