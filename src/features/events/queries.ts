import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Event = Pick<
  Tables<"events">,
  | "id"
  | "community_id"
  | "created_by"
  | "activity_type_id"
  | "title"
  | "description"
  | "starts_at"
  | "ends_at"
  | "capacity"
  | "location"
  | "status"
  | "share_slug"
  | "created_at"
  | "updated_at"
>;

export type EventWithCounts = Event & {
  confirmedCount: number;
};

export type EventQueryResult<T> = { data: T } | { error: true };

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

async function includeConfirmedCount(
  supabase: ServerSupabaseClient,
  event: Event | null,
): Promise<EventQueryResult<EventWithCounts | null>> {
  if (!event) {
    return { data: null };
  }

  const { count, error } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "confirmed");

  if (error || count === null) {
    console.error("[includeConfirmedCount]", {
      code: error?.code ?? "MISSING_COUNT",
    });
    return { error: true };
  }

  return { data: { ...event, confirmedCount: count } };
}

export async function getEventsForCommunity(
  communityId: string,
): Promise<EventQueryResult<Event[]>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .eq("community_id", communityId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[getEventsForCommunity]", { code: error.code });
    return { error: true };
  }

  return { data };
}

export async function getUpcomingEventsWithCounts(
  communityId: string,
): Promise<EventQueryResult<EventWithCounts[]>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .eq("community_id", communityId)
    .eq("status", "published")
    .is("deleted_at", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[getUpcomingEventsWithCounts]", { code: error.code });
    return { error: true };
  }

  const events = await Promise.all(
    data.map(async (event) => {
      const result = await includeConfirmedCount(supabase, event);
      return result;
    }),
  );
  if (events.some((result) => "error" in result)) {
    return { error: true };
  }
  return {
    data: events.flatMap((result) => ("data" in result && result.data ? [result.data] : [])),
  };
}

export const getEventBySlug = cache(
  async (
    shareSlug: string,
  ): Promise<EventQueryResult<EventWithCounts | null>> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
      )
      .eq("share_slug", shareSlug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("[getEventBySlug]", { code: error.code });
      return { error: true };
    }

    return includeConfirmedCount(supabase, data);
  },
);

export const getEventWithCounts = cache(
  async (
    eventId: string,
  ): Promise<EventQueryResult<EventWithCounts | null>> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
      )
      .eq("id", eventId)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("[getEventWithCounts]", { code: error.code });
      return { error: true };
    }

    return includeConfirmedCount(supabase, data);
  },
);

export async function getEventById(
  eventId: string,
): Promise<EventQueryResult<Event | null>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, community_id, created_by, activity_type_id, title, description, starts_at, ends_at, capacity, location, status, share_slug, created_at, updated_at",
    )
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[getEventById]", { code: error.code });
    return { error: true };
  }

  return { data };
}
