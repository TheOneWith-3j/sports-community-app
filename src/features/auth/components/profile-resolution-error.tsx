import type { ProfileResolutionError } from "@/features/auth/queries";

const errorDetails: Record<
  ProfileResolutionError,
  { title: string; description: string }
> = {
  supabase_api_key_invalid: {
    title: "Supabase rejected its publishable key",
    description:
      "Copy the current publishable key from this project's Supabase Connect dialog into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. Make sure it belongs to the project URL in NEXT_PUBLIC_SUPABASE_URL, then restart the local app.",
  },
  auth0_token_rejected: {
    title: "Supabase rejected the Auth0 token",
    description:
      "Check that Auth0 is enabled under Supabase Authentication → Third-Party Auth with the correct tenant and region, and that the deployed Auth0 Post-Login Action adds role: authenticated to the ID token. Sign out and sign in again after correcting settings.",
  },
  profile_migration_missing: {
    title: "The profile setup is missing from this database",
    description:
      "The ensure_current_profile database function was not found. Confirm this is the intended Supabase project, review the pending migrations, then apply them before retrying.",
  },
  profile_unavailable: {
    title: "Your application profile could not be loaded",
    description:
      "Check the local development server output for the Supabase error, verify the project URL and key, and confirm the database migrations are applied.",
  },
};

export function ProfileResolutionError({
  error,
}: {
  error: ProfileResolutionError;
}) {
  const details = errorDetails[error];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12 sm:px-6">
      <section
        aria-labelledby="profile-error-title"
        className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <p className="text-overline uppercase text-muted-foreground">
          Account setup
        </p>
        <h1
          id="profile-error-title"
          className="mt-2 text-heading-lg text-foreground"
        >
          {details.title}
        </h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          {details.description}
        </p>
        <a
          href="/auth/logout"
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80"
        >
          Sign out
        </a>
      </section>
    </main>
  );
}
