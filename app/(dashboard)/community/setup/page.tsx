import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { CommunityForm } from "@/features/communities/components/community-form";
import {
  getActivityTypes,
  getCommunityForUser,
} from "@/features/communities/queries";

export const instant = false;

export default async function CommunitySetupPage() {
  const current = await getCurrentProfile();

  if (!current) {
    redirect("/auth/login?returnTo=%2Fcommunity%2Fsetup");
  }
  if ("error" in current) {
    return <ProfileResolutionError error={current.error} />;
  }

  const community = await getCommunityForUser(current.profile.id);
  if ("error" in community) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Your community status could not be checked. Please refresh and try again.
      </p>
    );
  }
  if (community.data) {
    redirect("/community");
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
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-overline uppercase text-brand-primary">
          <Sparkles className="h-4 w-4" />
          Community setup
        </p>
        <h2 className="text-display-lg text-foreground">
          Create your sports community
        </h2>
        <p className="text-body-md text-muted-foreground">
          Set up your group so you can share events with your players.
        </p>
      </div>

      {activityTypes.data.length === 0 ? (
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted/50 p-4 text-body-sm text-muted-foreground"
        >
          No activity types are available yet. Please try again later.
        </p>
      ) : null}

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <CommunityForm activityTypes={activityTypes.data} />
      </div>
    </section>
  );
}
