"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/features/auth/queries";
import { requireCommunityAdmin } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  markAttendanceSchema,
  type AttendanceStatus,
} from "@/lib/validations/attendance";
import type { ActionResult } from "@/types/actions";

export async function markAttendance(
  input: unknown,
): Promise<ActionResult<{ status: AttendanceStatus }>> {
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Choose a valid attendance status.",
      },
    };
  }

  const current = await getCurrentProfile();
  if (!current) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sign in to manage attendance." },
    };
  }
  if ("error" in current) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Your profile could not be loaded. Please try again.",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const participant = await supabase
    .from("event_participants")
    .select("event_id, status, events(community_id)")
    .eq("id", parsed.data.participantId)
    .maybeSingle();
  if (participant.error) {
    console.error("[markAttendance] Participant lookup failed.", {
      code: participant.error.code,
    });
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Attendance could not be loaded." },
    };
  }
  if (!participant.data || participant.data.status !== "confirmed") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Attendance can only be marked for confirmed participants.",
      },
    };
  }
  const event = Array.isArray(participant.data.events)
    ? participant.data.events[0]
    : participant.data.events;
  if (!event) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "The event could not be found." },
    };
  }
  const authorization = await requireCommunityAdmin(event.community_id);
  if (!authorization.authorized) {
    return {
      success: false,
      error: {
        code:
          authorization.reason === "unavailable"
            ? "INTERNAL_ERROR"
            : "FORBIDDEN",
        message:
          authorization.reason === "unavailable"
            ? "Event permissions could not be checked. Please try again."
            : "You cannot manage this event.",
      },
    };
  }

  const { error } = await supabase.from("attendance_records").upsert(
    {
      participant_id: parsed.data.participantId,
      event_id: participant.data.event_id,
      status: parsed.data.status,
      marked_by: current.profile.id,
    },
    { onConflict: "participant_id" },
  );
  if (error) {
    console.error("[markAttendance]", { code: error.code, message: error.message });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Attendance could not be saved. Please try again.",
      },
    };
  }

  revalidatePath(`/events/${participant.data.event_id}/attendance`);
  return { success: true, data: { status: parsed.data.status } };
}
