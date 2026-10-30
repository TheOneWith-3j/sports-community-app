import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Settings2, UsersRound } from "lucide-react";

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
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-brand-primary/10 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-overline uppercase text-brand-primary">
            <UsersRound className="h-4 w-4" />
            Your community
          </p>
          <h2 className="mt-2 text-display-lg text-foreground">{result.data.name}</h2>
          <p className="text-body-md text-muted-foreground">
            {activityType.data?.name ?? "Sports community"}
          </p>
        </div>
        <Link
          href="/community/settings"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80"
        >
          <Settings2 className="h-4 w-4" />
          Community settings
        </Link>
      </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-overline uppercase text-muted-foreground">About the group</p>
        <p className="text-body-md text-foreground">
          {result.data.description || "Add a description so players know what your community is about."}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-overline uppercase text-muted-foreground">Keep the momentum</p>
        <p className="mt-4 text-body-sm text-muted-foreground">
          Community slug: <span className="font-medium text-foreground">{result.data.slug}</span>
        </p>
        <Link href="/events" className="mt-4 inline-flex items-center gap-2 text-label text-brand-primary hover:underline">
          Explore events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      </div>
    </section>
  );
}
