import { redirect } from "next/navigation";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { getCommunityForUser } from "@/features/communities/queries";

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

  redirect(community.data ? "/community" : "/community/setup");
}
