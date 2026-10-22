import { CapacityBar } from "@/features/events/components/capacity-bar";
import type { EventWithCounts } from "@/features/events/queries";
import { JoinEventButton } from "@/features/participants/components/join-event-button";
import { ParticipantList } from "@/components/domain/participant-list";
import type { ConfirmedParticipant } from "@/features/participants/queries";
import type { UserParticipation } from "@/features/participants/queries";
import { formatEventDate } from "@/lib/utils/event";

type EventHeaderProps = {
  event: EventWithCounts;
  isAuthenticated: boolean;
  onboardingRequired: boolean;
  participation: UserParticipation | null;
  participationError?: boolean;
  participants: ConfirmedParticipant[];
};

export function EventHeader({
  event,
  isAuthenticated,
  onboardingRequired,
  participation,
  participationError,
  participants,
}: EventHeaderProps) {
  return (
    <article className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <header className="space-y-3">
        <p className="text-overline uppercase text-muted-foreground">
          Community sports event
        </p>
        <h1 className="text-display-lg break-words text-foreground">
          {event.title}
        </h1>
        {event.description ? (
          <p className="whitespace-pre-wrap text-body-lg text-muted-foreground">
            {event.description}
          </p>
        ) : null}
      </header>

      <dl className="grid gap-5 border-y border-border py-5 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-label text-muted-foreground">Starts</dt>
          <dd className="text-body-md text-foreground">
            {formatEventDate(event.starts_at)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-label text-muted-foreground">Ends</dt>
          <dd className="text-body-md text-foreground">
            {formatEventDate(event.ends_at)}
          </dd>
        </div>
        {event.location ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-label text-muted-foreground">Location</dt>
            <dd className="break-words text-body-md text-foreground">
              {event.location}
            </dd>
          </div>
        ) : null}
      </dl>

      <CapacityBar
        capacity={event.capacity}
        confirmedCount={event.confirmedCount}
      />

      <JoinEventButton
        eventId={event.id}
        shareSlug={event.share_slug}
        isAuthenticated={isAuthenticated}
        onboardingRequired={onboardingRequired}
        participation={participation}
        participationError={participationError}
      />
      <ParticipantList participants={participants} />
    </article>
  );
}
