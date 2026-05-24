import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ConsoleShell } from "@/components/foreshore/console-shell";

export const dynamic = "force-dynamic";

/*
  Witch Life root — STATION 28, the operator console.

  The console is the entire product. One page, one room, four
  primary controls (DIAL, TAPE, LOG, FILE) and the CRT in the
  middle of it. Phase A wires DIAL + TRANSMIT to a live
  Foreshore-voiced transmission. Subsequent phases plug in
  TAPE, LOG, FILE, mail slot, anomalies.

  Unauthenticated visitors are redirected to /sign-in (when Clerk
  is configured); without Clerk the console renders for everyone
  so dev builds without keys still work.

  The previous broadsheet remains available at /leaf during the
  transition; existing operators with unchanged habits will find
  it untouched.
*/
export default async function StationPage() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  return <ConsoleShell />;
}
