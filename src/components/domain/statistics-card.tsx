type StatisticsCardProps = {
  label: string;
  value: number;
  helper: string;
};

export function StatisticsCard({ label, value, helper }: StatisticsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-body-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-display-lg text-foreground">{value}</p>
      <p className="mt-1 text-body-sm text-muted-foreground">{helper}</p>
    </div>
  );
}
