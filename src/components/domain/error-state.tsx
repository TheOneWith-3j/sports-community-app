import { AlertCircle } from "lucide-react";

export function ErrorState({
  message = "Something went wrong. Please try again.",
}: {
  message?: string;
}) {
  return (
    <div
      aria-live="assertive"
      className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mb-3 size-5" />
      <p className="text-body-md">{message}</p>
    </div>
  );
}
