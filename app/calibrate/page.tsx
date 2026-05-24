import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CalibrateExperience } from "@/components/foreshore/calibrate-experience";

export const dynamic = "force-dynamic";

/*
  /calibrate — operator enrolment, the Foreshore replacement for
  /onboarding. Six sequential prompts inside the CRT. After commit
  we route to /, which is the console.

  Authentication is required so we have a Clerk user to mirror the
  selected voice / hemisphere back onto. The save happens client-
  side (localStorage); the Clerk webhook handles the eventual DB
  mirror as it does for the broadsheet.
*/
export default async function CalibratePage() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  return <CalibrateExperience />;
}
