"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  cancelEvent,
  publishEvent,
} from "@/features/events/actions";
import type { Event } from "@/features/events/queries";
import type { ActionResult } from "@/types/actions";

type EventManagementActionsProps = {
  event: Pick<Event, "id" | "status">;
};

export function EventManagementActions({
  event,
}: EventManagementActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<Event> | null>(null);
  const isFinal = event.status === "cancelled" || event.status === "completed";

  function runAction(action: "publish" | "cancel") {
    if (
      action === "cancel" &&
      !window.confirm("Cancel this event? Participants will no longer be able to join.")
    ) {
      return;
    }

    setResult(null);
    startTransition(async () => {
      const actionResult =
        action === "publish"
          ? await publishEvent({ eventId: event.id })
          : await cancelEvent({ eventId: event.id });
      setResult(actionResult);
      if (actionResult.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {event.status === "draft" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => runAction("publish")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-2 text-label font-medium text-slate-950 disabled:opacity-60"
          >
            {pending ? "Updating…" : "Publish event"}
          </button>
        ) : null}
        {!isFinal ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => runAction("cancel")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-destructive px-4 py-2 text-label text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            Cancel event
          </button>
        ) : null}
      </div>
      {result && !result.success ? (
        <p role="alert" className="text-body-sm text-destructive">
          {result.error.message}
        </p>
      ) : null}
      {result?.success ? (
        <p role="status" className="text-body-sm text-brand-primary">
          Event status updated.
        </p>
      ) : null}
    </div>
  );
}
