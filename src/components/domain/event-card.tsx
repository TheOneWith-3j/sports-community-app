import Link from "next/link";

import type { Event } from "@/features/events/queries";
import { formatEventDate } from "@/lib/utils/event";

type EventCardProps = {
  event: Event;
};

const statusLabel: Record<Event["status"], string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 ${
        event.status === "draft" ? "opacity-80" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href={`/events/${event.id}`}
            className="text-heading-md text-foreground underline-offset-4 hover:underline"
          >
            {event.title}
          </Link>
          <p className="text-body-sm text-muted-foreground">
            {formatEventDate(event.starts_at)}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-body-sm text-muted-foreground">
          {statusLabel[event.status]}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted-foreground">
        <span>Capacity: {event.capacity}</span>
        {event.location ? <span>{event.location}</span> : null}
      </div>
      {event.status === "cancelled" ? (
        <p className="mt-3 text-body-sm text-muted-foreground">
          This event has been cancelled.
        </p>
      ) : null}
    </article>
  );
}
