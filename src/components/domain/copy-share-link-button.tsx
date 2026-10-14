"use client";

import { useState } from "react";

type CopyShareLinkButtonProps = {
  shareUrl: string | null;
};

export function CopyShareLinkButton({
  shareUrl,
}: CopyShareLinkButtonProps) {
  const [message, setMessage] = useState("");

  async function copyShareLink() {
    if (!shareUrl) {
      setMessage("The canonical app URL is not configured.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Share link copied.");
    } catch {
      setMessage("Clipboard access failed. Copy the link shown below instead.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={copyShareLink}
        disabled={!shareUrl}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-label text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Copy share link
      </button>
      {shareUrl ? (
        <p className="break-all text-body-sm text-muted-foreground">
          {shareUrl}
        </p>
      ) : (
        <p className="text-body-sm text-destructive">
          Set APP_BASE_URL to enable share links.
        </p>
      )}
      {message ? (
        <p role="status" className="text-body-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
