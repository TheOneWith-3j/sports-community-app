"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/features/auth/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  leaveEventResultSchema,
  leaveEventSchema,
  joinEventResultSchema,
  joinEventSchema,
} from "@/lib/validations/participant";
import type { ActionResult } from "@/types/actions";

export type JoinResult = {
  status: "confirmed" | "waitlisted";
  waitlistPosition: number | null;
};

export type LeaveResult = {
  cancelled: true;
  promotedProfileId: string | null;
};

export async function joinEvent(input: unknown): Promise<ActionResult<JoinResult>> {
  const parsedInput = joinEventSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "This event could not be joined. Refresh the page and try again.",
      },
    };
  }

  const current = await getCurrentProfile();
  if (!current) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sign in to join this event." },
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
  if (!current.profile.onboarding_completed) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Complete your profile setup before joining this event.",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("join_event", {
    p_event_id: parsedInput.data.eventId,
  });

  if (error) {
    console.error("[joinEvent]", { code: error.code, message: error.message });
    if (error.code === "42501") {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Sign in to join this event." },
      };
    }
    if (error.message.includes("Event not found")) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "This event is no longer available." },
      };
    }
    if (
      error.message.includes("Event is not open for joining") ||
      error.message.includes("Event has already started") ||
      error.message.includes("User already joined")
    ) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: error.message.includes("User already joined")
            ? "You have already joined this event."
            : "This event is no longer accepting participants.",
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The event could not be joined. Please try again.",
      },
    };
  }

  const parsedResult = joinEventResultSchema.safeParse(data);
  if (!parsedResult.success) {
    console.error("[joinEvent] RPC returned an unexpected response.");
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The event join could not be confirmed. Please refresh and try again.",
      },
    };
  }

  revalidatePath("/e/[slug]", "page");
  revalidatePath("/community");

  return {
    success: true,
    data: {
      status: parsedResult.data.status,
      waitlistPosition: parsedResult.data.waitlist_position,
    },
  };
}

export async function leaveEvent(
  input: unknown,
): Promise<ActionResult<LeaveResult>> {
  const parsedInput = leaveEventSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "This event could not be left. Refresh the page and try again.",
      },
    };
  }

  const current = await getCurrentProfile();
  if (!current) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sign in to leave this event." },
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
  const { data, error } = await supabase.rpc("leave_event", {
    p_event_id: parsedInput.data.eventId,
  });

  if (error) {
    console.error("[leaveEvent]", { code: error.code, message: error.message });
    if (error.code === "42501") {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Sign in to leave this event." },
      };
    }
    if (error.message.includes("Participation not found")) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "You are not currently joined to this event.",
        },
      };
    }
    if (error.message.includes("Event not found")) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "This event is no longer available." },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The event could not be left. Please try again.",
      },
    };
  }

  const parsedResult = leaveEventResultSchema.safeParse(data);
  if (!parsedResult.success) {
    console.error("[leaveEvent] RPC returned an unexpected response.");
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Your departure could not be confirmed. Please refresh and try again.",
      },
    };
  }

  revalidatePath("/e/[slug]", "page");
  revalidatePath("/community");

  return {
    success: true,
    data: {
      cancelled: true,
      promotedProfileId: parsedResult.data.promoted_profile_id,
    },
  };
}
