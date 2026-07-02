import type { ReactNode } from "react";

type Tone = "default" | "brand" | "amber" | "red" | "emerald";

const TONE: Record<Tone, { value: string; icon: string }> = {
  default: { value: "text-ink", icon: "bg-gray-100 text-gray-600" },
  brand: { value: "text-brand-700", icon: "bg-brand-50 text-brand-600" },
  amber: { value: "text-amber-700", icon: "bg-amber-50 text-amber-600" },
  red: { value: "text-red-700", icon: "bg-red-50 text-red-600" },
  emerald: { value: "text-emerald-700", icon: "bg-emerald-50 text-emerald-600" },
};

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  icon?: string;
}) {
  const t = TONE[tone];
  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon ? (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${t.icon}`} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${t.value}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-ink-muted">{sub}</div> : null}
    </div>
  );
}
