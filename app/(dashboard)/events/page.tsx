import Link from "next/link";
import { ArrowRight, CalendarDays, Plus, Sparkles } from "lucide-react";
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
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-brand-primary/10 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-overline uppercase text-brand-primary">
            <CalendarDays className="h-4 w-4" />
            {community.data.name}
          </p>
          <h2 className="mt-2 text-display-lg text-foreground">Find your next game.</h2>
          <p className="max-w-xl text-body-md text-muted-foreground">
            Keep the crew moving with simple RSVPs, clear capacity, and no last-minute list hunting.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-2 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Create event
        </Link>
        </div>
      </div>

      {events.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brand-primary" />
          <h3 className="mt-4 text-heading-md text-foreground">Your calendar is wide open</h3>
          <p className="mt-2 text-body-md text-muted-foreground">
            Create an event, drop the link in your group chat, and let your community take it from there.
          </p>
          <Link href="/events/new" className="mt-5 inline-flex items-center gap-2 text-label text-brand-primary hover:underline">
            Create the first event <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.data.map((event) => (
            <EventCard key={event.id} event={event} confirmedCount={event.confirmedCount} />
          ))}
        </div>
      )}
    </section>
  );
}
