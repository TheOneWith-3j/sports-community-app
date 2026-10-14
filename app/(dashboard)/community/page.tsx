import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/features/auth/queries";
import {
  getActivityType,
  getCommunityForUser,
} from "@/features/communities/queries";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";

export const instant = false;

export default async function CommunityPage() {
  const current = await getCurrentProfile();

  if (!current) {
    redirect("/auth/login?returnTo=%2Fcommunity");
  }
  if ("error" in current) {
    return <ProfileResolutionError error={current.error} />;
  }

  const result = await getCommunityForUser(current.profile.id);
  if ("error" in result) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Your community could not be loaded. Please refresh and try again.
      </p>
    );
  }
  if (!result.data) {
    redirect("/community/setup");
  }

  const activityType = await getActivityType(result.data.activity_type_id);
  if ("error" in activityType) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Community details could not be loaded. Please refresh and try again.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-overline uppercase text-muted-foreground">
            Your community
          </p>
          <h2 className="text-display-lg text-foreground">{result.data.name}</h2>
          <p className="text-body-md text-muted-foreground">
            {activityType.data?.name ?? "Sports community"}
          </p>
        </div>
        <Link
          href="/community/settings"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80"
        >
          Community settings
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-body-md text-foreground">
          {result.data.description || "Add a description so players know what your community is about."}
        </p>
        <p className="mt-4 text-body-sm text-muted-foreground">
          Community slug: <span className="font-medium text-foreground">{result.data.slug}</span>
        </p>
      </div>
    </section>
  );
}
