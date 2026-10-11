import { getAuth0Client } from "@/lib/auth0";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const session = await getAuth0Client().getSession();
  return session?.user ?? null;
}

export async function ensureCurrentProfile(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("ensure_current_profile");

  if (error) {
    throw new Error("Unable to resolve the authenticated application profile.", {
      cause: error,
    });
  }

  if (typeof data !== "string") {
    throw new Error("The authenticated application profile could not be resolved.");
  }

  return data;
}
