import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { ProfileForm } from "@/features/auth/components/profile-form";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

export const instant = false;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const returnTo = safeReturnTo(
    typeof params.returnTo === "string" ? params.returnTo : null,
  );
  const result = await getCurrentProfile();

  if (!result) {
    redirect("/auth/login?returnTo=%2Fonboarding");
  }

  if ("error" in result) {
    return <ProfileResolutionError error={result.error} />;
  }

  if (result.profile.onboarding_completed) {
    redirect(returnTo);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="w-full space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 text-overline uppercase text-brand-primary">
            <Sparkles className="h-4 w-4" />
            Welcome to RallyNook
          </p>
          <h1 className="mt-2 text-display-md text-foreground">
            Set up your profile
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            Choose the name your community will see before you continue.
          </p>
        </div>
        <ProfileForm
          profile={result.profile}
          onboarding
          returnTo={returnTo}
        />
      </section>
    </main>
  );
}
