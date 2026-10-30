import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardCheck, MapPin, Share2, Sparkles, UsersRound } from "lucide-react";

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
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-body-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-body-sm capitalize text-brand-primary">
          {result.data.status}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-brand-primary/10 p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative space-y-3">
        <p className="text-overline uppercase text-muted-foreground">
          {community.data?.name ?? "Community event"}
        </p>
        <h2 className="text-display-lg text-foreground">{result.data.title}</h2>
        <p className="inline-flex items-center gap-2 text-body-md text-brand-primary">
          <Sparkles className="h-4 w-4" />
          {activityType.data?.name ?? "Community event"}
        </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <CalendarDays className="h-5 w-5 text-brand-primary" />
          <p className="mt-3 text-body-sm text-muted-foreground">Starts</p>
          <p className="mt-1 text-label text-foreground">{formatEventDate(result.data.starts_at)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <UsersRound className="h-5 w-5 text-brand-primary" />
          <p className="mt-3 text-body-sm text-muted-foreground">Capacity</p>
          <p className="mt-1 text-label text-foreground">{result.data.capacity} players</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <MapPin className="h-5 w-5 text-brand-primary" />
          <p className="mt-3 text-body-sm text-muted-foreground">Location</p>
          <p className="mt-1 truncate text-label text-foreground">{result.data.location ?? "Location to be announced"}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-4">
          {result.data.location ? (
            <p className="inline-flex items-center gap-2 text-body-md text-foreground"><MapPin className="h-4 w-4 text-brand-primary" />{result.data.location}</p>
          ) : null}
          {result.data.description ? (
            <p className="whitespace-pre-wrap text-body-lg text-muted-foreground">
              {result.data.description}
            </p>
          ) : null}
          <p className="text-body-sm text-muted-foreground">Ends {formatEventDate(result.data.ends_at)}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h3 className="inline-flex items-center gap-2 text-heading-md text-foreground"><Share2 className="h-5 w-5 text-brand-primary" />Share this event</h3>
        <CopyShareLinkButton shareUrl={shareUrl} />
      </div>

      <EventManagementActions
        event={{ id: result.data.id, status: result.data.status }}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/events/${result.data.id}/attendance`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground hover:bg-muted/80"
        >
          <ClipboardCheck className="h-4 w-4" />
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
