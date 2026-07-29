import type { DemoOrder } from "@/lib/types";
import { yen } from "@/lib/format";
import { Icon } from "@/components/icons";

const TARGET_LABEL: Record<string, string> = {
  quote: "見積書",
  order: "受注内容",
  po: "発注書",
  invoice: "請求書",
};

/** 左カラムの受信トレイ風リストアイテム (§10) */
export function ApprovalCard({
  order,
  elapsed,
  overdue,
  selected,
  onSelect,
}: {
  order: DemoOrder;
  elapsed: number;
  overdue: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const approval = order.approval!;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[72px] w-full flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-brand-500/40 bg-white/[0.04]"
          : "border-surface-border hover:border-line-strong hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-ink">
          {order.customerName ?? "取引先不明"}
        </span>
        <span className="flex-none tabular-nums text-sm font-semibold text-ink-soft">
          {yen(order.totalAmount)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>{TARGET_LABEL[approval.target]}の承認</span>
        <span aria-hidden>・</span>
        <span>依頼 {approval.requestedOnDemoDate}</span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300">
          <Icon name="sparkles" className="h-3 w-3" strokeWidth={2} />
          AI判定：問題なし
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            overdue ? "bg-amber-500/10 text-amber-300" : "bg-white/[0.05] text-ink-muted"
          }`}
        >
          {overdue ? <Icon name="alertTriangle" className="h-3 w-3" strokeWidth={2} /> : null}
          経過 {elapsed}営業日
        </span>
      </div>
    </button>
  );
}
