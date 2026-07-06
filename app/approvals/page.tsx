"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Card, SectionTitle, Button } from "@/components/ui";
import { DemoClockControl } from "@/components/DemoClockControl";
import { businessDaysBetween } from "@/lib/business-days";
import type { DemoOrder, ReminderChannel } from "@/lib/types";

const TARGET_LABEL: Record<string, string> = { quote: "見積書", order: "受注内容", po: "発注書" };
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

export default function ApprovalsPage() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const demoDate = useOrderStore((s) => s.demoDate);
  const reminderSettings = useOrderStore((s) => s.reminderSettings);
  const setReminderChannel = useOrderStore((s) => s.setReminderChannel);
  const setReminderThreshold = useOrderStore((s) => s.setReminderThreshold);
  const approveRequest = useOrderStore((s) => s.approveRequest);
  const remandRequest = useOrderStore((s) => s.remandRequest);

  const [openComment, setOpenComment] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const waiting = useMemo(() => {
    return orders
      .filter((o) => o.approval?.status === "waiting")
      .map((o) => ({ order: o, elapsed: businessDaysBetween(o.approval!.requestedOnDemoDate, demoDate) }))
      .sort((a, b) => b.elapsed - a.elapsed);
  }, [orders, demoDate]);

  const resolved = useMemo(
    () => orders.filter((o) => o.approval && o.approval.status !== "waiting"),
    [orders],
  );

  function detailHref(order: DemoOrder): string {
    if (order.approval?.target === "quote") return `/orders/${order.id}/quote`;
    if (order.approval?.target === "po") return `/orders/${order.id}/po`;
    return `/orders/${order.id}/read`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">上長確認待ち</h1>
        <p className="mt-1 text-sm text-ink-muted">
          経理が送付・登録する前に、上長が内容を確認します。依頼から一定の営業日が経過すると自動でリマインドが送信されます。
        </p>
      </div>

      <Card>
        <SectionTitle sub="経過営業日でのリマインド送信を設定します">⚙️ 自動リマインド設定</SectionTitle>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            リマインド送信ツール
            <select
              value={reminderSettings.channel}
              onChange={(e) => setReminderChannel(e.target.value as ReminderChannel)}
              className="rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {CHANNEL_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            経過営業日
            <select
              value={reminderSettings.thresholdBusinessDays}
              onChange={(e) => setReminderThreshold(Number(e.target.value) as 1 | 2 | 3 | 5)}
              className="rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {THRESHOLD_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ink-muted">
            依頼から{reminderSettings.thresholdBusinessDays}営業日経過した案件に、{CHANNEL_OPTIONS.find((c) => c[0] === reminderSettings.channel)?.[1]}で自動リマインドします。
          </p>
        </div>
      </Card>

      <DemoClockControl />

      <Card padded={false} className="p-5">
        <SectionTitle sub="上長の承認が必要な案件">上長確認待ち ({waiting.length}件)</SectionTitle>
        {waiting.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">現在、確認待ちの案件はありません。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {waiting.map(({ order, elapsed }) => {
              const overdue = elapsed >= reminderSettings.thresholdBusinessDays;
              const approval = order.approval!;
              return (
                <div key={order.id} className="rounded-xl border border-surface-border bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {order.customerName ?? "取引先不明"} / {TARGET_LABEL[approval.target]}の承認
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        overdue ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {overdue ? "⚠️ " : ""}経過 {elapsed}営業日
                    </span>
                    {approval.remindersSent > 0 && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                        📨 リマインド{approval.remindersSent}回送信済（{approval.lastReminderOnDemoDate}）
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    依頼日: {approval.requestedOnDemoDate} ・ 依頼者コメント: {approval.requesterNote || "（なし）"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(detailHref(order))}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      {TARGET_LABEL[approval.target]}を見る →
                    </button>
                    <div className="ml-auto flex gap-2">
                      <Button variant="success" size="sm" onClick={() => approveRequest(order.id, comment)}>
                        ✓ 承認する
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenComment(openComment === order.id ? null : order.id)}
                      >
                        ↩ 差し戻す
                      </Button>
                    </div>
                  </div>

                  {openComment === order.id && (
                    <div className="mt-3 flex gap-2 rounded-lg border border-surface-border bg-surface-sunken p-3">
                      <input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="差し戻し理由（任意）"
                        className="flex-1 rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          remandRequest(order.id, comment);
                          setOpenComment(null);
                          setComment("");
                        }}
                      >
                        差し戻す
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div>
        <button
          type="button"
          onClick={() => setShowResolved((v) => !v)}
          className="text-xs font-medium text-ink-muted hover:text-ink"
        >
          {showResolved ? "▲" : "▼"} 対応済み ({resolved.length}件)
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
                        {o.approval?.status === "approved" ? "✓ 承認済み" : "↩ 差し戻し済み"}
                        {o.approval?.decisionComment ? `（${o.approval.decisionComment}）` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(detailHref(o))}
                      className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
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
