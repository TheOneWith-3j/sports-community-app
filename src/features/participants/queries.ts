import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type EventParticipant = Tables<"event_participants">;

export type UserParticipation = {
  status: Extract<EventParticipant["status"], "confirmed" | "waitlisted">;
  waitlist_position: number | null;
};

export type ParticipationQueryResult =
  | { data: UserParticipation | null }
  | { error: true };

export async function getUserParticipation(
  eventId: string,
  profileId: string,
): Promise<ParticipationQueryResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select("status, waitlist_position")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .in("status", ["confirmed", "waitlisted"])
    .maybeSingle();

  if (error) {
    console.error("[getUserParticipation]", { code: error.code });
    return { error: true };
  }

  if (!data) {
    return { data: null };
  }

  if (data.status === "confirmed") {
    return {
      data: { status: "confirmed", waitlist_position: data.waitlist_position },
    };
  }
  if (data.status === "waitlisted") {
    return {
      data: { status: "waitlisted", waitlist_position: data.waitlist_position },
    };
  }

  console.error("[getUserParticipation] Query returned an inactive status.");
  return { error: true };
}
