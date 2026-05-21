"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

/*
  Auth-aware control. Shows Sign-out when signed in, Sign-in when not.
  Themed for the cream herbarium surface.
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
        className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash transition-base hover:text-clay"
      >
        Sign out
      </button>
    );
  }
  return (
    <Link
      href="/sign-in"
      className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash transition-base hover:text-clay"
    >
      Sign in
    </Link>
  );
}
