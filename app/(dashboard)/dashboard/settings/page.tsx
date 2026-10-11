import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/auth/components/profile-form";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";

export const instant = false;

export default async function ProfileSettingsPage() {
  const result = await getCurrentProfile();

  if (!result) {
    redirect("/auth/login?returnTo=%2Fdashboard%2Fsettings");
  }

  if ("error" in result) {
    return <ProfileResolutionError error={result.error} />;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-overline uppercase text-muted-foreground">
          Account
        </p>
        <h2 className="mt-2 text-display-md text-foreground">
          Profile settings
        </h2>
        <p className="mt-2 text-body-md text-muted-foreground">
          Update how your name and contact details appear to your sports
          community.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <ProfileForm profile={result.profile} />
      </div>
    </section>
  );
}
