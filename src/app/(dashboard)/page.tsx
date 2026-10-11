import { signOut } from "@/features/auth/actions";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-display-lg text-foreground">Your dashboard</h2>
        <p className="mt-2 max-w-2xl text-body-lg text-muted-foreground">
          This placeholder dashboard is in place for the protected auth shell. Upcoming milestones will add community, event, and attendance management.
        </p>
      </div>

      <form action={signOut} className="inline-block">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80"
        >
          Sign out
        </button>
      </form>
    </section>
  );
}
