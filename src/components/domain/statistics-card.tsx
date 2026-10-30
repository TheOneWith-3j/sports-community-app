import type { LucideIcon } from "lucide-react";

type StatisticsCardProps = {
  label: string;
  value: number;
  helper: string;
  icon?: LucideIcon;
};

export function StatisticsCard({ label, value, helper, icon: Icon }: StatisticsCardProps) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-sm text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-display-lg text-foreground">{value}</p>
      <p className="mt-1 text-body-sm text-muted-foreground">{helper}</p>
    </div>
  );
}
