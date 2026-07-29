"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Card, SectionTitle, Button, Field, Empty, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { DemoClockControl } from "@/components/DemoClockControl";
import { Icon } from "@/components/icons";
import { businessDaysBetween } from "@/lib/business-days";
import { yen, formatDate, totalQuantity } from "@/lib/format";
import {
  DEPARTMENTS,
  DEMO_APPROVALS,
  departmentForOrderId,
  approverForDepartment,
  departmentName,
} from "@/lib/approvals-demo";
import type { ApprovalTarget, DemoOrder, ReminderChannel } from "@/lib/types";

const TARGET_LABEL: Record<string, string> = { quote: "見積書", order: "受注内容", po: "発注書", invoice: "請求書" };
const CHANNEL_OPTIONS: [ReminderChannel, string][] = [
  ["chatwork", "Chatwork"],
  ["slack", "Slack"],
  ["email", "メール"],
];
const THRESHOLD_OPTIONS: [number, string][] = [
  [1, "1営業日"],
  [2, "2営業日"],
  [3, "3営業日"],
  [5, "5営業日"],
];

const CHECKLIST: [string, string][] = [
  ["金額計算", "一致"],
  ["商品マスタ", "一致"],
  ["納期", "通常範囲内"],
  ["過去取引", "あり"],
  ["例外事項", "なし"],
];

const ALL_TAB = "all";

const REAL_AI_VERDICT =
  "注文内容・金額・納期に不整合はありません。商品マスタ・過去取引と一致しており、承認可能と判断しています。";

/** 一覧・詳細で共通に扱う承認案件の統一シェイプ */
type ApprovalRow = {
  kind: "real" | "demo";
  key: string;
  department: string;
  customerName: string;
  target: ApprovalTarget;
  amount: number;
  requester: string;
  approverName: string;
  elapsed: number;
  elapsedLabel: string;
  overdue: boolean;
  aiVerdict: string;
  itemSummary: string;
  /** kind==="real" のみ */
  order?: DemoOrder;
  orderId?: string;
};

type DemoDecision = { status: "approved" | "remanded"; comment: string };

