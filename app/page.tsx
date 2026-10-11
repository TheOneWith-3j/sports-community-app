import { ArrowRight, CalendarCheck2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between rounded-full border border-border/80 bg-card/70 px-4 py-3 backdrop-blur-md shadow-sm sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-sm font-bold text-slate-950 shadow-lg shadow-brand-primary/30">
              SC
            </div>
            <div>
              <p className="text-label text-foreground">Sports Community</p>
              <p className="text-body-sm text-muted-foreground">Event participation platform</p>
            </div>
          </div>
          <Button variant="secondary" className="hidden sm:inline-flex">
            View demo
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-12 py-8 md:grid-cols-[1.2fr_0.8fr] md:py-12">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-brand-primary" />
              Built for local sports communities
            </div>

            <div className="space-y-5">
              <h1 className="text-display-xl max-w-xl text-balance tracking-[-0.04em] text-foreground">
                Replace WhatsApp list chaos with a cleaner way to run community events.
              </h1>
              <p className="max-w-xl text-body-lg text-muted-foreground">
                Sports Community App helps admins publish events, members join in seconds, and everyone stays informed with waitlists, auto-promotion, and attendance tracking.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="inline-flex items-center gap-2">
                Launch an event
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg">
                Explore features
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-body-md text-muted-foreground">
              <span>Badminton</span>
              <span>Pickleball</span>
              <span>Community admin tools</span>
            </div>
          </div>

          <Card className="overflow-hidden border border-border bg-card p-0 shadow-lg shadow-black/20">
            <div className="bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-5 py-4 text-sm font-semibold text-slate-950">
              Upcoming event
            </div>
            <div className="space-y-5 p-5">
              <div className="space-y-2">
                <p className="text-overline uppercase text-muted-foreground">Saturday night social</p>
                <h2 className="text-heading-lg text-foreground">Pickleball Social Mixer</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Spots</p>
                  <p className="mt-2 text-heading-md text-foreground">12 / 16</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Waitlist</p>
                  <p className="mt-2 text-heading-md text-foreground">4</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-body-sm text-muted-foreground">Status</p>
                  <p className="mt-2 text-heading-md text-success">Open</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-body-sm text-muted-foreground">Confirmed players</span>
                  <span className="rounded-full bg-success/15 px-2 py-1 text-body-sm font-medium text-success">9 joined</span>
                </div>
                <div className="flex -space-x-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-body-sm font-semibold text-slate-950"
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
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
