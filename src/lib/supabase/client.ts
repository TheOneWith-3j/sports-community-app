import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export type Database = Record<string, never>;

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const supabaseBrowser = createClient();
