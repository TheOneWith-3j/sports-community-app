import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import type { Event } from "@/features/events/queries";
import { formatEventDate } from "@/lib/utils/event";
import { CopyShareLinkButton } from "@/components/domain/copy-share-link-button";
import { getEventShareUrl } from "@/lib/utils/event-share";

type EventCardProps = {
  event: Event;
  confirmedCount?: number;
};

const statusLabel: Record<Event["status"], string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function EventCard({ event, confirmedCount }: EventCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/5 ${
        event.status === "draft" ? "opacity-80" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to opacity-70" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex max-w-full items-center gap-2 text-heading-md text-foreground underline-offset-4 hover:underline"
          >
            <span className="truncate">{event.title}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatEventDate(event.starts_at)}</span>
            {event.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location}</span> : null}
          </div>
        </div>
        <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-body-sm text-brand-primary">
          {statusLabel[event.status]}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-body-sm text-muted-foreground">
        <span>
          Capacity: {confirmedCount === undefined ? "—" : `${confirmedCount}/${event.capacity}`}
        </span>
        {confirmedCount !== undefined ? (
          <div className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to"
              style={{ width: `${Math.min((confirmedCount / event.capacity) * 100, 100)}%` }}
            />
          </div>
        ) : null}
      </div>
      {event.status === "published" ? (
        <div className="mt-4">
          <CopyShareLinkButton
            shareUrl={getEventShareUrl(event.share_slug, process.env.APP_BASE_URL)}
          />
        </div>
      ) : null}
      {event.status === "cancelled" ? (
        <p className="mt-3 text-body-sm text-muted-foreground">
          This event has been cancelled.
        </p>
      ) : null}
    </article>
  );
}
