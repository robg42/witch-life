import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LeafExperience } from "@/components/leaf/leaf-experience";
import { SkyAlertsBanner } from "@/components/leaf/sky-alerts-banner";
import { StreakChip } from "@/components/leaf/streak-chip";

export const dynamic = "force-dynamic";

/*
  The Leaf — the archived broadsheet edition of Witch Life. After the
  Foreshore reframe, this lives at /leaf rather than at /. Kept
  available so existing operators can still find their old surface
  during transition and so the practice / journal pages have a
  rendering harness that still works.

  We wrap the client LeafExperience with two server-rendered slots:
    - SkyAlertsBanner above the leaf (when 'sky-alerts' flag is on)
    - StreakChip passed in as a slot prop, rendered inside the
      masthead by the client (when 'streaks' flag is on)
*/
export default async function LeafPage() {
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
