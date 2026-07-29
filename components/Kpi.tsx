import type { ReactNode } from "react";

type Tone = "default" | "brand" | "amber" | "red" | "emerald" | "info";

const TONE: Record<Tone, { value: string; icon: string }> = {
  default: { value: "text-ink", icon: "bg-white/[0.05] text-ink-muted" },
  brand: { value: "text-ink", icon: "bg-brand-500/12 text-brand-300" },
  amber: { value: "text-ink", icon: "bg-amber-500/12 text-amber-300" },
  red: { value: "text-ink", icon: "bg-rose-500/12 text-rose-300" },
  emerald: { value: "text-ink", icon: "bg-emerald-500/12 text-emerald-300" },
  info: { value: "text-ink", icon: "bg-info-500/12 text-info-300" },
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
  icon?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5 transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-muted">{label}</span>
        {icon ? (
          <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${t.icon}`} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <div className={`mt-3 text-[30px] font-bold leading-none tracking-tight tabular-nums ${t.value}`}>
        {value}
      </div>
      {sub ? <div className="mt-2 text-xs text-ink-muted">{sub}</div> : null}
    </div>
  );
}
