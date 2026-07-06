"use client";

import { useState } from "react";
import type { OrderAlert } from "@/lib/types";
import { Button } from "./ui";
import { AgentAvatar, AlertClassificationBadge, ChannelBadge } from "./badges";
import { ConversationPreview } from "./ConversationPreview";
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
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
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
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={onAccept}>
            内容を確認する →
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onArchive("発注書ではないと判断されました")}>
            この書類は発注書ではない
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <AgentAvatar size="h-7 w-7" className="text-sm" />
        <ChannelBadge channel={alert.channel} />
        <span className="text-sm font-semibold text-ink">{alert.suggestedCustomerName ?? "取引先不明"}</span>
        <AlertClassificationBadge classification={alert.aiClassification} />
        <span className="text-[11px] text-ink-muted">信頼度 {confidencePct(alert.aiConfidence)}</span>
        <span className="ml-auto text-[11px] text-ink-muted">{alert.detectedAt.slice(0, 16).replace("T", " ")}</span>
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        <span className="font-medium text-ink-soft">判定理由：</span>
        {alert.aiReason}
      </p>

      <div className="mt-3">
        <ConversationPreview messages={alert.thread.messages} compact />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-border pt-3">
        <Button variant="primary" size="sm" onClick={onAccept}>
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
  );
}
