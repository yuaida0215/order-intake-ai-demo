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

const chipBase =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

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
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  A: "bg-red-50 text-red-700 border-red-200",
  B: "bg-amber-50 text-amber-700 border-amber-200",
  C: "bg-red-50 text-red-700 border-red-200",
  D: "bg-amber-50 text-amber-700 border-amber-200",
};

export function CategoryBadge({ exceptionType }: { exceptionType: ExceptionType }) {
  const cat = orderCategory({ exceptionType });
  return <span className={`${chipBase} ${CATEGORY_STYLE[cat]}`}>{CATEGORY_LABEL[cat]}</span>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  // 高信頼度はエージェントの紫グラデーションで誇らしげに
  if (score >= 0.85) {
    return (
      <span className={`${chipBase} ai-gradient border-transparent text-white shadow-glow-sm`}>
        ✨ 信頼度 {confidencePct(score)}
      </span>
    );
  }
  const color =
    score >= 0.5
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return <span className={`${chipBase} ${color}`}>信頼度 {confidencePct(score)}</span>;
}

export function AlertClassificationBadge({ classification }: { classification: AlertClassification }) {
  if (classification === "confirmed_order") {
    return (
      <span className={`${chipBase} border-red-200 bg-red-50 text-red-700`}>
        🔴 受注確定発言あり
      </span>
    );
  }
  return (
    <span className={`${chipBase} border-amber-200 bg-amber-50 text-amber-700`}>
      🟡 受注の可能性あり
    </span>
  );
}

/** AIエージェントのアバター (グラデーション+グロー)。size は tailwind の h/w クラス */
export function AgentAvatar({ size = "h-9 w-9", pulse = false, className = "" }: { size?: string; pulse?: boolean; className?: string }) {
  return (
    <span
      className={`ai-gradient inline-flex items-center justify-center rounded-xl text-white shadow-glow-sm ${pulse ? "animate-glow-pulse" : ""} ${size} ${className}`}
      aria-hidden
    >
      🤖
    </span>
  );
}