export default function ApprovalsPage() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const demoDate = useOrderStore((s) => s.demoDate);
  const reminderSettings = useOrderStore((s) => s.reminderSettings);
  const setReminderChannel = useOrderStore((s) => s.setReminderChannel);
  const setReminderThreshold = useOrderStore((s) => s.setReminderThreshold);
  const approveRequest = useOrderStore((s) => s.approveRequest);
  const remandRequest = useOrderStore((s) => s.remandRequest);

  const [activeDept, setActiveDept] = useState<string>(ALL_TAB);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [openComment, setOpenComment] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [demoDecisions, setDemoDecisions] = useState<Record<string, DemoDecision>>({});

  const threshold = reminderSettings.thresholdBusinessDays;

  // 実ストアの確認待ち + デモ案件を統一シェイプに束ねる
  const rows = useMemo<ApprovalRow[]>(() => {
    const realRows: ApprovalRow[] = orders
      .filter((o) => o.approval?.status === "waiting")
      .map((o) => {
        const approval = o.approval!;
        const department = departmentForOrderId(o.id);
        const elapsed = businessDaysBetween(approval.requestedOnDemoDate, demoDate);
        const products = o.items.map((i) => i.productName).filter((n): n is string => !!n);
        return {
          kind: "real" as const,
          key: `real:${o.id}`,
          department,
          customerName: o.customerName ?? "取引先不明",
          target: approval.target,
          amount: o.totalAmount ?? 0,
          requester: "自社担当",
          approverName: approval.approverName || approverForDepartment(department),
          elapsed,
          elapsedLabel: `経過 ${elapsed}営業日`,
          overdue: elapsed >= threshold,
          aiVerdict: REAL_AI_VERDICT,
          itemSummary: products.length > 0 ? products.join("、") : "受注内容",
          order: o,
          orderId: o.id,
        };
      })
      .sort((a, b) => b.elapsed - a.elapsed);

    const demoRows: ApprovalRow[] = DEMO_APPROVALS.map((d) => ({
      kind: "demo" as const,
      key: `demo:${d.id}`,
      department: d.departmentKey,
      customerName: d.customerName,
      target: d.target,
      amount: d.amount,
      requester: d.requester,
      approverName: d.approverName,
      elapsed: d.elapsedBusinessDays,
      elapsedLabel: d.requestedLabel,
      overdue: d.elapsedBusinessDays >= threshold,
      aiVerdict: d.aiVerdict,
      itemSummary: d.itemSummary,
    }));

    return [...realRows, ...demoRows];
  }, [orders, demoDate, threshold]);

  const resolved = useMemo(
    () => orders.filter((o) => o.approval && o.approval.status !== "waiting"),
    [orders],
  );

  const countFor = (deptKey: string) =>
    deptKey === ALL_TAB ? rows.length : rows.filter((r) => r.department === deptKey).length;

  const tabs = useMemo(
    () => [
      { key: ALL_TAB, name: "全社", count: rows.length },
      ...DEPARTMENTS.map((d) => ({ key: d.key, name: d.name, count: countFor(d.key) })),
    ],
    [rows],
  );

  const filtered = activeDept === ALL_TAB ? rows : rows.filter((r) => r.department === activeDept);

  // 選択中の行 (未選択 or フィルタ外なら先頭)。毎回導出して壊れないようにする
  const selected = filtered.find((r) => r.key === selectedKey) ?? filtered[0] ?? null;

  function detailHref(order: DemoOrder): string {
    if (order.approval?.target === "quote") return `/orders/${order.id}/quote`;
    if (order.approval?.target === "po") return `/orders/${order.id}/po`;
    if (order.approval?.target === "invoice") return `/orders/${order.id}/invoice`;
    return `/orders/${order.id}/read`;
  }

  function handleApprove(row: ApprovalRow) {
    if (row.kind === "real" && row.orderId) {
      approveRequest(row.orderId, comment);
    } else {
      setDemoDecisions((prev) => ({ ...prev, [row.key]: { status: "approved", comment } }));
    }
    setOpenComment(null);
    setComment("");
  }

  function handleRemand(row: ApprovalRow) {
    if (row.kind === "real" && row.orderId) {
      remandRequest(row.orderId, comment);
    } else {
      setDemoDecisions((prev) => ({ ...prev, [row.key]: { status: "remanded", comment } }));
    }
    setOpenComment(null);
    setComment("");
  }

  const channelLabel = CHANNEL_OPTIONS.find((c) => c[0] === reminderSettings.channel)?.[1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="上長確認待ち"
        description="部門ごとのシートを切り替えて確認できます。左の一覧から案件を選ぶと、AIの確認結果とともに詳細が表示されます。各案件には担当の承認者が表示されます。"
        actions={
          <Button variant="secondary" onClick={() => setShowReminder((v) => !v)}>
            <Icon name="bell" className="h-4 w-4" />
            リマインド設定
          </Button>
        }
      />

      {showReminder && (
        <Card>
          <SectionTitle sub="依頼から一定の営業日が経過した案件へ自動でリマインドを送信します">
            自動リマインド設定
          </SectionTitle>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                リマインド送信ツール
                <select
                  value={reminderSettings.channel}
                  onChange={(e) => setReminderChannel(e.target.value as ReminderChannel)}
                  className="h-10 rounded-lg border border-surface-border bg-surface-input px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                >
                  {CHANNEL_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                経過営業日
                <select
                  value={reminderSettings.thresholdBusinessDays}
                  onChange={(e) => setReminderThreshold(Number(e.target.value) as 1 | 2 | 3 | 5)}
                  className="h-10 rounded-lg border border-surface-border bg-surface-input px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                >
                  {THRESHOLD_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
              依頼から{reminderSettings.thresholdBusinessDays}営業日経過した案件に、{channelLabel}で自動リマインドします。
            </p>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <DemoClockControl />
          </div>
        </Card>
      )}

      {/* シートタブ (Excelのシート風・部門別) */}
      <div>
        <div className="flex flex-wrap items-end gap-1 px-1">
          {tabs.map((t) => {
            const active = t.key === activeDept;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveDept(t.key)}
                className={`relative -mb-px flex items-center gap-2 rounded-t-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "z-10 border-surface-border border-b-transparent border-t-2 border-t-brand-500 bg-surface text-ink"
                    : "border-transparent bg-surface-sunken text-ink-muted hover:bg-line-subtle hover:text-ink-soft"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {t.key === ALL_TAB && <Icon name="layers" className="h-4 w-4" />}
                  {t.name}
                </span>
                <span className={`tabular-nums text-xs ${active ? "text-brand-600" : "text-ink-faint"}`}>
                  ({t.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* シート本体 */}
        <div className="rounded-b-xl rounded-tr-xl border border-surface-border bg-surface p-4 shadow-card lg:p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[36fr_64fr]">
            {/* LEFT: 確認待ち一覧 */}
            <div className="flex min-h-[520px] flex-col rounded-xl border border-surface-border bg-surface-sunken p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-ink">
                  {activeDept === ALL_TAB ? "全部門の確認待ち" : `${departmentName(activeDept)}の確認待ち`}
                </h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                  {filtered.length}件
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-2 py-8 text-center text-sm text-ink-faint">
                  このシートに確認待ちの案件はありません。
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((row) => {
                    const decision = demoDecisions[row.key];
                    const isSelected = selected?.key === row.key;
                    return (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => setSelectedKey(row.key)}
                        className={`flex w-full flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-brand-300 bg-brand-50"
                            : "border-surface-border bg-surface hover:border-line-strong hover:bg-surface-sunken"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{row.customerName}</span>
                          <span className="flex-none tabular-nums text-sm font-semibold text-ink-soft">
                            {yen(row.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                          <span>{TARGET_LABEL[row.target]}の承認</span>
                          <span aria-hidden>・</span>
                          <span>依頼者 {row.requester}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                          <Icon name="userCheck" className="h-3.5 w-3.5 text-ink-muted" />
                          承認者：{row.approverName}
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          {decision ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                                decision.status === "approved"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                              }`}
                            >
                              {decision.status === "approved" ? "承認済み（デモ）" : "差し戻し済み（デモ）"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                              <Icon name="sparkles" className="h-3 w-3" strokeWidth={2} />
                              AI判定：問題なし
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              row.overdue ? "bg-amber-50 text-amber-700" : "bg-surface-sunken text-ink-muted"
                            }`}
                          >
                            {row.overdue ? <Icon name="alertTriangle" className="h-3 w-3" strokeWidth={2} /> : null}
                            {row.elapsedLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: 選択案件の詳細 */}
            <div className="min-h-[520px]">
              {!selected ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-surface-border bg-surface-sunken p-6">
                  <EmptyState
                    icon={<Icon name="userCheck" className="h-9 w-9" />}
                    title="このシートに確認待ちの案件はありません"
                    description="部門タブを切り替えるか、上長の承認が必要な案件が届くと、ここに内容とAIの確認結果が表示されます。"
                  />
                </div>
              ) : (
                (() => {
                  const row = selected;
                  const order = row.order;
                  const approval = order?.approval;
                  const decision = demoDecisions[row.key];
                  const isRemanding = openComment === row.key;
                  const products =
                    order?.items.map((i) => i.productName).filter((n): n is string => !!n) ?? [];
                  const qty = order ? totalQuantity(order) : null;

                  return (
                    <div className="flex h-full flex-col gap-5 rounded-xl border border-surface-border bg-surface-sunken p-6">
                      {/* ヘッダー */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="text-xl font-bold tracking-tight text-ink">{row.customerName}</h2>
                            <StatusBadge status="waiting_manager_approval" />
                          </div>
                          <p className="mt-1 text-sm text-ink-muted">
                            {TARGET_LABEL[row.target]}の承認 ・ {departmentName(row.department)}
                            {approval ? ` ・ 依頼日 ${approval.requestedOnDemoDate}` : ` ・ 依頼 ${row.elapsedLabel}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">金額</div>
                          <div className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{yen(row.amount)}</div>
                        </div>
                      </div>

                      {/* AI要約 */}
                      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                        <div className="flex items-start gap-3.5">
                          <span className="ai-gradient mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl text-white shadow-glow-sm">
                            <Icon name="sparkles" className="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-ink">AI要約</h3>
                            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{row.aiVerdict}</p>
                            <p className="mt-1.5 text-[13px] font-medium text-ink-muted">最終判断は承認者が行います。</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-brand-200 pt-4 sm:grid-cols-2">
                          {CHECKLIST.map(([label, value]) => (
                            <div key={label} className="flex items-center gap-2 text-[13px]">
                              <Icon name="checkCircle" className="h-4 w-4 flex-none text-emerald-600" strokeWidth={2} />
                              <span className="text-ink-muted">{label}：</span>
                              <span className="font-medium text-ink-soft">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 詳細フィールド */}
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <Field label="取引先">{row.customerName}</Field>
                        <Field label="申請内容">{TARGET_LABEL[row.target]}の承認</Field>
                        <Field label="商品・内容">
                          {order ? (products.length > 0 ? products.join("、") : <Empty />) : row.itemSummary}
                        </Field>
                        <Field label="数量">
                          {order ? (qty !== null ? qty.toLocaleString("ja-JP") : <Empty />) : <Empty />}
                        </Field>
                        <Field label="金額">
                          <span className="tabular-nums">{yen(row.amount)}</span>
                        </Field>
                        <Field label="納期">{order ? formatDate(order.requestedDeliveryDate) : "通常範囲内"}</Field>
                        <Field label="部門">{departmentName(row.department)}</Field>
                        <Field label="依頼者">{row.requester}</Field>
                      </div>

                      {order && (
                        <button
                          type="button"
                          onClick={() => router.push(detailHref(order))}
                          className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-brand-600 hover:underline"
                        >
                          <Icon name="fileText" className="h-4 w-4" />
                          元の{TARGET_LABEL[row.target]}を見る →
                        </button>
                      )}

                      {approval && approval.remindersSent > 0 && (
                        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Icon name="bell" className="h-3.5 w-3.5" />
                          リマインド{approval.remindersSent}回送信済（{approval.lastReminderOnDemoDate}）
                        </p>
                      )}

                      {/* 承認者 (アクション付近に明示) */}
                      <div className="mt-auto space-y-4 border-t border-line pt-5">
                        <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-4 py-3">
                          <span className="ai-gradient flex h-8 w-8 flex-none items-center justify-center rounded-lg text-white shadow-glow-sm">
                            <Icon name="userCheck" className="h-4 w-4" strokeWidth={2} />
                          </span>
                          <div className="leading-tight">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">承認者</div>
                            <div className="text-sm font-semibold text-ink">{row.approverName}</div>
                          </div>
                        </div>

                        {decision ? (
                          <div
                            className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                              decision.status === "approved"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <Icon
                              name={decision.status === "approved" ? "checkCircle" : "refresh"}
                              className="mt-0.5 h-4 w-4 flex-none"
                              strokeWidth={2}
                            />
                            <div>
                              <div className="font-semibold">
                                {decision.status === "approved" ? "承認しました（デモ）" : "差し戻しました（デモ）"}
                              </div>
                              {decision.comment ? (
                                <div className="mt-0.5 text-[13px] opacity-90">コメント：{decision.comment}</div>
                              ) : null}
                            </div>
                          </div>
                        ) : !isRemanding ? (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="success" onClick={() => handleApprove(row)}>
                              <Icon name="checkCircle" className="h-4 w-4" />
                              承認する
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                setOpenComment(row.key);
                                setComment("");
                              }}
                            >
                              <Icon name="refresh" className="h-4 w-4" />
                              差し戻す
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="block text-xs font-medium text-ink-muted">差し戻し理由（任意）</label>
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              rows={3}
                              placeholder="修正してほしい点や差し戻しの理由を記入してください"
                              className="w-full resize-none rounded-lg border border-surface-border bg-surface-input px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                            />
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Button variant="danger" onClick={() => handleRemand(row)}>
                                差し戻しを確定
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setOpenComment(null);
                                  setComment("");
                                }}
                              >
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 対応済み */}
      <div>
        <button
          type="button"
          onClick={() => setShowResolved((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <Icon name="chevronRight" className={`h-3.5 w-3.5 transition-transform ${showResolved ? "rotate-90" : ""}`} />
          対応済み ({resolved.length}件)
        </button>
        {showResolved && (
          <Card className="mt-2">
            {resolved.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-faint">対応済みの案件はありません。</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {resolved.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-ink-soft">
                      {o.customerName ?? "取引先不明"}
                      <span className="ml-2 text-xs text-ink-faint">
                        {o.approval?.status === "approved" ? "承認済み" : "差し戻し済み"}
                        {o.approval?.decisionComment ? `（${o.approval.decisionComment}）` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(detailHref(o))}
                      className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      詳細を見る →
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
