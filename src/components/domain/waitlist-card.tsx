import type { WaitlistedParticipant } from "@/features/participants/queries";

type WaitlistCardProps =
  | {
      variant: "user";
      position: number;
    }
  | {
      variant: "admin";
      participants: WaitlistedParticipant[];
    };

export function WaitlistCard(props: WaitlistCardProps) {
  if (props.variant === "user") {
    return (
      <section
        aria-label="Waitlist status"
        className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-4"
      >
        <span className="inline-flex rounded-full border border-warning/50 px-3 py-1 text-label text-warning">
          Waitlisted
        </span>
        <p className="text-heading-md text-foreground">
          #{props.position} on waitlist
        </p>
        <p className="text-body-sm text-muted-foreground">
          You&apos;ll be promoted automatically when a spot opens.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Event waitlist"
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-heading-md text-foreground">Waitlist</h3>
        <p className="text-body-sm text-muted-foreground">
          {props.participants.length}{" "}
          {props.participants.length === 1 ? "person" : "people"}
        </p>
      </div>
      {props.participants.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          No one is waiting for a spot.
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {props.participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-8 text-label text-muted-foreground">
                #{participant.position}
              </span>
              <div className="min-w-0">
                <p className="truncate text-body-md text-foreground">
                  {participant.displayName}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  Joined {new Date(participant.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
