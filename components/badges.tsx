import {
  ASSIGNEE_LABEL,
  ASSIGNEE_STYLE,
  CATEGORY_LABEL,
  CHANNEL_ICON,
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  confidencePct,
  orderCategory,
} from "@/lib/format";
import type { AlertClassification, AssigneeType, ExceptionType, OrderChannel, OrderStatus } from "@/lib/types";
import { Icon } from "@/components/icons";

const chipBase =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-medium whitespace-nowrap";

export function StatusBadge({ status, animated }: { status: OrderStatus; animated?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`${chipBase} ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === "ai_reading" || animated ? "animate-pulse-soft" : ""}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function AssigneeBadge({ assignee }: { assignee: AssigneeType }) {
  return <span className={`${chipBase} ${ASSIGNEE_STYLE[assignee]}`}>{ASSIGNEE_LABEL[assignee]}</span>;
}

export function ChannelBadge({ channel }: { channel: OrderChannel }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft whitespace-nowrap">
      <span aria-hidden>{CHANNEL_ICON[channel]}</span>
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

const CATEGORY_STYLE: Record<string, string> = {
  normal: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
  A: "bg-rose-500/12 text-rose-300 border-rose-500/30",
  B: "bg-amber-500/12 text-amber-300 border-amber-500/30",
  C: "bg-rose-500/12 text-rose-300 border-rose-500/30",
  D: "bg-amber-500/12 text-amber-300 border-amber-500/30",
};

export function CategoryBadge({ exceptionType }: { exceptionType: ExceptionType }) {
  const cat = orderCategory({ exceptionType });
  return <span className={`${chipBase} ${CATEGORY_STYLE[cat]}`}>{CATEGORY_LABEL[cat]}</span>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  // §8-4: 95%以上=成功 / 85-94%=注意 / 84%以下=要確認 (グラデは使わない)
  const color =
    score >= 0.95
      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/30"
      : score >= 0.85
        ? "bg-amber-500/12 text-amber-300 border-amber-500/30"
        : "bg-rose-500/12 text-rose-300 border-rose-500/30";
  return (
    <span className={`${chipBase} ${color}`}>
      全体信頼度 {confidencePct(score)}
    </span>
  );
}

/** 項目単位の信頼度 (§8-4)。低信頼度のみ強調し、高信頼度は控えめに */
export function FieldConfidence({ score }: { score: number }) {
  const pct = confidencePct(score);
  if (score >= 0.95) {
    return <span className="text-[11px] tabular-nums text-ink-faint">{pct}</span>;
  }
  if (score >= 0.85) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-amber-300">
        {pct}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/12 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-rose-300">
      {pct} 要確認
    </span>
  );
}

export function AlertClassificationBadge({ classification }: { classification: AlertClassification }) {
  if (classification === "confirmed_order") {
    return (
      <span className={`${chipBase} border-rose-500/30 bg-rose-500/12 text-rose-300`}>
        🔴 受注確定発言あり
      </span>
    );
  }
  return (
    <span className={`${chipBase} border-amber-500/30 bg-amber-500/12 text-amber-300`}>
      🟡 受注の可能性あり
    </span>
  );
}

/** AIエージェントのアバター (コバルトグラデーション+グロー)。size は tailwind の h/w クラス */
export function AgentAvatar({ size = "h-9 w-9", pulse = false, className = "" }: { size?: string; pulse?: boolean; className?: string }) {
  return (
    <span
      className={`ai-gradient inline-flex items-center justify-center rounded-xl text-white shadow-glow-sm ${pulse ? "animate-glow-pulse" : ""} ${size} ${className}`}
      aria-hidden
    >
      <Icon name="sparkles" className="h-1/2 w-1/2" strokeWidth={2} />
    </span>
  );
}
