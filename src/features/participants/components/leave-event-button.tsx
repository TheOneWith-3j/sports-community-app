"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  leaveEvent,
  type LeaveResult,
} from "@/features/participants/actions";
import type { ActionResult } from "@/types/actions";

type LeaveEventButtonProps = {
  eventId: string;
};

export function LeaveEventButton({ eventId }: LeaveEventButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<LeaveResult> | null>(null);

  function handleLeave() {
    setResult(null);
    startTransition(async () => {
      const actionResult = await leaveEvent({ eventId });
      setResult(actionResult);
      if (actionResult.success) {
        router.refresh();
      }
    });
  }

  if (result?.success) {
    return (
      <p role="status" className="text-body-sm text-muted-foreground">
        You&apos;ve left this event.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ConfirmationDialog
        title="Leave this event?"
        description="Your spot will be released. If you are confirmed, the first person on the waitlist will be promoted automatically."
        confirmLabel="Leave event"
        pending={pending}
        onConfirm={handleLeave}
      >
        <Button type="button" variant="secondary" disabled={pending}>
          Leave event
        </Button>
      </ConfirmationDialog>
      {result && !result.success ? (
        <p role="alert" className="text-body-sm text-destructive">
          {result.error.message}
        </p>
      ) : null}
    </div>
  );
}
