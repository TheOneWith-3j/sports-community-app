"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { googleAuthSchema } from "@/lib/validations/auth";

function buildRedirectUrl(pathname: string): string {
  const safePath = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/dashboard";
  return new URL(safePath, env.NEXT_PUBLIC_APP_URL).toString();
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const redirectParam = formData.get("redirectTo") ?? "/dashboard";
  const result = googleAuthSchema.safeParse({ redirectTo: String(redirectParam) });

  if (!result.success) {
    redirect("/login?error=invalid_redirect");
    return;
  }

  const safeRedirect = result.data.redirectTo;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildRedirectUrl(safeRedirect),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_start_failed");
    return;
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/login?error=signout_failed");
    return;
  }

  redirect("/login");
}
