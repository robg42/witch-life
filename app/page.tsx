import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LeafExperience } from "@/components/leaf/leaf-experience";

export const dynamic = "force-dynamic";

/*
  Witch Life root — the daily leaf. Single primary surface. The hub
  has been retired: this page is the practice, the card, the question
  channel, and the journal entry for today, all on one broadsheet.

  Unauthenticated visitors are redirected to /sign-in (when Clerk is
  configured); without Clerk the leaf renders for everyone so dev
  builds without keys still work.
*/
export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  return <LeafExperience />;
}
