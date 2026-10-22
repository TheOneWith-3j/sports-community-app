import { getCurrentProfile } from "@/features/auth/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CommunityRole = Database["public"]["Enums"]["community_role"];

export type RoleCheckResult =
  | { authorized: true }
  | { authorized: false; reason: "unauthorized" | "unavailable" | "forbidden" };

export async function getCommunityRole(
  communityId: string,
): Promise<CommunityRole | null> {
  const current = await getCurrentProfile();
  if (!current || "error" in current) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: superAdmin, error: superAdminError } = await supabase.rpc(
    "is_super_admin",
  );
  if (superAdminError) {
    console.error("[getCommunityRole]", { code: superAdminError.code });
    return null;
  }
  if (superAdmin) {
    return "admin";
  }
  const { data, error } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("profile_id", current.profile.id)
    .maybeSingle();

  if (error) {
    console.error("[getCommunityRole]", { code: error.code });
    return null;
  }
  return data?.role ?? null;
}

export async function requireCommunityAdmin(
  communityId: string,
): Promise<RoleCheckResult> {
  const current = await getCurrentProfile();
  if (!current) {
    return { authorized: false, reason: "unauthorized" };
  }
  if ("error" in current) {
    return { authorized: false, reason: "unavailable" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("is_community_admin", {
    p_community_id: communityId,
  });
  if (error) {
    console.error("[requireCommunityAdmin]", { code: error.code });
    return { authorized: false, reason: "unavailable" };
  }
  return data
    ? { authorized: true }
    : { authorized: false, reason: "forbidden" };
}

export async function requireSuperAdmin(): Promise<RoleCheckResult> {
  const current = await getCurrentProfile();
  if (!current) {
    return { authorized: false, reason: "unauthorized" };
  }
  if ("error" in current) {
    return { authorized: false, reason: "unavailable" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) {
    console.error("[requireSuperAdmin]", { code: error.code });
    return { authorized: false, reason: "unavailable" };
  }
  return data
    ? { authorized: true }
    : { authorized: false, reason: "forbidden" };
}
