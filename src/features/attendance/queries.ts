import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/validations/attendance";

export type AttendanceParticipant = {
  id: string;
  profileId: string;
  displayName: string;
  status: AttendanceStatus | null;
};

export type AttendanceQueryResult =
  | { data: AttendanceParticipant[] }
  | { error: true };

export async function getAttendanceParticipants(
  eventId: string,
): Promise<AttendanceQueryResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "id, profile_id, profiles(display_name), attendance_records(status)",
    )
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[getAttendanceParticipants]", { code: error.code });
    return { error: true };
  }

  const participants: AttendanceParticipant[] = [];
  for (const participant of data) {
    const profile = Array.isArray(participant.profiles)
      ? participant.profiles[0]
      : participant.profiles;
    const attendance = Array.isArray(participant.attendance_records)
      ? participant.attendance_records[0]
      : participant.attendance_records;
    if (!profile) {
      console.error(
        "[getAttendanceParticipants] Query returned an invalid participant.",
      );
      return { error: true };
    }
    participants.push({
      id: participant.id,
      profileId: participant.profile_id,
      displayName: profile.display_name,
      status: attendance?.status ?? null,
    });
  }
  return { data: participants };
}
