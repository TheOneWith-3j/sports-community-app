"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markAttendance } from "@/features/attendance/actions";
import type { AttendanceParticipant } from "@/features/attendance/queries";
import type { AttendanceStatus } from "@/lib/validations/attendance";

type AttendanceCardProps = {
  participant: AttendanceParticipant;
};

const statuses: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "no_show", label: "No-show" },
];

export function AttendanceCard({ participant }: AttendanceCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateStatus(status: AttendanceStatus) {
    setError(null);
    startTransition(async () => {
      const result = await markAttendance({
        participantId: participant.id,
        status,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-body-md text-foreground">{participant.displayName}</p>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Button
            key={status.value}
            type="button"
            variant={participant.status === status.value ? "default" : "secondary"}
            disabled={pending}
            onClick={() => updateStatus(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>
      {error ? <p role="alert" className="text-body-sm text-destructive">{error}</p> : null}
    </li>
  );
}
