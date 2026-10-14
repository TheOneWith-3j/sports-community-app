import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { EventForm } from "@/features/events/components/event-form";
import {
  getActivityTypes,
  getCommunityForUser,
} from "@/features/communities/queries";

export const instant = false;

export default async function NewEventPage() {
  const current = await getCurrentProfile();
  if (!current) {
    redirect("/auth/login?returnTo=%2Fevents%2Fnew");
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

  const activityTypes = await getActivityTypes();
  if ("error" in activityTypes) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Activity options could not be loaded. Please refresh and try again.
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
        <h2 className="text-display-lg text-foreground">Create an event</h2>
        <p className="text-body-md text-muted-foreground">
          Add the details members need to join your community event.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <EventForm
          activityTypes={activityTypes.data}
          communityId={community.data.id}
        />
      </div>
    </section>
  );
}
