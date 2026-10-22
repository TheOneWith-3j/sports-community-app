import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type EventParticipant = Tables<"event_participants">;

export type UserParticipation = {
  status: Extract<EventParticipant["status"], "confirmed" | "waitlisted">;
  waitlist_position: number | null;
};

export type WaitlistedParticipant = {
  id: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  position: number;
};

export type ParticipationQueryResult =
  | { data: UserParticipation | null }
  | { error: true };

export type WaitlistQueryResult =
  | { data: WaitlistedParticipant[] }
  | { error: true };

export type ConfirmedParticipant = {
  id: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
};

export type ParticipantQueryResult =
  | { data: ConfirmedParticipant[] }
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

export async function getWaitlistedParticipants(
  eventId: string,
): Promise<WaitlistQueryResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "id, profile_id, waitlist_position, joined_at, profiles(display_name, avatar_url)",
    )
    .eq("event_id", eventId)
    .eq("status", "waitlisted")
    .order("waitlist_position", { ascending: true });

  if (error) {
    console.error("[getWaitlistedParticipants]", { code: error.code });
    return { error: true };
  }

  const participants: WaitlistedParticipant[] = [];
  for (const participant of data) {
    const profile = Array.isArray(participant.profiles)
      ? participant.profiles[0]
      : participant.profiles;
    if (
      !profile ||
      typeof participant.waitlist_position !== "number"
    ) {
      console.error(
        "[getWaitlistedParticipants] Query returned an invalid participant.",
      );
      return { error: true };
    }
    participants.push({
      id: participant.id,
      profileId: participant.profile_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      joinedAt: participant.joined_at,
      position: participant.waitlist_position,
    });
  }

  return { data: participants };
}

export async function getConfirmedParticipants(
  eventId: string,
): Promise<ParticipantQueryResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "id, profile_id, joined_at, profiles(display_name, avatar_url)",
    )
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[getConfirmedParticipants]", { code: error.code });
    return { error: true };
  }

  const participants: ConfirmedParticipant[] = [];
  for (const participant of data) {
    const profile = Array.isArray(participant.profiles)
      ? participant.profiles[0]
      : participant.profiles;
    if (!profile) {
      console.error(
        "[getConfirmedParticipants] Query returned an invalid participant.",
      );
      return { error: true };
    }
    participants.push({
      id: participant.id,
      profileId: participant.profile_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      joinedAt: participant.joined_at,
    });
  }
  return { data: participants };
}
