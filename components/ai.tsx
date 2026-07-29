import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

// ------------------------------------------------------------
// AIProcessingSteps — AI処理の縦型ステップ表示 (Vercel風・細く洗練)
//   done = 完了(緑チェック) / active = 実行中(紫スピナー) / pending = 未実行(グレー)
// ------------------------------------------------------------
export function AIProcessingSteps({
  steps,
  current,
  running = false,
}: {
  steps: string[];
  /** 完了済みステップ数。current 番目が実行中 (running=true時) */
  current: number;
  running?: boolean;
}) {
  return (
    <ol className="relative">
      {steps.map((label, i) => {
        const done = i < current || (!running && current >= steps.length);
        const active = running && i === current;
        const isLast = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-px ${done ? "bg-emerald-500/40" : "bg-line"}`}
                aria-hidden
              />
            )}
            <span className="relative z-10 mt-0.5 flex h-6 w-6 flex-none items-center justify-center">
              {done ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <Icon name="checkCircle" className="h-4 w-4" strokeWidth={2.2} />
                </span>
              ) : active ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
                </span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
                </span>
              )}
            </span>
            <span
              className={`pt-px leading-6 ${active ? "text-[17px] font-semibold text-ink" : done ? "text-[15px] text-ink-soft" : "text-[15px] text-ink-faint"}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ------------------------------------------------------------
// AIResultSummary — AI処理結果の大きな完了サマリー (§8-1)
// ------------------------------------------------------------
type SummaryStat = { label: string; value: ReactNode; tone?: "default" | "emerald" | "amber" | "brand" };

const STAT_TONE: Record<NonNullable<SummaryStat["tone"]>, string> = {
  default: "text-ink",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  brand: "text-brand-300",
};

export function AIResultSummary({
  title,
  subtitle,
  stats,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  stats: SummaryStat[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-500/25 bg-surface">
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="ai-gradient mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white shadow-glow-sm">
            <Icon name="sparkles" className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-snug tracking-tight text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{subtitle}</p> : null}
          </div>
        </div>
        {stats.length > 0 && (
          <div className="flex flex-none flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</div>
                <div className={`mt-1 text-2xl font-bold tabular-nums ${STAT_TONE[s.tone ?? "default"]}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// ProcessPipeline — 受注処理全体の進捗 (§7-3)
//   受付 → 読み取り → 照合 → 登録 → 完了 の件数と状態
// ------------------------------------------------------------
export type PipelineStage = { key: string; label: string; count: number };

export function ProcessPipeline({ stages }: { stages: PipelineStage[] }) {
  const max = stages[0]?.count || 1;
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {stages.map((s, i) => {
        const isLast = i === stages.length - 1;
        const ratio = Math.round((s.count / max) * 100);
        const complete = isLast && s.count > 0;
        return (
          <div key={s.key} className="flex flex-1 items-stretch gap-2">
            <div className="flex-1 rounded-lg border border-surface-border bg-surface px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-ink-soft">{s.label}</span>
                <span className={`text-xl font-bold tabular-nums ${complete ? "text-emerald-300" : "text-ink"}`}>
                  {s.count}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${complete ? "bg-emerald-400/70" : "bg-brand-500/60"}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
            {!isLast && (
              <span className="flex items-center text-ink-faint" aria-hidden>
                <Icon name="chevronRight" className="h-4 w-4" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
