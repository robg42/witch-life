import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/*
  Server-side Supabase client.

  - `supabaseAdmin()` uses the service role key. Bypasses RLS. Use only in
    trusted server contexts (webhooks, server actions doing privileged work).
  - `supabaseForUser()` authenticates as the current Clerk user. RLS applies.
    Requires a Clerk JWT template named "supabase" that signs requests with
    the Supabase JWT secret. See: https://clerk.com/docs/integrations/databases/supabase
*/

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.local.example to .env.local and fill in real values.`,
    );
  }
  return value;
}

export function supabaseAdmin(): SupabaseClient {
  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    assertEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export async function supabaseForUser(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    {
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
