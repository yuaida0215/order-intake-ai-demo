"use client";

import { useOrderStore } from "@/lib/store";
import { AgentAvatar } from "./badges";

export function WatchBanner() {
  const watchEnabled = useOrderStore((s) => s.watchEnabled);
  const lastScanAt = useOrderStore((s) => s.lastScanAt);
  const queueLeft = useOrderStore((s) => s.watchQueue.length);
  const toggleWatchMode = useOrderStore((s) => s.toggleWatchMode);

  return (
    <div className="ai-border rounded-2xl">
      <div className="flex flex-wrap items-center gap-4 rounded-[15px] bg-surface px-5 py-4">
        <AgentAvatar size="h-10 w-10" pulse={watchEnabled} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold gradient-text">AI会話監視モニター</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                watchEnabled ? "bg-emerald-50 text-emerald-700" : "bg-surface-sunken text-ink-muted"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${watchEnabled ? "animate-pulse-soft bg-emerald-500" : "bg-gray-400"}`} />
              {watchEnabled ? "監視中" : "停止中"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            Chatwork / Slack / メールの会話を継続的に読み取り、受注らしい会話を自動検知します。
            {lastScanAt ? ` 最終検知チェック ${lastScanAt}` : ""}
            {watchEnabled && queueLeft === 0 ? "（新着なし）" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleWatchMode()}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
            watchEnabled
              ? "border-transparent bg-red-600 text-white hover:bg-red-700"
              : "ai-gradient border-transparent text-white shadow-glow-sm hover:shadow-glow"
          }`}
        >
          {watchEnabled ? "監視を停止" : "自動監視を開始"}
        </button>
      </div>
    </div>
  );
}
