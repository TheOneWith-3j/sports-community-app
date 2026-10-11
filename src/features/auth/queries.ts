import { getAuth0Client } from "@/lib/auth0";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export { DEFAULT_PROFILE_DISPLAY_NAME } from "@/lib/validations/profile";

export type UserProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "display_name"
  | "avatar_url"
  | "phone"
  | "onboarding_completed"
  | "created_at"
  | "updated_at"
>;

export type ProfileResolutionError =
  | "supabase_api_key_invalid"
  | "auth0_token_rejected"
  | "profile_migration_missing"
  | "profile_unavailable";

export type ProfileResolutionResult =
  | { profileId: string }
  | { error: ProfileResolutionError }
  | null;

export type CurrentProfileResult =
  | { profile: UserProfile }
  | { error: ProfileResolutionError }
  | null;

export async function getCurrentUser() {
  const session = await getAuth0Client().getSession();
  return session?.user ?? null;
}

export async function ensureCurrentProfile(): Promise<ProfileResolutionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("ensure_current_profile");

  if (error) {
    console.error("Supabase profile resolution failed.", {
      code: error.code,
      message: error.message,
    });

    const message = error.message.toLowerCase();
    if (message.includes("invalid api key")) {
      return { error: "supabase_api_key_invalid" };
    }

    if (
      message.includes("invalid jwt") ||
      message.includes("jwt expired") ||
      message.includes("signature verification failed")
    ) {
      return { error: "auth0_token_rejected" };
    }

    if (
      error.code === "PGRST202" ||
      error.code === "42883" ||
      (message.includes("ensure_current_profile") && message.includes("not found"))
    ) {
      return { error: "profile_migration_missing" };
    }

    return { error: "profile_unavailable" };
  }

  if (typeof data !== "string") {
    console.error("Supabase profile resolution returned an unexpected response.");
    return { error: "profile_unavailable" };
  }

  return { profileId: data };
}

export async function getCurrentProfile(): Promise<CurrentProfileResult> {
  const resolution = await ensureCurrentProfile();

  if (!resolution || "error" in resolution) {
    return resolution;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, phone, onboarding_completed, created_at, updated_at",
    )
    .eq("id", resolution.profileId)
    .maybeSingle();

  if (error) {
    console.error("Supabase profile lookup failed.", {
      code: error.code,
      message: error.message,
    });
    return { error: "profile_unavailable" };
  }

  if (!data) {
    console.error("Supabase did not return the authenticated profile.");
    return { error: "profile_unavailable" };
  }

  return { profile: data };
}
