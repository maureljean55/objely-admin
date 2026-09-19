const VARIANTS = {
  neutral: "bg-surface-bg text-on-surface-variant",
  primary: "bg-primary/10 text-primary",
  success: "bg-success-container text-success-emerald",
  warning: "bg-warning-container text-warning-amber",
  danger: "bg-danger-container text-danger-crimson",
  tertiary: "bg-tertiary-container text-tertiary",
} as const;

export function Badge({ variant = "neutral", children }: { variant?: keyof typeof VARIANTS; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-semibold ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

export function Dot({ variant = "neutral" }: { variant?: keyof typeof VARIANTS }) {
  const dotColor: Record<keyof typeof VARIANTS, string> = {
    neutral: "bg-slate-400",
    primary: "bg-primary",
    success: "bg-success-emerald",
    warning: "bg-warning-amber",
    danger: "bg-danger-crimson",
    tertiary: "bg-tertiary",
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]}`} />;
}
