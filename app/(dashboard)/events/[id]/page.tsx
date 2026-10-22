import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CopyShareLinkButton } from "@/components/domain/copy-share-link-button";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { EventForm } from "@/features/events/components/event-form";
import { EventManagementActions } from "@/features/events/components/event-management-actions";
import { getEventById } from "@/features/events/queries";
import { getWaitlistedParticipants } from "@/features/participants/queries";
import { getConfirmedParticipants } from "@/features/participants/queries";
import { WaitlistCard } from "@/components/domain/waitlist-card";
import { ParticipantList } from "@/components/domain/participant-list";
import {
  canManageCommunity,
  getActivityType,
  getActivityTypes,
  getCommunityById,
} from "@/features/communities/queries";
import { getEventShareUrl } from "@/lib/utils/event-share";
import { eventIdSchema } from "@/lib/validations/event";
import { formatEventDate } from "@/lib/utils/event";

export const instant = false;

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const parsedId = eventIdSchema.safeParse({ eventId: routeParams.id });
  if (!parsedId.success) {
    notFound();
  }

  const current = await getCurrentProfile();
  if (!current) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(`/events/${routeParams.id}`)}`);
  }
  if ("error" in current) {
    return <ProfileResolutionError error={current.error} />;
  }

  const result = await getEventById(parsedId.data.eventId);
  if ("error" in result) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Event details could not be loaded. Please refresh and try again.
      </p>
    );
  }
  if (!result.data) {
    notFound();
  }

  const authorization = await canManageCommunity(result.data.community_id);
  if ("error" in authorization) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Your event permissions could not be checked. Please try again.
      </p>
    );
  }
  if (!authorization.data) {
    redirect("/events");
  }

  const [community, activityType, activityTypes] = await Promise.all([
    getCommunityById(result.data.community_id),
    getActivityType(result.data.activity_type_id),
    getActivityTypes(),
  ]);
  if ("error" in community || "error" in activityType || "error" in activityTypes) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Event information could not be loaded. Please refresh and try again.
      </p>
    );
  }

  const shareUrl = getEventShareUrl(
    result.data.share_slug,
    process.env.APP_BASE_URL,
  );
  const eventCanBeEdited =
    new Date(result.data.starts_at) > new Date() &&
    ["draft", "published"].includes(result.data.status);
  const waitlist = await getWaitlistedParticipants(result.data.id);
  if ("error" in waitlist) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        The event waitlist could not be loaded. Please refresh and try again.
      </p>
    );
  }
  const participants = await getConfirmedParticipants(result.data.id);
  if ("error" in participants) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        The participant list could not be loaded. Please refresh and try again.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/events"
          className="text-body-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to events
        </Link>
        <p className="text-overline uppercase text-muted-foreground">
          {community.data?.name ?? "Community event"}
        </p>
        <h2 className="text-display-lg text-foreground">{result.data.title}</h2>
        <p className="text-body-md text-muted-foreground">
          {activityType.data?.name ?? "Community event"}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="space-y-3">
          <p className="text-body-md text-foreground">
            Starts: {formatEventDate(result.data.starts_at)}
          </p>
          <p className="text-body-md text-foreground">
            Ends: {formatEventDate(result.data.ends_at)}
          </p>
          <p className="text-body-md text-foreground">
            Capacity: {result.data.capacity}
          </p>
          {result.data.location ? (
            <p className="text-body-md text-foreground">
              Location: {result.data.location}
            </p>
          ) : null}
          {result.data.description ? (
            <p className="whitespace-pre-wrap text-body-md text-muted-foreground">
              {result.data.description}
            </p>
          ) : null}
          <p className="text-body-sm text-muted-foreground">
            Status: <span className="capitalize">{result.data.status}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h3 className="text-heading-md text-foreground">Share this event</h3>
        <CopyShareLinkButton shareUrl={shareUrl} />
      </div>

      <EventManagementActions
        event={{ id: result.data.id, status: result.data.status }}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/events/${result.data.id}/attendance`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground hover:bg-muted/80"
        >
          Manage attendance
        </Link>
      </div>

      <ParticipantList participants={participants.data} adminActions />
      <WaitlistCard variant="admin" participants={waitlist.data} />

      {eventCanBeEdited ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="text-heading-md text-foreground">Edit event</h3>
          <EventForm
            activityTypes={activityTypes.data}
            communityId={result.data.community_id}
            event={result.data}
          />
        </div>
      ) : (
        <p className="text-body-sm text-muted-foreground">
          This event can no longer be edited.
        </p>
      )}
    </section>
  );
}
