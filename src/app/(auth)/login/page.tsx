import { redirect } from "next/navigation";

import { signInWithGoogle } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/queries";

async function getSafeRedirect(searchParams: Promise<{ next?: string | string[] }> | undefined) {
  const params = searchParams ? await searchParams : {};
  const next = params.next;

  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const redirectTo = await getSafeRedirect(searchParams);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <div className="mb-8 space-y-2">
          <p className="text-overline uppercase text-muted-foreground">Welcome back</p>
          <h1 className="text-display-lg text-foreground">Sign in to your community</h1>
        </div>

        <form action={signInWithGoogle} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-3 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
