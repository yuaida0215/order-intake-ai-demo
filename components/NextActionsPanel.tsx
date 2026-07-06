"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import type { DemoOrder } from "@/lib/types";
import { Button } from "./ui";

/** 読み取り完了・例外なし案件の「次のアクション」4ボタンパネル (§3-3) */
export function NextActionsPanel({ order }: { order: DemoOrder }) {
  const router = useRouter();
  const createInvoiceMock = useOrderStore((s) => s.createInvoiceMock);
  const requestApproval = useOrderStore((s) => s.requestApproval);

  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [note, setNote] = useState("");
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  const isWaitingApproval = order.status === "waiting_manager_approval";

  return (
    <div className="space-y-3 border-t border-surface-border pt-5">
      <div className="text-xs font-semibold text-ink-muted">次のアクション</div>

      {isWaitingApproval && order.approval ? (
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
          👤 {order.approval.approverName}の確認待ちです（依頼日: {order.approval.requestedOnDemoDate}）。
          <Link href="/approvals" className="ml-1 font-semibold underline hover:no-underline">
            承認状況を見る
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {order.quote ? (
            <Button variant="primary" onClick={() => router.push(`/orders/${order.id}/quote`)}>
              📄 見積書を見る（{order.quote.quoteNo}）
            </Button>
          ) : (
            <Button variant="primary" onClick={() => router.push(`/orders/${order.id}/quote`)}>
              📄 見積書作成
            </Button>
          )}

          {order.status === "auto_input_completed" || order.status === "completed" ? (
            <Button variant="secondary" onClick={() => router.push(`/orders/${order.id}/core-system-input`)}>
              🏢 基幹システムを確認
            </Button>
          ) : (
            <Button variant="primary" onClick={() => router.push(`/orders/${order.id}/core-system-input`)}>
              🏢 基幹システムへ入力
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              createInvoiceMock(order.id);
              setInvoiceCreated(true);
            }}
          >
            🧾 請求書作成
          </Button>

          <Button variant="secondary" onClick={() => setShowApprovalForm((v) => !v)}>
            👤 上長に確認依頼
          </Button>
        </div>
      )}

      {invoiceCreated && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          請求書を作成しました（モック）。対応履歴に記録されています。
        </div>
      )}

      {showApprovalForm && !isWaitingApproval && (
        <div className="space-y-2 rounded-lg border border-surface-border bg-surface-sunken p-4">
          <label className="block text-xs font-semibold text-ink-muted">依頼コメント（任意）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            placeholder="例）金額が大きいため念のため確認をお願いします"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                requestApproval(order.id, "order", note);
                setShowApprovalForm(false);
              }}
            >
              確認依頼を送信
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowApprovalForm(false)}>
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
