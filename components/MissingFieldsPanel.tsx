"use client";

import { useState } from "react";
import { Button } from "./ui";
import { buildCustomerInquiryDraft, customerInquiryDraftVariantCount } from "@/lib/core";

/**
 * 見積書・請求書の不足項目バナー。
 * この画面で直接編集するか、AIがドラフトした確認依頼メッセージを編集して顧客へ送信できる (モック)。
 */
export function MissingFieldsPanel({
  missingFields,
  documentLabel,
  customerName,
  customerContactName,
  onSendInquiry,
}: {
  missingFields: string[];
  documentLabel: "見積書" | "請求書";
  customerName: string | null;
  customerContactName: string | null;
  onSendInquiry: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [sent, setSent] = useState(false);

  if (missingFields.length === 0) return null;

  function openForm() {
    const draft = buildCustomerInquiryDraft({ customerName, customerContactName, documentLabel, missingFields }, 0);
    setMessage(draft);
    setVariantIndex(0);
    setOpen(true);
  }

  function regenerate() {
    const next = variantIndex + 1;
    setVariantIndex(next);
    setMessage(buildCustomerInquiryDraft({ customerName, customerContactName, documentLabel, missingFields }, next));
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">⚠️ 不足項目があります</p>
        <p className="mt-0.5 text-xs text-amber-700">{missingFields.join("・")}</p>
        <p className="mt-1 text-xs text-amber-700">
          左のプレビュー内で直接入力するか、下のボタンから顧客に確認を依頼できます。
        </p>
      </div>

      {!open ? (
        <Button variant="secondary" size="sm" onClick={openForm} disabled={sent}>
          {sent ? "確認依頼を送信済み" : "📨 顧客に確認を依頼"}
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-surface-border bg-white p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">AIが作成した確認依頼メッセージ（編集できます）</label>
            {customerInquiryDraftVariantCount() > 1 && (
              <button type="button" onClick={regenerate} className="text-xs font-medium text-brand-600 hover:underline">
                ✨ 文面を再生成
              </button>
            )}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-md border border-surface-border bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onSendInquiry(message);
                setOpen(false);
                setSent(true);
              }}
            >
              送信する（モック）
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
