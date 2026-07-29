"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useOrderStore } from "@/lib/store";
import { CORE_INPUT_STEPS, customerCodeOf } from "@/lib/core";
import { formatDate, yen } from "@/lib/format";
import type { OrderItem } from "@/lib/types";
import { Button, Card, LinkButton, PageHeader } from "@/components/ui";
import { AgentAvatar, ChannelBadge, StatusBadge } from "@/components/badges";
import { AIProcessingSteps } from "@/components/ai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// このステップに到達したら該当ブロックが埋まる、という対応表
// CORE_INPUT_STEPS:
//  0: ログイン中 / 1: 取引先情報 / 2: 商品明細 / 3: 納品情報 / 4: 金額確認 / 5: 登録処理 / 6: 完了
const STEP_CUSTOMER = 1;
const STEP_ITEMS = 2;
const STEP_DELIVERY = 3;
const STEP_AMOUNT = 4;

function WindowBar() {
  return (
    <div className="flex items-center justify-between border-b border-surface-border bg-surface-sunken px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="ml-2 text-xs font-semibold tracking-wide text-ink-soft">
          基幹システム <span className="text-ink-faint">/</span> 受注登録
        </span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">ERP-CORE v4</span>
    </div>
  );
}

/** ERP風の読み取り専用フィールド。filled=false のときは faint な「入力待ち」表示。 */
function ErpField({
  label,
  value,
  filled,
  mono,
  justFilled,
}: {
  label: string;
  value: string;
  filled: boolean;
  mono?: boolean;
  justFilled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-ink-muted">{label}</div>
      <div
        className={[
          "flex min-h-[38px] items-center rounded-md border px-3 py-2 text-sm transition-colors duration-300",
          filled
            ? "border-surface-border bg-surface text-ink shadow-inner"
            : "border-dashed border-surface-border bg-surface-sunken text-ink-faint",
          justFilled ? "ring-2 ring-brand-200" : "",
          mono ? "font-mono tabular-nums" : "",
        ].join(" ")}
      >
        {filled ? value : "入力待ち"}
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));
  const registerToCore = useOrderStore((s) => s.registerToCore);

  const [stepIndex, setStepIndex] = useState<number>(-1); // -1=未開始
  const [running, setRunning] = useState(false);
  const [localOrderNo, setLocalOrderNo] = useState<string | null>(null);
  const [filledItemRows, setFilledItemRows] = useState<number>(0);
  const [lastFilled, setLastFilled] = useState<string | null>(null);
  const guard = useRef(false);

  const alreadyDone = useMemo(
    () => !!order && (order.status === "auto_input_completed" || !!order.coreSystemInput?.generatedOrderNo),
    [order],
  );

  // ---- NotFound ----
  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="text-lg font-bold text-ink">受注が見つかりません</div>
            <p className="text-sm text-ink-muted">指定された受注は存在しないか、削除された可能性があります。</p>
            <LinkButton href="/orders" variant="primary">
              受注一覧へ
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const items: OrderItem[] = order.items ?? [];
  const customerCode = customerCodeOf(order.customerName);
  const generatedNo = order.coreSystemInput?.generatedOrderNo ?? localOrderNo;
  const completed = alreadyDone || stepIndex >= CORE_INPUT_STEPS.length - 1;

  // どのブロックが埋まっているか（完了済み再訪 or アニメの到達ステップで判定）
  const reached = (step: number) => alreadyDone || stepIndex >= step;
  const customerFilled = reached(STEP_CUSTOMER);
  const deliveryFilled = reached(STEP_DELIVERY);
  const amountFilled = reached(STEP_AMOUNT);
  const shownItemRows = alreadyDone ? items.length : reached(STEP_ITEMS) ? filledItemRows : 0;

  const hasUnresolvedException = order.exceptionType !== null && !alreadyDone;

  async function runAutoInput() {
    if (guard.current || running || alreadyDone) return;
    guard.current = true;
    setRunning(true);

    for (let i = 0; i < CORE_INPUT_STEPS.length; i++) {
      setStepIndex(i);

      // 商品明細ステップでは行を1行ずつ流し込む演出
      if (i === STEP_ITEMS && items.length > 0) {
        setFilledItemRows(0);
        for (let r = 0; r < items.length; r++) {
          await sleep(Math.max(220, 620 / items.length));
          setFilledItemRows(r + 1);
        }
      }

      if (i === STEP_CUSTOMER) setLastFilled("customer");
      else if (i === STEP_DELIVERY) setLastFilled("delivery");
      else if (i === STEP_AMOUNT) setLastFilled("amount");
      else setLastFilled(null);

      // 最終ステップで基幹登録を確定
      if (i === CORE_INPUT_STEPS.length - 1) {
        const no = registerToCore(order!.id);
        setLocalOrderNo(no);
      }

      await sleep(760);
    }

    setLastFilled(null);
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="基幹システムへ登録"
        description="AI Agentが読み取り済みの受注情報を、基幹システムの受注登録画面へ自動で入力します。"
        backHref={`/orders/${order.id}/read`}
        backLabel="読み取り内容に戻る"
        meta={
          <>
            <span className="font-mono text-[13px] text-ink-muted">{order.id}</span>
            <StatusBadge status={order.status} />
            <ChannelBadge channel={order.channel} />
            <span className="text-[13px] text-ink-muted">{order.sourceName}</span>
          </>
        }
      />

      {/* 未解決例外の注意書き */}
      {hasUnresolvedException && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span aria-hidden>⚠️</span>
          <span>
            この案件には未解決の例外があります。通常は例外確認画面で修正後に登録します。
            <Link href={`/orders/${order.id}/exception`} className="ml-1 font-semibold underline hover:no-underline">
              例外確認へ
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左：AI Agent 実行パネル */}
        <div className="space-y-4 lg:col-span-1">
          <div className="ai-border rounded-2xl">
            <div className="overflow-hidden rounded-[15px] bg-surface">
            <div className="border-b border-surface-border bg-brand-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <AgentAvatar size="h-10 w-10" pulse={running} />
                <div>
                  <div className="text-sm font-bold gradient-text">AI Agent</div>
                  <div className="text-[11px] text-ink-muted">基幹システム自動オペレーション</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {!completed && stepIndex < 0 && (
                <p className="text-xs leading-relaxed text-ink-muted">
                  「自動入力開始」を押すと、AI
                  Agentが基幹システムにログインし、各項目を順番に入力していく様子を確認できます。
                </p>
              )}

              {/* ステップチェックリスト */}
              {(stepIndex >= 0 || completed) && (
                <AIProcessingSteps
                  steps={CORE_INPUT_STEPS}
                  current={completed ? CORE_INPUT_STEPS.length : stepIndex}
                  running={running}
                />
              )}

              {!completed && (
                <div className="space-y-2">
                  <Button
                    variant="ai"
                    size="lg"
                    onClick={runAutoInput}
                    disabled={running || alreadyDone}
                    className="w-full"
                  >
                    {running ? "登録実行中…" : "基幹システムへ登録"}
                  </Button>
                  <p className="text-center text-[11px] text-ink-muted">
                    読み取り内容は確認済みのため、確認なしで登録できます
                  </p>
                </div>
              )}

              {completed && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                  すべての項目の入力が完了しました
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* 右：ERP風 受注登録フォーム */}
        <div className="space-y-4 lg:col-span-2">
          {completed && generatedNo && (
            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-lg text-white" aria-hidden>
                    ✓
                  </span>
                  <div>
                    <div className="text-lg font-bold text-emerald-700">受注登録が完了しました</div>
                    <div className="text-[13px] text-emerald-700/90">基幹システムへの自動入力が正常に反映されました</div>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-surface px-4 py-2 text-right">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">受注番号</div>
                  <div className="whitespace-nowrap font-mono text-xl font-bold tabular-nums text-emerald-700">{generatedNo}</div>
                </div>
              </div>
            </div>
          )}

          <Card padded={false}>
            <WindowBar />
            <div className="space-y-5 p-5">
              {/* 受注ヘッダ */}
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">受注ヘッダ</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ErpField
                    label="取引先コード"
                    value={customerCode ?? "—"}
                    filled={customerFilled}
                    mono
                    justFilled={running && lastFilled === "customer"}
                  />
                  <ErpField
                    label="取引先名"
                    value={order.customerName ?? "—"}
                    filled={customerFilled}
                    justFilled={running && lastFilled === "customer"}
                  />
                  <ErpField
                    label="受注日"
                    value={formatDate(order.orderDate)}
                    filled={customerFilled}
                    mono
                    justFilled={running && lastFilled === "customer"}
                  />
                  <ErpField
                    label="希望納品日"
                    value={formatDate(order.requestedDeliveryDate)}
                    filled={deliveryFilled}
                    mono
                    justFilled={running && lastFilled === "delivery"}
                  />
                  <div className="sm:col-span-2">
                    <ErpField
                      label="納品先"
                      value={order.deliveryAddress ?? "—"}
                      filled={deliveryFilled}
                      justFilled={running && lastFilled === "delivery"}
                    />
                  </div>
                </div>
              </div>

              {/* 商品明細テーブル */}
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">商品明細</div>
                <div className="overflow-hidden rounded-md border border-surface-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-sunken text-left text-[11px] uppercase tracking-wider text-ink-muted">
                        <th className="px-3 py-2 font-medium">商品コード</th>
                        <th className="px-3 py-2 font-medium">商品名</th>
                        <th className="px-3 py-2 text-right font-medium">数量</th>
                        <th className="px-3 py-2 text-right font-medium">単価</th>
                        <th className="px-3 py-2 text-right font-medium">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-sm text-ink-faint">
                            明細なし
                          </td>
                        </tr>
                      )}
                      {items.map((it, idx) => {
                        const rowFilled = idx < shownItemRows;
                        return (
                          <tr
                            key={it.lineNo}
                            className={rowFilled ? "bg-surface transition-colors" : "bg-surface-sunken/60"}
                          >
                            <td className="px-3 py-2 font-mono text-xs text-ink">
                              {rowFilled ? it.productCode ?? "—" : <span className="text-ink-faint">入力待ち</span>}
                            </td>
                            <td className="px-3 py-2 text-ink">
                              {rowFilled ? it.productName ?? "—" : <span className="text-ink-faint">—</span>}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink">
                              {rowFilled ? `${it.quantity ?? "—"}${it.unit ? ` ${it.unit}` : ""}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink">
                              {rowFilled ? yen(it.unitPrice) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
                              {rowFilled ? yen(it.amount) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 合計金額 */}
              <div className="flex items-center justify-between rounded-md border border-surface-border bg-surface-sunken px-4 py-3">
                <span className="text-sm font-semibold text-ink-soft">合計金額（税込）</span>
                <span
                  className={[
                    "text-xl font-bold tabular-nums transition-colors duration-300",
                    amountFilled ? "text-brand-700" : "text-ink-faint",
                  ].join(" ")}
                >
                  {amountFilled ? yen(order.totalAmount) : "入力待ち"}
                </span>
              </div>

              {/* 登録ステータス行 */}
              <div className="flex items-center justify-between border-t border-surface-border pt-3 text-xs">
                <span className="text-ink-muted">登録ステータス</span>
                <span
                  className={
                    completed
                      ? "font-semibold text-emerald-700"
                      : running
                        ? "font-semibold text-brand-700"
                        : "text-ink-faint"
                  }
                >
                  {completed ? "登録済み" : running ? "入力中…" : "未登録"}
                </span>
              </div>
            </div>
          </Card>

          {/* フッターボタン（完了後に表示） */}
          {completed && (
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/orders" variant="secondary">
                受注一覧へ戻る
              </LinkButton>
              <LinkButton href="/dashboard" variant="primary">
                ダッシュボードで確認 →
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
