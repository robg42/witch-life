import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LeafExperience } from "@/components/leaf/leaf-experience";
import { SkyAlertsBanner } from "@/components/leaf/sky-alerts-banner";
import { StreakChip } from "@/components/leaf/streak-chip";

export const dynamic = "force-dynamic";

/*
  Witch Life root — the daily leaf. Single primary surface. The hub
  has been retired: this page is the practice, the card, the question
  channel, and the journal entry for today, all on one broadsheet.

  We wrap the client LeafExperience with two server-rendered slots:
    - SkyAlertsBanner above the leaf (when 'sky-alerts' flag is on)
    - StreakChip passed in as a slot prop, rendered inside the
      masthead by the client (when 'streaks' flag is on)

  Unauthenticated visitors are redirected to /sign-in (when Clerk is
  configured); without Clerk the leaf renders for everyone so dev
  builds without keys still work.
*/
export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  return (
    <>
      <div className="mx-auto max-w-[1080px] px-5 pt-6 md:px-10 md:pt-10">
        <SkyAlertsBanner />
      </div>
      <LeafExperience streakSlot={<StreakChip />} />
    </>
  );
}
