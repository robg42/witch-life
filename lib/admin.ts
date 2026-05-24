import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Admin auth helpers. The admin status lives on public.users.is_admin
  (a column added in migration 0003). The Clerk webhook auto-grants
  is_admin=true to mail@robgregg.com on user.created/user.updated.

  All admin pages and admin APIs call requireAdmin() at the top; if
  the caller isn't an admin we throw an AdminRequiredError which the
  caller turns into a 404 (we don't acknowledge the existence of the
  admin surface to non-admins).
*/

if (typeof window !== "undefined") {
  throw new Error("lib/admin must not be imported in client code");
}

export const HARDCODED_ADMIN_EMAILS = ["mail@robgregg.com"] as const;

export class AdminRequiredError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminRequiredError";
  }
}

export interface AdminContext {
  /** Clerk user id of the calling admin. */
  clerkId: string;
  /** Supabase users.id of the calling admin. */
  userId: string;
  /** Admin's email — used for audit log. */
  email: string;
}

/**
 * Return the admin context if the current Clerk session belongs to
 * an admin, otherwise null. Doesn't throw.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id, email, is_admin")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { id: string; email: string | null; is_admin: boolean };
  if (!row.is_admin) return null;
  return {
    clerkId,
    userId: row.id,
    email: row.email ?? "(unknown)",
  };
}

/**
 * Throw AdminRequiredError if the caller isn't an admin. Use at the
 * top of admin server actions and admin API routes.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new AdminRequiredError();
  return ctx;
}

/**
 * Audit log entry. Called automatically by every admin mutation;
 * details should be a small JSON-able description of what changed.
 */
export async function recordAdminAction(
  admin: AdminContext,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown>,
): Promise<void> {
  const sb = supabaseAdmin();
  await sb.from("admin_actions").insert({
    admin_user_id: admin.userId,
    admin_email: admin.email,
    action,
    target_user_id: targetUserId,
    details,
  });
}

/**
 * True if the given email should be auto-granted admin on user.created.
 * Called from the Clerk webhook.
 */
export function isHardcodedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  return HARDCODED_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalised);
}
