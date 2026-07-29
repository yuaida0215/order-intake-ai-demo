"use client";

import { useState } from "react";
import type { OrderAlert } from "@/lib/types";
import { Button } from "./ui";
import { AgentAvatar, AlertClassificationBadge, ChannelBadge } from "./badges";
import { ConversationPreview } from "./ConversationPreview";
import { Icon } from "@/components/icons";
import { confidencePct } from "@/lib/format";

export function AlertCard({
  alert,
  onAccept,
  onArchive,
}: {
  alert: OrderAlert;
  onAccept: () => void;
  onArchive: (reason?: string) => void;
}) {
  const [archiving, setArchiving] = useState(false);

  if (alert.kind === "purchase_order_received") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 to-amber-500" aria-hidden />
        <div className="p-5 pl-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>📄</span>
            <span className="text-sm font-semibold text-ink">
              発注書が届きました — {alert.suggestedCustomerName}
            </span>
            <span className="ml-auto text-[11px] text-ink-muted">{alert.detectedAt.slice(0, 16).replace("T", " ")}</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            発注書 {alert.poDocument?.poNo} を受信しました。内容を確認し、基幹システムへの転記へ進んでください。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ai" size="sm" onClick={onAccept}>
              内容を確認する →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onArchive("発注書ではないと判断されました")}>
              この書類は発注書ではない
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const confirmed = alert.aiClassification === "confirmed_order";
  const accentBar = confirmed
    ? "bg-gradient-to-b from-brand-400 to-brand-600"
    : "bg-gradient-to-b from-amber-300 to-amber-500";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-pop transition-colors hover:border-line-strong">
      {/* 分類別の左アクセントバー (カードの区切りを明確化) */}
      <span className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${accentBar}`} aria-hidden />

      <div className="p-5 pl-6">
        {/* ヘッダー */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line pb-3.5">
          <AgentAvatar size="h-7 w-7" className="text-sm" />
          <ChannelBadge channel={alert.channel} />
          <span className="text-sm font-semibold text-ink">{alert.suggestedCustomerName ?? "取引先不明"}</span>
          <AlertClassificationBadge classification={alert.aiClassification} />
          <span className="text-[11px] text-ink-muted">信頼度 {confidencePct(alert.aiConfidence)}</span>
          <span className="ml-auto text-[11px] tabular-nums text-ink-muted">{alert.detectedAt.slice(0, 16).replace("T", " ")}</span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink-soft">判定理由：</span>
          {alert.aiReason}
        </p>

        {/* 会話ログ (専用の入れ子パネルに収めて1件のまとまりを明確化) */}
        <div className="mt-3 rounded-xl border border-line bg-surface-sunken p-3">
          {alert.detectedMessageIds && alert.detectedMessageIds.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-amber-700">
              <Icon name="sparkles" className="h-3 w-3" strokeWidth={2} />
              黄色部分がAIが「受注意思」と検出した発言です
            </div>
          )}
          <ConversationPreview
            messages={alert.thread.messages}
            highlightMessageIds={alert.detectedMessageIds}
            compact
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="ai" size="sm" onClick={onAccept}>
            🤖 AIで読み取る
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setArchiving(true)} disabled={archiving}>
            この会話はまだ受注ではない
          </Button>
        </div>

        {archiving && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-surface-border bg-surface-sunken px-3 py-2">
            <span className="text-xs text-ink-muted">アーカイブします。よろしいですか？</span>
            <Button size="sm" variant="secondary" onClick={() => onArchive()}>
              アーカイブする
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setArchiving(false)}>
              キャンセル
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
