"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, recordAdminAction } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isFeatureKey, type FeatureKey } from "@/lib/features";

/*
  Admin server actions. Every mutation:
    1. requireAdmin() — throws if the caller isn't an admin
    2. Validates input with zod
    3. Applies the change with supabaseAdmin (service role)
    4. Writes an entry to admin_actions for the audit log
    5. revalidatePath()s the affected admin page so the table updates
*/

const flagOverrideSchema = z.object({
  userId: z.string().uuid(),
  flagKey: z.string().min(1).max(64),
  state: z.enum(["on", "off", "inherit"]),
});

export async function setUserFlagOverride(input: {
  userId: string;
  flagKey: string;
  state: "on" | "off" | "inherit";
}) {
  const admin = await requireAdmin();
  const parsed = flagOverrideSchema.parse(input);
  if (!isFeatureKey(parsed.flagKey)) {
    throw new Error(`Unknown flag key: ${parsed.flagKey}`);
  }
  const key = parsed.flagKey as FeatureKey;

  const sb = supabaseAdmin();
  if (parsed.state === "inherit") {
    await sb
      .from("user_feature_overrides")
      .delete()
      .eq("user_id", parsed.userId)
      .eq("flag_key", key);
  } else {
    await sb.from("user_feature_overrides").upsert(
      {
        user_id: parsed.userId,
        flag_key: key,
        enabled: parsed.state === "on",
      },
      { onConflict: "user_id,flag_key" },
    );
  }

  await recordAdminAction(admin, "set_user_flag_override", parsed.userId, {
    flagKey: key,
    state: parsed.state,
  });
  revalidatePath(`/admin/users/${parsed.userId}`);
}

const adminToggleSchema = z.object({
  userId: z.string().uuid(),
  isAdmin: z.boolean(),
});

export async function setUserAdmin(input: { userId: string; isAdmin: boolean }) {
  const admin = await requireAdmin();
  const parsed = adminToggleSchema.parse(input);

  // Safety rail: never let an admin demote themselves via this UI —
  // would lock them out of the surface mid-session.
  if (parsed.userId === admin.userId && !parsed.isAdmin) {
    throw new Error("You cannot remove your own admin status from this view.");
  }

  const sb = supabaseAdmin();
  await sb
    .from("users")
    .update({ is_admin: parsed.isAdmin })
    .eq("id", parsed.userId);

  await recordAdminAction(admin, "set_user_admin", parsed.userId, {
    isAdmin: parsed.isAdmin,
  });
  revalidatePath(`/admin/users/${parsed.userId}`);
  revalidatePath("/admin/users");
}

const globalFlagSchema = z.object({
  flagKey: z.string().min(1).max(64),
  globallyEnabled: z.boolean(),
});

export async function setGlobalFlag(input: {
  flagKey: string;
  globallyEnabled: boolean;
}) {
  const admin = await requireAdmin();
  const parsed = globalFlagSchema.parse(input);
  if (!isFeatureKey(parsed.flagKey)) {
    throw new Error(`Unknown flag key: ${parsed.flagKey}`);
  }

  const sb = supabaseAdmin();
  await sb
    .from("feature_flags")
    .update({ globally_enabled: parsed.globallyEnabled })
    .eq("key", parsed.flagKey);

  await recordAdminAction(admin, "set_global_flag", null, {
    flagKey: parsed.flagKey,
    globallyEnabled: parsed.globallyEnabled,
  });
  revalidatePath("/admin/flags");
  revalidatePath("/admin");
}
