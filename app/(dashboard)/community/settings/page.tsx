import { redirect } from "next/navigation";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { CommunityForm } from "@/features/communities/components/community-form";
import {
  canManageCommunity,
  getActivityTypes,
  getCommunityForUser,
} from "@/features/communities/queries";

export const instant = false;

export default async function CommunitySettingsPage() {
  const current = await getCurrentProfile();

  if (!current) {
    redirect("/auth/login?returnTo=%2Fcommunity%2Fsettings");
  }
  if ("error" in current) {
    return <ProfileResolutionError error={current.error} />;
  }

  const community = await getCommunityForUser(current.profile.id);
  if ("error" in community) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Community settings could not be loaded. Please refresh and try again.
      </p>
    );
  }
  if (!community.data) {
    redirect("/community/setup");
  }

  const authorization = await canManageCommunity(community.data.id);
  if ("error" in authorization) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Your community permissions could not be checked. Please try again.
      </p>
    );
  }
  if (!authorization.data) {
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
        <p className="text-overline uppercase text-muted-foreground">
          Community settings
        </p>
        <h2 className="text-display-lg text-foreground">
          Manage your community
        </h2>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <CommunityForm
          activityTypes={activityTypes.data}
          community={community.data}
        />
      </div>
    </section>
  );
}
