"use client";

import { useOrderStore } from "@/lib/store";
import { formatIsoJp } from "@/lib/business-days";

export function DemoClockControl() {
  const demoDate = useOrderStore((s) => s.demoDate);
  const advanceBusinessDays = useOrderStore((s) => s.advanceBusinessDays);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface-sunken px-4 py-3">
      <span className="text-lg" aria-hidden>🗓</span>
      <span className="text-sm text-ink-soft">
        デモ内時計：<span className="font-mono font-semibold text-ink">{formatIsoJp(demoDate)}</span>
      </span>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => advanceBusinessDays(1)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-surface-sunken"
        >
          ⏩ 1営業日進める
        </button>
        <button
          type="button"
          onClick={() => advanceBusinessDays(3)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-surface-sunken"
        >
          +3営業日
        </button>
      </div>
      <p className="w-full text-[11px] text-ink-faint">
        ※「営業日を進める」と、設定した経過日数を超えた承認依頼に自動でリマインドが送信される様子を確認できます。
      </p>
    </div>
  );
}
