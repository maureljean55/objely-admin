export function StatCard({
  label,
  value,
  icon,
  iconColorClass = "text-primary",
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  iconColorClass?: string;
  trend?: { label: string; positive?: boolean };
}) {
  return (
    <div className="bg-surface-card p-5 rounded-xl shadow-card hover:shadow-elevated transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className={`p-2 rounded-lg bg-surface-bg ${iconColorClass}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>
      <div className="mt-4">
        <div className="text-metric-number text-on-surface">{value}</div>
        {trend && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`inline-flex items-center text-label-sm font-semibold ${trend.positive ? "text-success-emerald" : "text-on-surface-variant"}`}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
