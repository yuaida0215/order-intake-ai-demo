"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import type { DemoOrder } from "@/lib/types";
import { Button } from "./ui";
import { Icon } from "@/components/icons";
import {
  DEFAULT_APPROVER_NAME,
  approvalDraftVariantCount,
  buildApprovalDraftMessage,
  orderItemSummary,
} from "@/lib/core";
import { yen } from "@/lib/format";

/** 読み取り完了・例外なし案件の「次のアクション」4ボタンパネル (§3-3) */
export function NextActionsPanel({ order }: { order: DemoOrder }) {
  const router = useRouter();
  const requestApproval = useOrderStore((s) => s.requestApproval);

  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [note, setNote] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);

  const isWaitingApproval = order.status === "waiting_manager_approval";

  function openApprovalForm() {
    const draft = buildApprovalDraftMessage("order", {
      approverName: DEFAULT_APPROVER_NAME,
      customerName: order.customerName,
      summary: orderItemSummary(order),
      amountText: yen(order.totalAmount),
    });
    setNote(draft);
    setVariantIndex(0);
    setShowApprovalForm(true);
  }

  function regenerateDraft() {
    const nextIndex = variantIndex + 1;
    setVariantIndex(nextIndex);
    setNote(
      buildApprovalDraftMessage(
        "order",
        {
          approverName: DEFAULT_APPROVER_NAME,
          customerName: order.customerName,
          summary: orderItemSummary(order),
          amountText: yen(order.totalAmount),
        },
        nextIndex,
      ),
    );
  }

  return (
    <div className="space-y-3 border-t border-surface-border pt-5">
      <div className="text-xs font-semibold text-ink-muted">次のアクション</div>

      {isWaitingApproval && order.approval ? (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          👤 {order.approval.approverName}の確認待ちです（依頼日: {order.approval.requestedOnDemoDate}）。
          <Link href="/approvals" className="ml-1 font-semibold underline hover:no-underline">
            承認状況を見る
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 最重要CTA: 基幹システムへ登録 (グラデ) */}
          {order.status === "auto_input_completed" || order.status === "completed" ? (
            <Button variant="secondary" className="w-full" onClick={() => router.push(`/orders/${order.id}/core-system-input`)}>
              <Icon name="checkCircle" className="h-4 w-4" /> 基幹システムの登録内容を確認
            </Button>
          ) : (
            <div>
              <Button variant="ai" size="lg" className="w-full" onClick={() => router.push(`/orders/${order.id}/core-system-input`)}>
                <Icon name="layers" className="h-[18px] w-[18px]" /> 基幹システムへ登録
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-ink-muted">読み取り内容は確認済み — 確認なしで登録できます</p>
            </div>
          )}

          {/* 補助アクション */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => router.push(`/orders/${order.id}/quote`)}>
              <Icon name="fileText" className="h-4 w-4" />
              {order.quote ? "見積書を見る" : "見積書作成"}
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/orders/${order.id}/invoice`)}>
              <Icon name="yen" className="h-4 w-4" />
              {order.invoice ? "請求書を見る" : "請求書作成"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => (showApprovalForm ? setShowApprovalForm(false) : openApprovalForm())}
            >
              <Icon name="userCheck" className="h-4 w-4" /> 上長に確認依頼
            </Button>
          </div>
        </div>
      )}

      {showApprovalForm && !isWaitingApproval && (
        <div className="space-y-2 rounded-lg border border-surface-border bg-surface-sunken p-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-ink-muted">AIが作成した依頼メッセージ（編集できます）</label>
            {approvalDraftVariantCount("order") > 1 && (
              <button
                type="button"
                onClick={regenerateDraft}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                ✨ 文面を再生成
              </button>
            )}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-surface-border bg-surface px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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
