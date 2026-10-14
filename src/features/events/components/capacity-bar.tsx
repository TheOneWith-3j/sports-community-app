type CapacityBarProps = {
  capacity: number;
  confirmedCount: number;
};

export function CapacityBar({
  capacity,
  confirmedCount,
}: CapacityBarProps) {
  const progress = Math.min(confirmedCount, capacity);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-heading-md text-foreground">Event capacity</h2>
        <p className="text-body-sm text-muted-foreground">
          {confirmedCount} of {capacity} spots filled
        </p>
      </div>
      <progress
        className="h-3 w-full overflow-hidden rounded-full accent-brand-primary"
        value={progress}
        max={capacity}
        aria-label={`${confirmedCount} of ${capacity} event spots filled`}
      />
    </div>
  );
}
