"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ConfirmationDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  children: React.ReactNode;
};

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
  children,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    onConfirm();
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          role="presentation"
          onClick={() => {
            if (!pending) setOpen(false);
          }}
        >
          <section
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
            aria-modal="true"
            className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 id="confirmation-dialog-title" className="text-heading-md text-foreground">
                {title}
              </h2>
              <p id="confirmation-dialog-description" className="text-body-md text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Keep my spot
              </Button>
              <Button type="button" disabled={pending} onClick={handleConfirm}>
                {pending ? "Leaving..." : confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
