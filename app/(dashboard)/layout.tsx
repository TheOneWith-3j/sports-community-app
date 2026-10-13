import { redirect } from "next/navigation";
import Link from "next/link";

import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import {
  getCurrentProfile,
} from "@/features/auth/queries";

export const instant = false;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const result = await getCurrentProfile();

  if (!result) {
    redirect("/auth/login?returnTo=%2Fdashboard");
  }

  if ("error" in result) {
    return <ProfileResolutionError error={result.error} />;
  }

  if (!result.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-overline uppercase text-muted-foreground">Dashboard</p>
            <h1 className="text-heading-md text-foreground">Community hub</h1>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80"
          >
            Profile settings
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
