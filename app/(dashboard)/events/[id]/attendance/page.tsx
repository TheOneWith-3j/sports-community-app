import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AttendanceCard } from "@/components/domain/attendance-card";
import { ProfileResolutionError } from "@/features/auth/components/profile-resolution-error";
import { getCurrentProfile } from "@/features/auth/queries";
import { canManageCommunity } from "@/features/communities/queries";
import { getEventById } from "@/features/events/queries";
import { getAttendanceParticipants } from "@/features/attendance/queries";
import { eventIdSchema } from "@/lib/validations/event";

export const instant = false;

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const parsedId = eventIdSchema.safeParse({ eventId: routeParams.id });
  if (!parsedId.success) notFound();

  const current = await getCurrentProfile();
  if (!current) redirect(`/auth/login?returnTo=${encodeURIComponent(`/events/${routeParams.id}/attendance`)}`);
  if ("error" in current) return <ProfileResolutionError error={current.error} />;

  const event = await getEventById(parsedId.data.eventId);
  if ("error" in event) {
    return <p role="alert" className="text-body-md text-destructive">Event details could not be loaded.</p>;
  }
  if (!event.data) notFound();

  const authorization = await canManageCommunity(event.data.community_id);
  if ("error" in authorization || !authorization.data) redirect(`/events/${routeParams.id}`);

  const participants = await getAttendanceParticipants(event.data.id);
  if ("error" in participants) {
    return <p role="alert" className="text-body-md text-destructive">Attendance could not be loaded. Please refresh and try again.</p>;
  }
  const counts = participants.data.reduce(
    (summary, participant) => {
      if (participant.status) summary[participant.status] += 1;
      else summary.unmarked += 1;
      return summary;
    },
    { present: 0, absent: 0, no_show: 0, unmarked: 0 },
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link href={`/events/${event.data.id}`} className="text-body-sm text-muted-foreground underline-offset-4 hover:underline">
        Back to event
      </Link>
      <div className="space-y-2">
        <p className="text-overline uppercase text-muted-foreground">Attendance</p>
        <h2 className="text-display-lg text-foreground">{event.data.title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-body-sm capitalize text-muted-foreground">{label.replace("_", " ")}</p>
            <p className="text-heading-lg text-foreground">{count}</p>
          </div>
        ))}
      </div>
      {participants.data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-body-md text-muted-foreground">No confirmed participants.</p>
      ) : (
        <ul className="space-y-3">
          {participants.data.map((participant) => (
            <AttendanceCard key={participant.id} participant={participant} />
          ))}
        </ul>
      )}
    </section>
  );
}
