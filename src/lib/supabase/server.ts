import { createClient } from "@supabase/supabase-js";

import { getAuth0Client, isAuth0Configured } from "@/lib/auth0";
import { env } from "@/lib/env";

export type Database = Record<string, never>;

export async function createServerSupabaseClient() {
  const session = isAuth0Configured()
    ? await getAuth0Client().getSession()
    : null;
  const idToken = session?.tokenSet.idToken;

  if (session && !idToken) {
    throw new Error("The authenticated Auth0 session does not contain an ID token.");
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      ...(idToken ? { accessToken: async () => idToken } : {}),
    },
  );
}
