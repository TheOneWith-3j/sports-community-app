import { ArrowRight, CalendarCheck2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getFeaturedPublicEvent } from "@/features/events/queries";
import { formatEventDate } from "@/lib/utils/event";

const highlights = [
  {
    icon: Users,
    title: "Member-first communities",
    description: "Keep everyone in sync with one shared event list and a clear RSVP flow.",
  },
  {
    icon: CalendarCheck2,
    title: "FCFS without chaos",
    description: "Members join on demand while waitlists and auto-promotion handle overflow automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "Role-based access and database-enforced checks help protect admin-only actions.",
  },
];

export const instant = false;

export default async function Home() {
  const featuredEvent = await getFeaturedPublicEvent();
  const event = "data" in featuredEvent ? featuredEvent.data : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-border/80 bg-card/70 px-4 py-3 shadow-sm backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-sm font-bold text-slate-950 shadow-lg shadow-brand-primary/30">
              RN
            </div>
            <div>
              <p className="text-label text-foreground">RallyNook</p>
              <p className="text-body-sm text-muted-foreground">Your corner for community sports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="#how-it-works"
              className="hidden rounded-xl px-3 py-2 text-body-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              How it works
            </Link>
            <Link href="/auth/login" className={buttonClassName("secondary")}>
              Sign in
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-brand-primary" />
              Built for local sports communities
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-display-xl text-balance tracking-[-0.05em] text-foreground">
                More play. Less group-chat chaos.
              </h1>
              <p className="max-w-xl text-body-lg text-muted-foreground">
                RallyNook gives local sports communities one lively home for events, fair RSVPs, and the people who make every game happen.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/login" className={buttonClassName("gradient", "lg")}>
                Launch an event
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#how-it-works" className={buttonClassName("secondary", "lg")}>
                Explore features
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-body-md text-muted-foreground">
              <span>Badminton</span>
              <span>Pickleball</span>
              <span>Community admin tools</span>
            </div>
          </div>

          <Card className="relative overflow-hidden border border-border bg-card p-0 shadow-2xl shadow-brand-primary/10">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-primary/15 blur-3xl" />
            <div className="relative border-b border-border bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-5 py-4 text-sm font-semibold text-slate-950">
              Live in your community
            </div>
            {event ? (
              <div className="relative space-y-5 p-5">
              <div className="space-y-2">
                <p className="text-overline uppercase text-muted-foreground">Next up</p>
                <h2 className="text-heading-lg text-foreground">{event.title}</h2>
                <p className="text-body-sm text-muted-foreground">
                  {formatEventDate(event.starts_at)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Spots</p>
                  <p className="mt-2 text-heading-md text-foreground">{event.confirmedCount} / {event.capacity}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Open spots</p>
                  <p className="mt-2 text-heading-md text-foreground">{Math.max(event.capacity - event.confirmedCount, 0)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Status</p>
                  <p className="mt-2 text-heading-md text-success">{event.confirmedCount < event.capacity ? "Open" : "Full"}</p>
                </div>
              </div>

              <Link href={`/e/${event.share_slug}`} className={buttonClassName("gradient")}>
                View event
                <ArrowRight className="h-4 w-4" />
              </Link>
              </div>
            ) : (
              <div className="space-y-3 p-6">
                <h2 className="text-heading-lg text-foreground">Your next game starts here.</h2>
                <p className="text-body-md text-muted-foreground">Sign in to create the first event for your community.</p>
                <Link href="/auth/login" className={buttonClassName("gradient")}>Create your first event</Link>
              </div>
            )}
          </Card>
        </section>

        <section id="how-it-works" className="mt-8 scroll-mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="h-full border border-border bg-card p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gradient-from/15 to-brand-gradient-to/15 text-brand-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-heading-md text-foreground">{title}</h3>
              <p className="mt-2 text-body-md text-muted-foreground">{description}</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

function buttonClassName(
  variant: "default" | "gradient" | "secondary",
  size: "default" | "lg" = "default",
): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const sizes = size === "lg" ? "h-12 px-5" : "h-11 px-4 py-2";
  const variants = {
    default: "bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-slate-950 shadow-lg shadow-brand-primary/20 hover:opacity-95",
    gradient: "bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-slate-950 shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 hover:opacity-95",
    secondary: "border border-border bg-card text-foreground hover:bg-muted/80",
  };
  return `${base} ${sizes} ${variants[variant]}`;
}
