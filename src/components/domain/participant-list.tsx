"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { removeParticipant } from "@/features/participants/actions";
import type { ConfirmedParticipant } from "@/features/participants/queries";

type ParticipantListProps = {
  participants: ConfirmedParticipant[];
  currentProfileId?: string;
  adminActions?: boolean;
};

export function ParticipantList({
  participants,
  currentProfileId,
  adminActions = false,
}: ParticipantListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(participantId: string) {
    setPendingId(participantId);
    setError(null);
    startTransition(async () => {
      const result = await removeParticipant({ participantId });
      setPendingId(null);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section aria-label="Confirmed participants" className="space-y-4">
      <h3 className="text-heading-md text-foreground">Participants</h3>
      {participants.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">No confirmed participants yet.</p>
      ) : (
        <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
          {participants.map((participant, index) => (
            <li key={participant.id} className="flex items-center gap-3 p-4">
              <span className="w-6 text-label text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md text-foreground">
                  {participant.displayName}
                  {participant.profileId === currentProfileId ? (
                    <span className="ml-2 text-body-sm text-muted-foreground">(You)</span>
                  ) : null}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  Joined {new Date(participant.joinedAt).toLocaleDateString()}
                </p>
              </div>
              {adminActions ? (
                <ConfirmationDialog
                  title="Remove participant?"
                  description="Their confirmed spot will be released and the first waitlisted person will be promoted."
                  confirmLabel="Remove"
                  pending={pendingId === participant.id}
                  onConfirm={() => handleRemove(participant.id)}
                >
                  <Button type="button" variant="secondary" disabled={pendingId !== null}>
                    Remove
                  </Button>
                </ConfirmationDialog>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {error ? <p role="alert" className="text-body-sm text-destructive">{error}</p> : null}
    </section>
  );
}
