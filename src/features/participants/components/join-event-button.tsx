"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  joinEvent,
  type JoinResult,
} from "@/features/participants/actions";
import type { UserParticipation } from "@/features/participants/queries";
import type { ActionResult } from "@/types/actions";

type JoinEventButtonProps = {
  eventId: string;
  shareSlug: string;
  isAuthenticated: boolean;
  onboardingRequired: boolean;
  participation: UserParticipation | null;
  participationError?: boolean;
};

function participationMessage(
  participation: Pick<JoinResult, "status" | "waitlistPosition">,
): string {
  if (participation.status === "confirmed") {
    return "You're confirmed for this event.";
  }
  return typeof participation.waitlistPosition === "number"
    ? `You're on the waitlist at position ${participation.waitlistPosition}.`
    : "You're on the waitlist.";
}

export function JoinEventButton({
  eventId,
  shareSlug,
  isAuthenticated,
  onboardingRequired,
  participation,
  participationError = false,
}: JoinEventButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<JoinResult> | null>(null);

  function handleJoin() {
    setResult(null);
    startTransition(async () => {
      const actionResult = await joinEvent({ eventId });
      setResult(actionResult);
      if (actionResult.success) {
        router.refresh();
      }
    });
  }

  if (participation) {
    return (
      <p role="status" className="text-body-md text-foreground">
        {participationMessage({
          status: participation.status,
          waitlistPosition: participation.waitlist_position,
        })}
      </p>
    );
  }

  if (result?.success) {
    return (
      <p role="status" className="text-body-md text-foreground">
        {participationMessage(result.data)}
      </p>
    );
  }

  if (participationError) {
    return (
      <p role="alert" className="text-body-sm text-destructive">
        Your event participation could not be checked. Please refresh and try again.
      </p>
    );
  }

  if (onboardingRequired) {
    const returnTo = `/e/${shareSlug}`;
    return (
      <div className="space-y-2">
        <a
          href={`/onboarding?returnTo=${encodeURIComponent(returnTo)}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-3 text-label font-medium text-slate-950 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Complete profile to join
        </a>
        <p className="text-body-sm text-muted-foreground">
          Choose your community display name before joining.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `/e/${shareSlug}`;
    return (
      <div className="space-y-2">
        <a
          href={`/login?next=${encodeURIComponent(returnTo)}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-4 py-3 text-label font-medium text-slate-950 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Sign in to join
        </a>
        <p className="text-body-sm text-muted-foreground">
          Sign in to take part in this event.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={handleJoin}
        className="w-full sm:w-auto"
      >
        {pending ? "Joining..." : "Join event"}
      </Button>
      {result && !result.success ? (
        <p role="alert" className="text-body-sm text-destructive">
          {result.error.message}
        </p>
      ) : null}
    </div>
  );
}
