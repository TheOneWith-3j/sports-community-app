export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div aria-label={label} aria-live="polite" className="space-y-4" role="status">
      <span className="sr-only">{label}...</span>
      <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
