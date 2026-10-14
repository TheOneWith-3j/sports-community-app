import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Community = Pick<
  Tables<"communities">,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "activity_type_id"
  | "owner_id"
  | "created_at"
  | "updated_at"
>;

export type ActivityType = Pick<
  Tables<"activity_types">,
  "id" | "name" | "slug" | "icon"
>;

export type CommunityQueryResult<T> = { data: T } | { error: true };

export async function getActivityTypes(): Promise<
  CommunityQueryResult<ActivityType[]>
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activity_types")
    .select("id, name, slug, icon")
    .order("name");

  if (error) {
    console.error("[getActivityTypes]", { code: error.code });
    return { error: true };
  }

  return { data };
}

export async function getActivityType(
  activityTypeId: string,
): Promise<CommunityQueryResult<ActivityType | null>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activity_types")
    .select("id, name, slug, icon")
    .eq("id", activityTypeId)
    .maybeSingle();

  if (error) {
    console.error("[getActivityType]", { code: error.code });
    return { error: true };
  }

  return { data };
}

export async function getCommunityForUser(
  profileId: string,
): Promise<CommunityQueryResult<Community | null>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("communities")
    .select(
      "id, name, slug, description, activity_type_id, owner_id, created_at, updated_at",
    )
    .eq("owner_id", profileId)
    .is("deleted_at", null)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getCommunityForUser]", { code: error.code });
    return { error: true };
  }

  return { data };
}

export async function getCommunityById(
  communityId: string,
): Promise<CommunityQueryResult<Community | null>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("communities")
    .select(
      "id, name, slug, description, activity_type_id, owner_id, created_at, updated_at",
    )
    .eq("id", communityId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[getCommunityById]", { code: error.code });
    return { error: true };
  }

  return { data };
}

export async function canManageCommunity(
  communityId: string,
): Promise<CommunityQueryResult<boolean>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("is_community_admin", {
    p_community_id: communityId,
  });

  if (error) {
    console.error("[canManageCommunity]", { code: error.code });
    return { error: true };
  }

  return { data };
}
