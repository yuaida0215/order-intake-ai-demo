"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOrderStore } from "@/lib/store";
import {
  INVOICE_GENERATE_STEPS,
  DEFAULT_APPROVER_NAME,
  approvalDraftVariantCount,
  buildApprovalDraftMessage,
  detectInvoiceMissingFields,
} from "@/lib/core";
import { formatDate, yen } from "@/lib/format";
import { Button, Card, Field, LinkButton, PageHeader, SectionTitle } from "@/components/ui";
import { AgentAvatar, StatusBadge } from "@/components/badges";
import { AIProcessingSteps } from "@/components/ai";
import { Icon } from "@/components/icons";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { MissingFieldsPanel } from "@/components/MissingFieldsPanel";
import { ISSUER } from "@/lib/issuer";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 右パネル用の小さなステータスピル */
function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: "brand" | "emerald" | "amber" | "info" | "rose" | "muted";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    brand: "border-brand-200 bg-brand-50 text-brand-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-brand-200 bg-brand-50 text-brand-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    muted: "border-line bg-surface-sunken text-ink-muted",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-medium ${styles[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));
  const generateInvoice = useOrderStore((s) => s.generateInvoice);
  const updateInvoiceField = useOrderStore((s) => s.updateInvoiceField);
  const updateInvoiceItem = useOrderStore((s) => s.updateInvoiceItem);
  const sendInvoice = useOrderStore((s) => s.sendInvoice);
  const requestApproval = useOrderStore((s) => s.requestApproval);
  const addLog = useOrderStore((s) => s.addLog);

  const [stepIndex, setStepIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [note, setNote] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !order || order.invoice) return;
    startedRef.current = true;
    (async () => {
      setGenerating(true);
      for (let i = 0; i < INVOICE_GENERATE_STEPS.length; i++) {
        setStepIndex(i);
        await sleep(550);
      }
      setStepIndex(INVOICE_GENERATE_STEPS.length);
      generateInvoice(order.id);
      setGenerating(false);
    })();
  }, [order, generateInvoice]);

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

  const invoice = order.invoice;
  const isDraft = invoice?.status === "draft";
  const isSent = invoice?.status === "sent_mock";
  const isApprovalRequested = invoice?.status === "approval_requested";
  const missingFields = invoice ? detectInvoiceMissingFields(invoice) : [];
  const approval = order.approval;

  function draftMessage(idx: number): string {
    return buildApprovalDraftMessage(
      "invoice",
      {
        approverName: DEFAULT_APPROVER_NAME,
        customerName: order!.customerName,
        summary: invoice ? `請求書 ${invoice.invoiceNo}` : "請求書",
        amountText: yen(invoice?.total ?? null),
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

  function saveDraft() {
    if (!invoice) return;
    addLog(order!.id, "internal_user", "invoice_draft_saved", `請求書 ${invoice.invoiceNo} を下書き保存しました。`);
    setSavedAt(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
  }

  const sendToEmail = order.customerContactAddress || "keiri@example-torihiki.co.jp";

  return (
    <div className="space-y-6">
      <PageHeader
        title="請求書作成"
        description="AIが受注内容から請求書を自動生成しました。内容を確認し、送付前に編集できます。"
        backHref={`/orders/${order.id}/read`}
        backLabel="読み取り結果に戻る"
        meta={
          <>
            <span className="font-mono text-[13px] text-ink-faint">{order.id}</span>
            <StatusBadge status={order.status} />
          </>
        }
      />

      {!invoice ? (
        <Card>
          <div className="mx-auto flex max-w-md flex-col gap-5 py-6">
            <div className="flex items-center gap-3.5">
              <AgentAvatar size="h-11 w-11" pulse className="text-xl" />
              <div>
                <div className="text-base font-semibold text-ink">AI Agentが請求書を生成しています</div>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  受注内容から請求項目・消費税・振込先を組み立てています…
                </p>
              </div>
            </div>
            <AIProcessingSteps steps={INVOICE_GENERATE_STEPS} current={stepIndex} running={generating} />
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          {/* LEFT / CENTER: 白い請求書 */}
          <div className="min-w-0 flex-1 space-y-4">
            {isDraft && (
              <MissingFieldsPanel
                missingFields={missingFields}
                documentLabel="請求書"
                customerName={invoice.customerName}
                customerContactName={order.customerContactName}
                onSendInquiry={(message) =>
                  addLog(order.id, "internal_user", "customer_inquiry", `請求書の不足項目について顧客へ確認を依頼しました: ${message.slice(0, 40)}…`)
                }
              />
            )}
            <InvoiceSheet
              invoice={invoice}
              editable={isDraft}
              onUpdateField={(patch) => updateInvoiceField(order.id, patch)}
              onUpdateItem={(lineNo, patch) => updateInvoiceItem(order.id, lineNo, patch)}
            />
          </div>

          {/* RIGHT: 340px パネル */}
          <div className="w-full flex-none space-y-4 xl:sticky xl:top-6 xl:w-[340px]">
            {/* ステータス */}
            <Card>
              <SectionTitle sub="請求書の状態">ステータス</SectionTitle>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="brand" icon={<Icon name="sparkles" className="h-3.5 w-3.5" strokeWidth={2} />}>
                  AI作成済み
                </StatusPill>
                {isSent ? (
                  <StatusPill tone="emerald" icon={<Icon name="checkCircle" className="h-3.5 w-3.5" />}>
                    送付済み
                  </StatusPill>
                ) : (
                  <StatusPill tone="amber" icon={<Icon name="clock" className="h-3.5 w-3.5" />}>
                    未送付
                  </StatusPill>
                )}
                {approval?.status === "approved" ? (
                  <StatusPill tone="emerald" icon={<Icon name="userCheck" className="h-3.5 w-3.5" />}>
                    承認済み
                  </StatusPill>
                ) : approval?.status === "remanded" ? (
                  <StatusPill tone="rose" icon={<Icon name="alertTriangle" className="h-3.5 w-3.5" />}>
                    差し戻し
                  </StatusPill>
                ) : isApprovalRequested || approval?.status === "waiting" ? (
                  <StatusPill tone="info" icon={<Icon name="userCheck" className="h-3.5 w-3.5" />}>
                    上長確認中
                  </StatusPill>
                ) : (
                  <StatusPill tone="muted">承認不要</StatusPill>
                )}
              </div>
            </Card>

            {/* AI確認結果 */}
            <Card>
              <SectionTitle sub="AIが送付前に自動チェックしました">AI確認結果</SectionTitle>
              <ul className="space-y-2.5">
                {["金額一致", "税率一致", "振込先確認済み", "送付先確認済み"].map((label) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-ink-soft">
                    <Icon name="checkCircle" className="h-4 w-4 flex-none text-emerald-600" strokeWidth={2} />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>

            {/* 送付情報 */}
            <Card>
              <SectionTitle sub="送付内容のプレビュー">送付情報</SectionTitle>
              <div className="space-y-3">
                <Field label="送付先メール">{sendToEmail}</Field>
                <Field label="件名">請求書送付のご案内（{invoice.invoiceNo}）</Field>
                <Field label="添付ファイル">{invoice.invoiceNo}.pdf</Field>
                <Field label="差出人">{ISSUER.companyName}</Field>
                <Field label="送付予定">{isSent ? `送付済み（${invoice.sentAt ?? "モック"}）` : "承認後すぐに送付"}</Field>
              </div>
            </Card>

            {/* 承認情報 */}
            {approval && (
              <Card>
                <SectionTitle sub="上長への確認依頼">承認情報</SectionTitle>
                <div className="space-y-3">
                  <Field label="承認者">{approval.approverName}</Field>
                  <Field label="依頼日時">{approval.requestedOnDemoDate}</Field>
                  {approval.requesterNote && <Field label="依頼コメント">{approval.requesterNote}</Field>}
                  {approval.decisionComment && <Field label="承認者コメント">{approval.decisionComment}</Field>}
                </div>
              </Card>
            )}

            {/* 次のアクション */}
            <Card>
              <SectionTitle sub="請求書の送付・確認依頼">次のアクション</SectionTitle>

              {isSent && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  <Icon name="checkCircle" className="mt-0.5 h-4 w-4 flex-none" strokeWidth={2} />
                  <span>先方に送付済みです（{invoice.sentAt}・モック）</span>
                </div>
              )}
              {isApprovalRequested && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
                  <Icon name="userCheck" className="mt-0.5 h-4 w-4 flex-none" strokeWidth={2} />
                  <span>
                    上長の確認待ちです。
                    <Link href="/approvals" className="ml-1 font-semibold underline hover:no-underline">
                      承認状況を見る
                    </Link>
                  </span>
                </div>
              )}

              {isDraft && (
                <div className="space-y-2">
                  <Button variant="primary" className="w-full" onClick={() => sendInvoice(order.id)}>
                    <Icon name="mailAlert" className="h-4 w-4" />
                    先方に送付
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => (showApprovalForm ? setShowApprovalForm(false) : openApprovalForm())}
                  >
                    <Icon name="userCheck" className="h-4 w-4" />
                    上長に確認依頼
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={saveDraft}>
                    <Icon name="fileText" className="h-4 w-4" />
                    {savedAt ? `下書き保存しました（${savedAt}）` : "下書き保存"}
                  </Button>
                </div>
              )}

              {showApprovalForm && isDraft && (
                <div className="mt-3 space-y-2 rounded-lg border border-surface-border bg-surface-sunken p-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ink-muted">AIが作成した依頼メッセージ</label>
                    {approvalDraftVariantCount("invoice") > 1 && (
                      <button
                        type="button"
                        onClick={regenerateDraft}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                      >
                        <Icon name="sparkles" className="h-3 w-3" strokeWidth={2} />
                        再生成
                      </button>
                    )}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="w-full resize-y rounded-md border border-surface-border bg-surface px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        requestApproval(order.id, "invoice", note);
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

              <LinkButton
                href={`/orders/${order.id}/read`}
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
              >
                読み取り結果に戻る
              </LinkButton>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
