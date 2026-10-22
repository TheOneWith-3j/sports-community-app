"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/features/auth/queries";
import { requireCommunityAdmin } from "@/lib/auth/roles";
import type { Event } from "@/features/events/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createEventSchema,
  eventIdSchema,
  updateEventSchema,
} from "@/lib/validations/event";
import type { ActionResult } from "@/types/actions";

function validationFailure(
  issues: { path: PropertyKey[]; message: string }[],
): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      fieldErrors[field] ??= [];
      fieldErrors[field].push(issue.message);
    }
  }

  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Review the highlighted fields and try again.",
      fieldErrors,
    },
  };
}

function authenticationFailure(
  current: Awaited<ReturnType<typeof getCurrentProfile>>,
): ActionResult<never> | null {
  if (!current) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sign in to manage events." },
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
  return null;
}

async function requireEventAdmin(
  communityId: string,
): Promise<ActionResult<never> | null> {
  const permission = await requireCommunityAdmin(communityId);
  if (!permission.authorized && permission.reason === "unavailable") {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Event permissions could not be checked. Please try again.",
      },
    };
  }
  if (!permission.authorized) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to manage events in this community.",
      },
    };
  }
  return null;
}

function mapEventError(code: string): ActionResult<never> {
  if (code === "23505") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "This event could not be saved because its share link conflicts. Please try again.",
      },
    };
  }
  if (code === "42501") {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to manage this event.",
      },
    };
  }
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "The event could not be saved. Please try again.",
    },
  };
}

function revalidateEventPaths(eventId?: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/community");
  revalidatePath("/events");
  revalidatePath("/events/new");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

export async function createEvent(input: unknown): Promise<ActionResult<Event>> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(parsed.error.issues);
  }

  const current = await getCurrentProfile();
  const authFailure = authenticationFailure(current);
  if (authFailure) {
    return authFailure;
  }
  if (!current || "error" in current) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Event creation failed." },
    };
  }

  const permission = await requireEventAdmin(parsed.data.communityId);
  if (permission) {
    return permission;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      community_id: parsed.data.communityId,
      activity_type_id: parsed.data.activityTypeId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      capacity: parsed.data.capacity,
      location: parsed.data.location || null,
      status: parsed.data.status,
      share_slug: randomBytes(6).toString("base64url"),
    })
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("[createEvent]", { code: error.code });
    return mapEventError(error.code);
  }

  revalidateEventPaths(data.id);
  return { success: true, data };
}

export async function updateEvent(input: unknown): Promise<ActionResult<Event>> {
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(parsed.error.issues);
  }

  const current = await getCurrentProfile();
  const authFailure = authenticationFailure(current);
  if (authFailure) {
    return authFailure;
  }
  if (!current || "error" in current) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Event update failed." },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: lookupError } = await supabase
    .from("events")
    .select("id, community_id, starts_at, status")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[updateEvent] lookup failed", { code: lookupError.code });
    return mapEventError(lookupError.code);
  }
  if (!existing) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "This event could not be found." },
    };
  }

  const permission = await requireEventAdmin(existing.community_id);
  if (permission) {
    return permission;
  }
  if (
    new Date(existing.starts_at) <= new Date() ||
    !["draft", "published"].includes(existing.status)
  ) {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Started or cancelled events can no longer be edited.",
      },
    };
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      activity_type_id: parsed.data.activityTypeId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      capacity: parsed.data.capacity,
      location: parsed.data.location || null,
    })
    .eq("id", parsed.data.id)
    .gt("starts_at", new Date().toISOString())
    .in("status", ["draft", "published"])
    .is("deleted_at", null)
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    console.error("[updateEvent]", { code: error.code });
    return mapEventError(error.code);
  }
  if (!data) {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Started or cancelled events can no longer be edited.",
      },
    };
  }

  revalidateEventPaths(data.id);
  return { success: true, data };
}

async function updateEventStatus(
  input: unknown,
  nextStatus: "published" | "cancelled",
): Promise<ActionResult<Event>> {
  const parsed = eventIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(parsed.error.issues);
  }

  const current = await getCurrentProfile();
  const authFailure = authenticationFailure(current);
  if (authFailure) {
    return authFailure;
  }
  if (!current || "error" in current) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Event status update failed." },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: lookupError } = await supabase
    .from("events")
    .select("id, community_id, starts_at, status")
    .eq("id", parsed.data.eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[updateEventStatus] lookup failed", {
      code: lookupError.code,
    });
    return mapEventError(lookupError.code);
  }
  if (!existing) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "This event could not be found." },
    };
  }

  const permission = await requireEventAdmin(existing.community_id);
  if (permission) {
    return permission;
  }
  if (existing.status === "cancelled" || existing.status === "completed") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "This event can no longer change status.",
      },
    };
  }
  if (nextStatus === "published" && existing.status !== "draft") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Only draft events can be published.",
      },
    };
  }
  if (nextStatus === "published" && new Date(existing.starts_at) <= new Date()) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "An event cannot be published after it has started.",
      },
    };
  }

  const { data, error } = await supabase
    .from("events")
    .update({ status: nextStatus })
    .eq("id", existing.id)
    .eq("status", existing.status)
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    console.error("[updateEventStatus]", { code: error.code });
    return mapEventError(error.code);
  }
  if (!data) {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "This event has changed. Refresh and try again.",
      },
    };
  }

  revalidateEventPaths(data.id);
  return { success: true, data };
}

export async function publishEvent(input: unknown): Promise<ActionResult<Event>> {
  return updateEventStatus(input, "published");
}

export async function cancelEvent(input: unknown): Promise<ActionResult<Event>> {
  return updateEventStatus(input, "cancelled");
}
