import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { getCommunityForUser } from "@/features/communities/queries";
import { EventCard } from "@/components/domain/event-card";
import { getEventsForCommunity } from "@/features/events/queries";

export const instant = false;

export default async function EventsPage() {
  const current = await getCurrentProfile();
  if (!current) {
    redirect("/auth/login?returnTo=%2Fevents");
  }
  if ("error" in current) {
    return <ProfileResolutionError error={current.error} />;
  }

  const community = await getCommunityForUser(current.profile.id);
  if ("error" in community) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Your community could not be loaded. Please refresh and try again.
      </p>
    );
  }
  if (!community.data) {
    redirect("/community/setup");
  }

  const events = await getEventsForCommunity(community.data.id);
  if ("error" in events) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Events could not be loaded. Please refresh and try again.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-overline uppercase text-muted-foreground">
            {community.data.name}
          </p>
          <h2 className="text-display-lg text-foreground">Events</h2>
        </div>
        <Link
          href="/events/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-2 text-label font-medium text-slate-950"
        >
          Create event
        </Link>
      </div>

      {events.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h3 className="text-heading-md text-foreground">No events yet</h3>
          <p className="mt-2 text-body-md text-muted-foreground">
            Create an event and share it with your community.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
