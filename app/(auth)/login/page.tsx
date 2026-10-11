import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries";
import { isAuth0Configured } from "@/lib/auth0";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[]; error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <p role="status" className="text-body-sm text-muted-foreground">Loading sign-in...</p>
        </main>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[]; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const redirectTo = safeReturnTo(typeof params.next === "string" ? params.next : null);
  const auth0Configured = isAuth0Configured();

  if (auth0Configured && (await getCurrentUser())) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <div className="mb-8 space-y-2">
          <p className="text-overline uppercase text-muted-foreground">Welcome back</p>
          <h1 className="text-display-lg text-foreground">Sign in to your community</h1>
        </div>

        {params.error === "auth_not_configured" ? (
          <p role="alert" className="rounded-lg border border-border bg-muted/50 p-4 text-body-sm text-muted-foreground">
            Sign-in is not configured for this environment. Add the required Auth0 settings and try again.
          </p>
        ) : null}
        {auth0Configured ? (
          <a
            href={`/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(redirectTo)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-3 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95"
          >
            Continue with Google
          </a>
        ) : (
          <p role="status" className="rounded-lg border border-border bg-muted/50 p-4 text-body-sm text-muted-foreground">
            Configure Auth0 to enable sign-in in this environment.
          </p>
        )}
      </div>
    </main>
  );
}
