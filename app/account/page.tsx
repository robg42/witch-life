import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getAccount } from "@/lib/subscription";
import { isStripeConfigured } from "@/lib/stripe";
import { UpgradeCard } from "@/components/paywall/upgrade-card";
import { ManageBillingButton } from "@/components/paywall/manage-billing-button";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { VOICE_LABEL } from "@/lib/voices";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) return null;
  const account = await getAccount();

  const status = account?.subscription_status ?? "free";
  const stripeReady = isStripeConfigured();

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
        >
          ← Witch Life
        </Link>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mt-10">
          Account
        </p>
        <h1 className="display mt-3 text-3xl text-ink md:text-5xl">
          Your chart, your subscription
        </h1>

        <BotanicalDivider className="my-10" />

        <section>
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Subscription
          </h2>
          <p className="oracle-body mt-3 text-ink/90">
            {status === "active"
              ? "You are subscribed. The three-card spread and journal-aware readings are available to you."
              : status === "cancelled"
                ? "Your subscription has lapsed. The reading and journal are still here, waiting."
                : "You are on the free tier. The daily reading, your card, and the journal are yours without charge."}
          </p>
        </section>

        {status === "active" && stripeReady && (
          <div className="mt-6">
            <ManageBillingButton />
          </div>
        )}

        {status !== "active" && (
          <div className="mt-8">
            <UpgradeCard
              title="Unlock the deeper reading"
              body="Three-card spreads, journal-aware oracle, and saved reading history. £9 a month or £79 a year."
              ctaLabel="Subscribe — £9 / month"
              mode="subscription"
              argument="monthly"
              secondaryLabel="or £79 / year"
              secondaryArgument="yearly"
            />
            {!stripeReady && (
              <p className="mt-3 font-sans text-xs uppercase tracking-[0.25em] text-clay">
                Note · Stripe is not configured on this deployment yet
              </p>
            )}
          </div>
        )}

        <BotanicalDivider className="my-16" />

        <section>
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Your chart
          </h2>
          {account?.birth_date ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 font-serif text-base text-ink/90">
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth date
              </dt>
              <dd>{account.birth_date}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth time
              </dt>
              <dd>{account.birth_time ?? "—"}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth city
              </dt>
              <dd>{account.birth_city ?? "—"}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Voice
              </dt>
              <dd>{VOICE_LABEL[account.oracle_voice]}</dd>
            </dl>
          ) : (
            <p className="oracle-body mt-3 text-ink/85">
              Your birth details haven&rsquo;t been saved on this account yet.
            </p>
          )}
          <Link
            href="/onboarding"
            className="mt-6 inline-block font-sans text-xs uppercase tracking-[0.25em] text-moss transition-base hover:text-clay"
          >
            Edit your chart →
          </Link>
        </section>
      </div>
    </main>
  );
}
