"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOrderStore } from "@/lib/store";
import {
  QUOTE_GENERATE_STEPS,
  DEFAULT_APPROVER_NAME,
  approvalDraftVariantCount,
  buildApprovalDraftMessage,
} from "@/lib/core";
import { yen } from "@/lib/format";
import { Button, Card, LinkButton, SectionTitle } from "@/components/ui";
import { AgentAvatar } from "@/components/badges";
import { QuoteSheet } from "@/components/QuoteSheet";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function QuotePage({ params }: { params: { id: string } }) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));
  const generateQuote = useOrderStore((s) => s.generateQuote);
  const updateQuoteField = useOrderStore((s) => s.updateQuoteField);
  const updateQuoteItem = useOrderStore((s) => s.updateQuoteItem);
  const sendQuote = useOrderStore((s) => s.sendQuote);
  const requestApproval = useOrderStore((s) => s.requestApproval);

  const [stepIndex, setStepIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [note, setNote] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !order || order.quote) return;
    startedRef.current = true;
    (async () => {
      setGenerating(true);
      for (let i = 0; i < QUOTE_GENERATE_STEPS.length; i++) {
        setStepIndex(i);
        await sleep(550);
      }
      setStepIndex(QUOTE_GENERATE_STEPS.length);
      generateQuote(order.id);
      setGenerating(false);
    })();
  }, [order, generateQuote]);

  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="text-lg font-bold text-ink">受注が見つかりません</div>
            <LinkButton href="/orders" variant="primary">
              受注一覧へ
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const quote = order.quote;
  const isDraft = quote?.status === "draft";
  const isSent = quote?.status === "sent_mock";
  const isApprovalRequested = quote?.status === "approval_requested";

  function draftMessage(idx: number): string {
    return buildApprovalDraftMessage(
      "quote",
      {
        approverName: DEFAULT_APPROVER_NAME,
        customerName: order!.customerName,
        summary: quote ? `見積 ${quote.quoteNo}` : "見積書",
        amountText: yen(quote?.total ?? null),
      },
      idx,
    );
  }

  function openApprovalForm() {
    setNote(draftMessage(0));
    setVariantIndex(0);
    setShowApprovalForm(true);
  }

  function regenerateDraft() {
    const nextIndex = variantIndex + 1;
    setVariantIndex(nextIndex);
    setNote(draftMessage(nextIndex));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/orders/${order.id}/read`} className="text-sm text-ink-muted hover:text-ink">
          ← 読み取り結果に戻る
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">見積書作成</h1>
        <p className="mt-1 text-sm text-ink-muted">
          AIが受注内容から見積書を自動生成します。内容は送付前に編集できます。
          <span className="ml-1 font-mono text-ink-faint">{order.id}</span>
        </p>
      </div>

      {!quote ? (
        <Card>
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <AgentAvatar size="h-12 w-12" pulse className="text-xl" />
            <p className="text-sm text-ink-muted">AI Agentが見積書を生成しています…</p>
            <ol className="space-y-2 text-left">
              {QUOTE_GENERATE_STEPS.map((label, i) => {
                const done = i < stepIndex;
                const active = generating && i === stepIndex;
                return (
                  <li key={label} className="flex items-center gap-2.5 text-sm">
                    {done ? (
                      <span className="ai-gradient flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white">✓</span>
                    ) : active ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-surface-border" />
                    )}
                    <span className={done ? "text-ink-soft" : active ? "font-medium text-ink" : "text-ink-faint"}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <QuoteSheet
              quote={quote}
              editable={isDraft}
              onUpdateField={(patch) => updateQuoteField(order.id, patch)}
              onUpdateItem={(lineNo, patch) => updateQuoteItem(order.id, lineNo, patch)}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <SectionTitle sub="見積書のステータスと操作">操作パネル</SectionTitle>

              {isSent && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  ✓ 先方に送付済みです（{quote.sentAt}・モック）
                </div>
              )}
              {isApprovalRequested && (
                <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm text-purple-800">
                  👤 上長の確認待ちです。
                  <Link href="/approvals" className="ml-1 font-semibold underline hover:no-underline">
                    承認状況を見る
                  </Link>
                </div>
              )}

              {isDraft && (
                <div className="mt-3 space-y-2">
                  <Button variant="primary" className="w-full" onClick={() => sendQuote(order.id)}>
                    📤 先方に送付
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => (showApprovalForm ? setShowApprovalForm(false) : openApprovalForm())}
                  >
                    👤 上長に確認依頼
                  </Button>
                </div>
              )}

              {showApprovalForm && isDraft && (
                <div className="mt-3 space-y-2 rounded-lg border border-surface-border bg-surface-sunken p-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ink-muted">AIが作成した依頼メッセージ</label>
                    {approvalDraftVariantCount("quote") > 1 && (
                      <button
                        type="button"
                        onClick={regenerateDraft}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        ✨ 再生成
                      </button>
                    )}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="w-full resize-y rounded-md border border-surface-border bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        requestApproval(order.id, "quote", note);
                        setShowApprovalForm(false);
                      }}
                    >
                      確認依頼を送信
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowApprovalForm(false)}>
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <LinkButton href={`/orders/${order.id}/read`} variant="secondary" className="w-full">
              読み取り結果に戻る
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
