import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Subscription helpers. Source of truth is the `subscription_status`
  column on the users table, updated by the Stripe webhook on
  `customer.subscription.{created,updated,deleted}`.

  `getAccount()` returns the full users row for the signed-in Clerk
  user, or null if no user is signed in / not yet synced.
*/

export type SubscriptionStatus = "free" | "active" | "cancelled";

export interface AccountRow {
  id: string;
  clerk_id: string;
  email: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
  oracle_voice: "root" | "blade" | "tide";
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  created_at: string;
}

export async function getAccount(): Promise<AccountRow | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AccountRow;
}

export async function isSubscribed(): Promise<boolean> {
  const account = await getAccount();
  return account?.subscription_status === "active";
}
