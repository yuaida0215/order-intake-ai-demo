"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import {
  Card,
  SectionTitle,
  Button,
  LinkButton,
  Field,
  Empty,
} from "@/components/ui";
import {
  StatusBadge,
  ChannelBadge,
  ConfidenceBadge,
  CategoryBadge,
  AgentAvatar,
} from "@/components/badges";
import { SourcePreview } from "@/components/SourcePreview";
import { yen, formatDate } from "@/lib/format";
import { AI_READING_STEPS } from "@/lib/core";
import { NextActionsPanel } from "@/components/NextActionsPanel";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 縦型ステッパー: 完了 ✓ / 実行中 spinner / 未着手 */
function ReadingStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="space-y-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={i} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              {done ? (
                <span className="ai-gradient shadow-glow-sm flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  ✓
                </span>
              ) : active ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-surface-border" />
              )}
            </span>
            <span
              className={`text-sm ${
                done
                  ? "text-ink-soft"
                  : active
                  ? "font-medium text-ink"
                  : "text-ink-faint"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
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
            <div>
              <h2 className="text-lg font-bold text-ink">受注が見つかりません</h2>
              <p className="mt-1 text-sm text-ink-muted">
                指定された受注 ID「{params.id}」は存在しません。
              </p>
            </div>
            <LinkButton href="/orders" variant="primary">
              受注一覧へ
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const isReading = order.status === "ai_reading" || running;
  const showStepper = !order.isRead && isReading;
  const showIdle = !order.isRead && !isReading;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Link
          href="/orders"
          className="text-sm text-ink-muted hover:text-ink"
        >
          ← 受注一覧に戻る
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">
          受注取り込み・AI読み取り
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          取り込んだ受注書と、AIが読み取った抽出結果を左右で見比べて確認します。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-sunken px-2 py-1 font-mono text-xs text-ink-soft">
            {order.id}
          </span>
          <ChannelBadge channel={order.channel} />
          <StatusBadge status={order.status} animated={isReading} />
          <span className="text-xs text-ink-muted">{order.sourceName}</span>
        </div>
      </div>

      {/* 2カラム */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左: 元データ */}
        <Card>
          <SectionTitle sub="AIが読み取った受注書の原本です">
            元データ
          </SectionTitle>
          <div className="mt-4">
            <SourcePreview order={order} />
          </div>
        </Card>

        {/* 右: AI抽出結果 */}
        <Card>
          <SectionTitle
            sub="AIが自動抽出した受注内容"
            right={
              order.isRead ? (
                <div className="flex items-center gap-2">
                  <ConfidenceBadge score={order.aiConfidenceScore} />
                  <CategoryBadge exceptionType={order.exceptionType} />
                </div>
              ) : undefined
            }
          >
            AI抽出結果
          </SectionTitle>

          {/* 待機状態: 読み取りボタン */}
          {showIdle && (
            <div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-12 text-center">
              <AgentAvatar size="h-14 w-14" pulse className="rounded-2xl text-2xl" />
              <p className="max-w-xs text-sm text-ink-muted">
                この受注書はまだ読み取られていません。AI
                Agentがワンクリックで内容を抽出します。
              </p>
              <Button variant="primary" onClick={runReading} disabled={running}>
                🤖 AIで読み取る
              </Button>
            </div>
          )}

          {/* 読み取り中: ステッパー */}
          {showStepper && (
            <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/40 px-6 py-8">
              <div className="mb-5 flex items-center gap-2.5 text-sm font-medium text-ink">
                <AgentAvatar size="h-7 w-7" pulse className="text-sm" />
                AI Agentが読み取り中…
              </div>
              <ReadingStepper steps={AI_READING_STEPS} current={currentStep} />
            </div>
          )}

          {/* 読み取り完了: 抽出結果 */}
          {order.isRead && (
            <div className="mt-5 space-y-6">
              {/* 基本項目 */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="取引先名" missing={!order.customerName}>
                  {isEditing ? (
                    <input
                      className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink focus:border-brand-600 focus:outline-none"
                      value={order.customerName ?? ""}
                      onChange={(e) =>
                        patch(order.id, (o) => {
                          o.customerName = e.target.value || null;
                        })
                      }
                    />
                  ) : order.customerName ? (
                    order.customerName
                  ) : (
                    <Empty />
                  )}
                </Field>
                <Field label="発注日">
                  {order.orderDate ? formatDate(order.orderDate) : <Empty />}
                </Field>
                <Field label="希望納品日" missing={!order.requestedDeliveryDate}>
                  {order.requestedDeliveryDate ? (
                    formatDate(order.requestedDeliveryDate)
                  ) : (
                    <span className="text-red-500">未取得</span>
                  )}
                </Field>
                <Field label="納品先" missing={!order.deliveryAddress}>
                  {order.deliveryAddress ? (
                    order.deliveryAddress
                  ) : (
                    <span className="text-red-500">未取得</span>
                  )}
                </Field>
              </div>

              {/* 商品明細 */}
              <div>
                <div className="mb-2 text-[11px] font-medium text-ink-muted">
                  商品明細
                </div>
                <div className="overflow-hidden rounded-lg border border-surface-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-sunken text-[11px] text-ink-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          商品コード
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          商品名
                        </th>
                        <th className="px-3 py-2 text-right font-medium">数量</th>
                        <th className="px-3 py-2 text-right font-medium">単価</th>
                        <th className="px-3 py-2 text-right font-medium">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {order.items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-6 text-center text-ink-faint"
                          >
                            明細が抽出されませんでした
                          </td>
                        </tr>
                      ) : (
                        order.items.map((item) => (
                          <tr key={item.lineNo} className="align-top">
                            <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                              {item.productCode ?? <Empty />}
                            </td>
                            <td className="px-3 py-2 text-ink">
                              {isEditing ? (
                                <input
                                  className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink focus:border-brand-600 focus:outline-none"
                                  value={item.productName ?? ""}
                                  onChange={(e) =>
                                    updateItem(order.id, item.lineNo, {
                                      productName: e.target.value || null,
                                    })
                                  }
                                />
                              ) : item.productName ? (
                                item.productName
                              ) : (
                                <Empty />
                              )}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink">
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="w-20 rounded-md border border-surface-border bg-white px-2 py-1 text-right text-sm tabular-nums text-ink focus:border-brand-600 focus:outline-none"
                                  value={item.quantity ?? ""}
                                  onChange={(e) =>
                                    updateItem(order.id, item.lineNo, {
                                      quantity:
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                    })
                                  }
                                />
                              ) : item.quantity != null ? (
                                <>
                                  {item.quantity.toLocaleString()}
                                  {item.unit ? (
                                    <span className="ml-0.5 text-xs text-ink-muted">
                                      {item.unit}
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <Empty />
                              )}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink-soft">
                              {yen(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink">
                              {yen(item.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 合計金額 */}
              <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-4 py-3">
                <span className="text-sm font-medium text-ink-soft">合計金額</span>
                <span className="text-lg font-bold tabular-nums text-ink">
                  {yen(order.totalAmount)}
                </span>
              </div>

              {/* 不足項目 */}
              {order.missingFields.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 text-xs font-semibold text-amber-700">
                    不足項目 ({order.missingFields.length}件)
                  </div>
                  <ul className="space-y-1.5">
                    {order.missingFields.map((f) => (
                      <li key={f.fieldKey} className="text-sm text-amber-800">
                        <span className="font-medium">{f.fieldLabel}</span>
                        <span className="text-amber-700"> — {f.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* バリデーションエラー */}
              {order.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 text-xs font-semibold text-red-700">
                    エラー ({order.validationErrors.length}件)
                  </div>
                  <ul className="space-y-1.5">
                    {order.validationErrors.map((e) => (
                      <li key={e.fieldKey} className="text-sm text-red-700">
                        <span className="font-medium">{e.fieldLabel}</span>
                        <span> — {e.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI判定 */}
              <div>
                <div className="mb-1 text-[11px] font-medium text-ink-muted">
                  AI判定
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {order.aiSummary}
                </p>
              </div>

              {/* 推奨アクション */}
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <div className="mb-1 text-[11px] font-semibold text-brand-700">
                  推奨アクション
                </div>
                <p className="text-sm font-medium leading-relaxed text-brand-800">
                  {order.recommendedAction}
                </p>
              </div>

              {/* 編集トグル + アクションボタン */}
              <div className="flex flex-col gap-3 border-t border-surface-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  {isEditing ? "編集を終了" : "内容を修正"}
                </Button>

                {order.exceptionType !== null && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      router.push("/orders/" + order.id + "/exception")
                    }
                  >
                    例外内容を確認 →
                  </Button>
                )}
              </div>

              {order.exceptionType === null && <NextActionsPanel order={order} />}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}