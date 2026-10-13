import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/auth/components/profile-form";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";

export const instant = false;

export default async function OnboardingPage() {
  const result = await getCurrentProfile();

  if (!result) {
    redirect("/auth/login?returnTo=%2Fonboarding");
  }

  if ("error" in result) {
    return <ProfileResolutionError error={result.error} />;
  }

  if (result.profile.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="w-full space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-overline uppercase text-muted-foreground">
            Welcome to RallyNook
          </p>
          <h1 className="mt-2 text-display-md text-foreground">
            Set up your profile
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            Choose the name your community will see before you continue.
          </p>
        </div>
        <ProfileForm profile={result.profile} onboarding />
      </section>
    </main>
  );
}
