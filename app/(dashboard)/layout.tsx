import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { ensureCurrentProfile } from "@/features/auth/queries";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}

async function AuthenticatedDashboard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const profileId = await ensureCurrentProfile();

  if (!profileId) {
    redirect("/auth/login?returnTo=%2Fdashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-overline uppercase text-muted-foreground">Dashboard</p>
            <h1 className="text-heading-md text-foreground">Community hub</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
