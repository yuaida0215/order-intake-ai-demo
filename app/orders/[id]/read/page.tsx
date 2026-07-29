"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Card, SectionTitle, Button, LinkButton, Empty, PageHeader } from "@/components/ui";
import { StatusBadge, ChannelBadge, FieldConfidence, AgentAvatar } from "@/components/badges";
import { SourcePreview } from "@/components/SourcePreview";
import { AIProcessingSteps, AIResultSummary, AiOrbHero } from "@/components/ai";
import { Icon } from "@/components/icons";
import { yen, formatDate, confidencePct } from "@/lib/format";
import { AI_READING_STEPS } from "@/lib/core";
import { NextActionsPanel } from "@/components/NextActionsPanel";
import type { DemoOrder } from "@/lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 項目単位の擬似信頼度 (OCR座標なしでも既存データ構造から決定的に導出) */
const CONF_MAP: Record<string, number> = {
  customerName: 0.99,
  orderDate: 0.98,
  requestedDeliveryDate: 0.93,
  deliveryAddress: 0.9,
  productName: 0.97,
  quantity: 0.98,
  unitPrice: 0.96,
  amount: 0.99,
};
function fieldConf(order: DemoOrder, key: string, present: boolean): number {
  const flagged =
    order.missingFields.some((m) => m.fieldKey.includes(key)) ||
    order.validationErrors.some((v) => v.fieldKey.includes(key));
  if (!present || flagged) return 0.72;
  return CONF_MAP[key] ?? 0.96;
}

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));
  const markReading = useOrderStore((s) => s.markReading);
  const revealOrder = useOrderStore((s) => s.revealOrder);
  const patch = useOrderStore((s) => s.patch);
  const updateItem = useOrderStore((s) => s.updateItem);

  const [currentStep, setCurrentStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hl, setHl] = useState<string | undefined>();

  const runReading = useCallback(async () => {
    if (running || !order) return;
    setRunning(true);
    setCurrentStep(0);
    markReading(order.id);
    for (let i = 0; i < AI_READING_STEPS.length; i++) {
      setCurrentStep(i);
      await sleep(650);
    }
    setCurrentStep(AI_READING_STEPS.length);
    revealOrder(order.id);
    setRunning(false);
  }, [running, order, markReading, revealOrder]);

  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-lg font-bold text-ink">受注が見つかりません</h2>
            <p className="text-sm text-ink-muted">指定された受注 ID「{params.id}」は存在しません。</p>
            <LinkButton href="/orders" variant="primary">受注一覧へ</LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const isReading = order.status === "ai_reading" || running;
  const showStepper = !order.isRead && isReading;
  const showIdle = !order.isRead && !isReading;
  const noException = order.exceptionType === null;

  // 完了サマリーの数値
  const issueCount = order.missingFields.length + order.validationErrors.length;
  const totalFields = 4 + order.items.length * 3;
  const gotFields = totalFields - order.missingFields.length;
  const readSeconds = 12 + order.items.length * 3;

  // ホバー中の項目 → 元データを強調
  const hover = (v: string | null | undefined) => ({
    onMouseEnter: () => setHl(v ?? undefined),
    onMouseLeave: () => setHl(undefined),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI読み取り・確認"
        description="取り込んだ受注書と、AIが読み取った抽出結果を左右で見比べて確認します。"
        backHref="/orders"
        backLabel="受注一覧に戻る"
        meta={
          <>
            <span className="font-mono text-[13px] text-ink-muted">{order.id}</span>
            <ChannelBadge channel={order.channel} />
            <StatusBadge status={order.status} animated={isReading} />
            <span className="text-[13px] text-ink-muted">{order.sourceName}</span>
          </>
        }
      />

      {/* 完了サマリー (§8-1) */}
      {order.isRead && (
        <AIResultSummary
          title={
            noException
              ? `AIが${order.sourceName}を${readSeconds}秒でデータ化しました`
              : `AIが${order.sourceName}を読み取りました（要確認あり）`
          }
          subtitle={
            noException
              ? `${totalFields}項目中${gotFields}項目を正常に取得し、商品マスタとの照合が完了しました。`
              : `${totalFields}項目中${gotFields}項目を取得。${issueCount}件の項目に人の確認が必要です。`
          }
          stats={[
            { label: "確認が必要", value: `${issueCount}件`, tone: issueCount === 0 ? "emerald" : "amber" },
            { label: "全体信頼度", value: confidencePct(order.aiConfidenceScore), tone: order.aiConfidenceScore >= 0.95 ? "emerald" : "amber" },
            { label: "削減時間", value: "約12分", tone: "cyan" },
          ]}
        />
      )}

      {/* 2カラム */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左: 元データ + 処理ステップ */}
        <div className="space-y-6">
          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">元データ</h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">AIが読み取り対象にした受注書の原本</p>
              </div>
              {order.isRead && (
                <span className="text-[11px] text-ink-faint">項目にカーソルを合わせると該当箇所を強調</span>
              )}
            </div>
            <div className="p-6">
              <SourcePreview order={order} highlight={hl} />
            </div>
          </Card>

          {order.isRead && (
            <Card>
              <SectionTitle sub="AI Agentが実行した処理">AI処理ステップ</SectionTitle>
              <AIProcessingSteps steps={AI_READING_STEPS} current={AI_READING_STEPS.length} />
            </Card>
          )}
        </div>

        {/* 右: AI抽出結果 */}
        <Card>
          <SectionTitle sub="AIが自動抽出した受注内容">AI抽出結果</SectionTitle>

          {/* 待機状態 */}
          {showIdle && (
            <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-brand-200 bg-brand-50 px-6 py-14 text-center">
              <AgentAvatar size="h-14 w-14" pulse className="rounded-2xl" />
              <p className="max-w-xs text-sm text-ink-muted">
                この受注書はまだ読み取られていません。AI Agentがワンクリックで内容を抽出します。
              </p>
              <Button variant="ai" size="lg" onClick={runReading} disabled={running}>
                <Icon name="sparkles" className="h-[18px] w-[18px]" /> AIで読み取る
              </Button>
            </div>
          )}

          {/* 読み取り中：シネマティックなAI処理ヒーロー */}
          {showStepper && (
            <div className="mt-4">
              <AiOrbHero
                title={order.customerName ?? order.sourceName}
                subtitle={order.id}
                steps={AI_READING_STEPS}
                current={currentStep}
                running
              />
            </div>
          )}

          {/* 完了 */}
          {order.isRead && (
            <div className="mt-4 space-y-6">
              {/* 基本項目 (項目別信頼度つき) */}
              <div className="divide-y divide-line-subtle overflow-hidden rounded-lg border border-surface-border">
                <FieldRow
                  label="取引先名"
                  conf={fieldConf(order, "customerName", !!order.customerName)}
                  hover={hover(order.customerName)}
                >
                  {order.customerName ?? <span className="text-rose-600">未取得</span>}
                </FieldRow>
                <FieldRow label="発注日" conf={fieldConf(order, "orderDate", !!order.orderDate)} hover={hover(order.orderDate)}>
                  {order.orderDate ? formatDate(order.orderDate) : <Empty />}
                </FieldRow>
                <FieldRow
                  label="希望納品日"
                  conf={fieldConf(order, "requestedDeliveryDate", !!order.requestedDeliveryDate)}
                  hover={hover(order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : undefined)}
                >
                  {order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : <span className="text-rose-600">未取得</span>}
                </FieldRow>
                <FieldRow
                  label="納品先"
                  conf={fieldConf(order, "deliveryAddress", !!order.deliveryAddress)}
                  hover={hover(order.deliveryAddress)}
                >
                  {order.deliveryAddress ?? <span className="text-rose-600">未取得</span>}
                </FieldRow>
              </div>

              {/* 商品明細 */}
              <div>
                <div className="mb-2 text-xs font-medium text-ink-muted">商品明細</div>
                <div className="overflow-hidden rounded-lg border border-surface-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-sunken text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-3 py-2.5 text-left">商品コード</th>
                        <th className="px-3 py-2.5 text-left">商品名</th>
                        <th className="px-3 py-2.5 text-right">数量</th>
                        <th className="px-3 py-2.5 text-right">単価</th>
                        <th className="px-3 py-2.5 text-right">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                      {order.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">明細が抽出されませんでした</td>
                        </tr>
                      ) : (
                        order.items.map((item) => (
                          <tr key={item.lineNo} className="align-middle transition-colors hover:bg-surface-sunken" {...hover(item.productName)}>
                            <td className="px-3 py-3 font-mono text-xs text-ink-soft">{item.productCode ?? <Empty />}</td>
                            <td className="px-3 py-3 text-ink">
                              {isEditing ? (
                                <input
                                  className="w-full rounded-md border border-surface-border bg-surface-input px-2 py-1 text-sm text-ink outline-none focus:border-brand-500"
                                  value={item.productName ?? ""}
                                  onChange={(e) => updateItem(order.id, item.lineNo, { productName: e.target.value || null })}
                                />
                              ) : item.productName ? (
                                item.productName
                              ) : (
                                <Empty />
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-ink">
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="w-20 rounded-md border border-surface-border bg-surface-input px-2 py-1 text-right text-sm tabular-nums text-ink outline-none focus:border-brand-500"
                                  value={item.quantity ?? ""}
                                  onChange={(e) => updateItem(order.id, item.lineNo, { quantity: e.target.value === "" ? null : Number(e.target.value) })}
                                />
                              ) : item.quantity != null ? (
                                <>
                                  {item.quantity.toLocaleString()}
                                  {item.unit ? <span className="ml-0.5 text-xs text-ink-muted">{item.unit}</span> : null}
                                </>
                              ) : (
                                <Empty />
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{yen(item.unitPrice)}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-ink">{yen(item.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 合計金額 */}
              <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-sunken px-4 py-3.5">
                <span className="text-sm font-medium text-ink-soft">合計金額</span>
                <span className="text-2xl font-bold tabular-nums text-ink">{yen(order.totalAmount)}</span>
              </div>

              {/* AI確認結果 (§8-5) */}
              <AiJudgement order={order} />

              {/* 不足項目 / エラー */}
              {order.missingFields.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-amber-700">
                    <Icon name="alertTriangle" className="h-4 w-4" /> 人の確認が必要な項目（{order.missingFields.length}件）
                  </div>
                  <ul className="space-y-1.5">
                    {order.missingFields.map((f) => (
                      <li key={f.fieldKey} className="text-sm text-amber-700">
                        <span className="font-medium">{f.fieldLabel}</span>
                        <span className="text-amber-700/80"> — {f.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {order.validationErrors.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-rose-600">
                    <Icon name="alertTriangle" className="h-4 w-4" /> エラー（{order.validationErrors.length}件）
                  </div>
                  <ul className="space-y-1.5">
                    {order.validationErrors.map((e) => (
                      <li key={e.fieldKey} className="text-sm text-rose-600">
                        <span className="font-medium">{e.fieldLabel}</span>
                        <span className="text-rose-600/80"> — {e.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* アクション */}
              <div className="flex items-center justify-between border-t border-surface-border pt-5">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing((v) => !v)}>
                  <Icon name="fileText" className="h-4 w-4" />
                  {isEditing ? "編集を終了" : "内容を修正"}
                </Button>
                {!noException && (
                  <Button variant="primary" onClick={() => router.push(`/orders/${order.id}/exception`)}>
                    例外内容を確認
                    <Icon name="chevronRight" className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {noException && <NextActionsPanel order={order} />}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** 項目別信頼度つきの1行 */
function FieldRow({
  label,
  conf,
  hover,
  children,
}: {
  label: string;
  conf: number;
  hover: { onMouseEnter: () => void; onMouseLeave: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken" {...hover}>
      <span className="w-24 flex-none text-xs font-medium text-ink-muted">{label}</span>
      <span className="flex-1 text-sm text-ink">{children}</span>
      <FieldConfidence score={conf} />
    </div>
  );
}

/** AI確認結果チェックリスト (§8-5) */
function AiJudgement({ order }: { order: DemoOrder }) {
  const noException = order.exceptionType === null;
  const checks = [
    { label: "商品マスタ一致", ok: !order.validationErrors.some((v) => v.fieldKey.includes("productCode")) },
    { label: "数量形式正常", ok: !order.validationErrors.some((v) => v.fieldKey.includes("quantity")) },
    { label: "金額計算一致", ok: order.totalAmount !== null },
    { label: "納品先確認済み", ok: !!order.deliveryAddress },
  ];
  return (
    <div className={`rounded-lg border p-4 ${noException ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex items-center gap-2">
        <Icon name="sparkles" className={`h-4 w-4 ${noException ? "text-emerald-600" : "text-amber-600"}`} strokeWidth={2} />
        <span className="text-[15px] font-semibold text-ink">AI確認結果</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        {noException
          ? "登録に必要な情報がすべて揃っています。商品コード・数量・金額・納品先に矛盾はありません。"
          : order.aiSummary}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-[13px]">
            {c.ok ? (
              <Icon name="checkCircle" className="h-4 w-4 flex-none text-emerald-600" strokeWidth={2} />
            ) : (
              <Icon name="alertTriangle" className="h-4 w-4 flex-none text-amber-600" />
            )}
            <span className={c.ok ? "text-ink-soft" : "text-amber-700"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
