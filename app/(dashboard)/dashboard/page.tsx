import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { getCommunityForUser } from "@/features/communities/queries";
import { getUpcomingEventsWithCounts } from "@/features/events/queries";
import { EventCard } from "@/components/domain/event-card";
import { StatisticsCard } from "@/components/domain/statistics-card";

export const instant = false;

export default async function DashboardPage() {
  const current = await getCurrentProfile();

  if (!current) {
    redirect("/auth/login?returnTo=%2Fdashboard");
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

  const events = await getUpcomingEventsWithCounts(community.data.id);
  if ("error" in events) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Dashboard data could not be loaded. Please refresh and try again.
      </p>
    );
  }
  const confirmedCount = events.data.reduce(
    (total, event) => total + event.confirmedCount,
    0,
  );

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-brand-primary/10 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="inline-flex items-center gap-2 text-overline uppercase text-brand-primary">
            <Sparkles className="h-4 w-4" />
            {community.data.name}
          </p>
          <h2 className="mt-2 text-display-lg text-foreground">Make plans. Show up. Play more.</h2>
          <p className="mt-2 text-body-md text-muted-foreground">
            Everything your community needs for its next great game.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-2 text-label font-medium text-slate-950"
        >
          Create event
        </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatisticsCard
          label="Upcoming events"
          value={events.data.length}
          helper="Published events ahead"
          icon={CalendarDays}
        />
        <StatisticsCard
          label="Confirmed spots"
          value={confirmedCount}
          helper="Across upcoming events"
          icon={UsersRound}
        />
        <StatisticsCard
          label="Community"
          value={1}
          helper="Active community"
          icon={Sparkles}
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-heading-lg text-foreground">Your next games</h3>
          <Link
            href="/events"
            className="text-body-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            <span>View all</span><ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {events.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8">
            <h4 className="text-heading-md text-foreground">No upcoming events</h4>
            <p className="mt-2 text-body-md text-muted-foreground">
              Create an event and share it with your community.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {events.data.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                confirmedCount={event.confirmedCount}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
