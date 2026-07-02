"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import {
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  detailRoute,
  formatDate,
  yen,
} from "@/lib/format";
import type { DemoOrder, ExceptionType, OrderChannel, OrderStatus } from "@/lib/types";
import { AgentAvatar, StatusBadge } from "@/components/badges";
import { KpiCard } from "@/components/Kpi";
import { Card, SectionTitle } from "@/components/ui";

// ------------------------------------------------------------
// SCR-005 月次ダッシュボード
//   すべてクライアント側集計。読取済(isRead)案件のみ金額集計に反映。
// ------------------------------------------------------------

type BarRow = { label: string; value: number; colorClass: string };

const EXCEPTION_LABEL: Record<Exclude<ExceptionType, null>, string> = {
  ocr_failed: "読み取り失敗",
  partial_missing: "一部虫食い",
  customer_missing_info: "相手先不備",
  validation_error: "バリデーションエラー",
};

const EXCEPTION_COLOR: Record<Exclude<ExceptionType, null>, string> = {
  ocr_failed: "bg-red-500",
  partial_missing: "bg-amber-500",
  customer_missing_info: "bg-red-400",
  validation_error: "bg-amber-400",
};

const CHANNEL_COLOR: Record<OrderChannel, string> = {
  fax_image: "bg-brand-500",
  email_pdf: "bg-brand-400",
  email_body: "bg-indigo-400",
  slack: "bg-purple-400",
  teams: "bg-indigo-500",
  edi: "bg-emerald-500",
};

const AMOUNT_BAR = "bg-brand-500";

export default function Page() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);

  const allUnread = orders.length > 0 && orders.every((o) => !o.isRead);

  // --- KPI 集計 ---
  const kpi = useMemo(() => {
    const read = orders.filter((o) => o.isRead);
    const autoInput = orders.filter(
      (o) => o.status === "auto_input_completed" || o.status === "completed",
    ).length;
    const internalWait = read.filter((o) => o.assignedTo === "internal_user").length;
    const customerWait = read.filter((o) => o.assignedTo === "customer").length;
    const ocrFailed = read.filter((o) => o.exceptionType === "ocr_failed").length;
    const monthlyAmount = read.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const autoRate = Math.round((autoInput / Math.max(1, orders.length)) * 100);
    const savedMinutes = autoInput * 10;
    return {
      count: orders.length,
      monthlyAmount,
      autoInput,
      autoRate,
      internalWait,
      customerWait,
      ocrFailed,
      savedMinutes,
    };
  }, [orders]);

  // --- グラフ集計 ---
  const statusRows = useMemo<BarRow[]>(() => {
    const order: OrderStatus[] = [
      "new",
      "ai_reading",
      "read_completed",
      "auto_input_completed",
      "internal_review_required",
      "customer_action_required",
      "reply_drafted",
      "waiting_customer_reply",
      "completed",
    ];
    const counts = new Map<OrderStatus, number>();
    for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    return order
      .filter((s) => (counts.get(s) ?? 0) > 0)
      .map((s) => ({
        label: STATUS_LABEL[s],
        value: counts.get(s) ?? 0,
        colorClass: STATUS_STYLE[s].dot,
      }));
  }, [orders]);

  const channelRows = useMemo<BarRow[]>(() => {
    const counts = new Map<OrderChannel, number>();
    for (const o of orders) counts.set(o.channel, (counts.get(o.channel) ?? 0) + 1);
    return (Object.keys(CHANNEL_LABEL) as OrderChannel[])
      .filter((c) => (counts.get(c) ?? 0) > 0)
      .map((c) => ({
        label: CHANNEL_LABEL[c],
        value: counts.get(c) ?? 0,
        colorClass: CHANNEL_COLOR[c],
      }));
  }, [orders]);

  const dailyAmountRows = useMemo<BarRow[]>(() => {
    const read = orders.filter((o) => o.isRead);
    const byDate = new Map<string, number>();
    for (const o of read) {
      const key = formatDate(o.receivedAt);
      byDate.set(key, (byDate.get(key) ?? 0) + (o.totalAmount ?? 0));
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([label, value]) => ({ label, value, colorClass: AMOUNT_BAR }));
  }, [orders]);

  const customerAmountRows = useMemo<BarRow[]>(() => {
    const read = orders.filter((o) => o.isRead);
    const byCustomer = new Map<string, number>();
    for (const o of read) {
      const key = o.customerName ?? "取引先不明";
      byCustomer.set(key, (byCustomer.get(key) ?? 0) + (o.totalAmount ?? 0));
    }
    return Array.from(byCustomer.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, colorClass: "bg-brand-400" }));
  }, [orders]);

  const errorRows = useMemo<BarRow[]>(() => {
    const counts = new Map<Exclude<ExceptionType, null>, number>();
    for (const o of orders) {
      if (o.isRead && o.exceptionType) {
        counts.set(o.exceptionType, (counts.get(o.exceptionType) ?? 0) + 1);
      }
    }
    return (Object.keys(EXCEPTION_LABEL) as Array<Exclude<ExceptionType, null>>)
      .filter((e) => (counts.get(e) ?? 0) > 0)
      .map((e) => ({
        label: EXCEPTION_LABEL[e],
        value: counts.get(e) ?? 0,
        colorClass: EXCEPTION_COLOR[e],
      }));
  }, [orders]);

  // --- リスト集計 ---
  const readOrders = useMemo(() => orders.filter((o) => o.isRead), [orders]);
  const internalList = useMemo(
    () => orders.filter((o) => o.isRead && o.assignedTo === "internal_user"),
    [orders],
  );
  const customerList = useMemo(
    () => orders.filter((o) => o.isRead && o.assignedTo === "customer"),
    [orders],
  );
  const highValueList = useMemo(
    () =>
      [...readOrders]
        .filter((o) => o.totalAmount !== null)
        .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
        .slice(0, 5),
    [readOrders],
  );

  return (
    <div className="space-y-6">
      {/* ページヘッダ */}
      <div>
        <h1 className="text-xl font-bold text-ink">月次ダッシュボード</h1>
        <p className="mt-1 text-sm text-ink-muted">2026年7月</p>
      </div>

      {/* 未読案内バナー */}
      {allUnread ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <AgentAvatar size="h-8 w-8" />
          <span>
            受注一覧で「AIで一括読み取り」を実行すると、集計がここに反映されます。
          </span>
        </div>
      ) : null}

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="月次受注件数" value={kpi.count} tone="brand" icon="🧾" />
        <KpiCard label="月次受注金額" value={<span className="gradient-text">{yen(kpi.monthlyAmount)}</span>} tone="default" icon="💴" />
        <KpiCard label="自動入力完了件数" value={kpi.autoInput} tone="emerald" icon="✅" />
        <KpiCard label="自動処理率" value={`${kpi.autoRate}%`} tone="emerald" icon="⚙️" />
        <KpiCard label="自社対応待ち件数" value={kpi.internalWait} tone="amber" icon="🧑‍💼" />
        <KpiCard label="相手先対応待ち件数" value={kpi.customerWait} tone="red" icon="📨" />
        <KpiCard label="読み取り失敗件数" value={kpi.ocrFailed} tone="red" icon="⚠️" />
        <KpiCard
          label="AI削減見込み時間"
          value={<span className="gradient-text">{`${kpi.savedMinutes}分`}</span>}
          sub="自動入力1件あたり約10分換算"
          tone="emerald"
          icon="⏱️"
        />
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="現在の全受注のステータス分布">ステータス別件数</SectionTitle>
          <BarChart rows={statusRows} unit="件" emptyLabel="集計対象がありません" />
        </Card>

        <Card>
          <SectionTitle sub="受信チャネルごとの受注件数">チャネル別件数</SectionTitle>
          <BarChart rows={channelRows} unit="件" emptyLabel="集計対象がありません" />
        </Card>

        <Card>
          <SectionTitle sub="読取済案件の受信日別 受注金額">日別受注金額</SectionTitle>
          <BarChart rows={dailyAmountRows} money emptyLabel="読取済の受注がありません" />
        </Card>

        <Card>
          <SectionTitle sub="読取済案件の取引先別 受注金額（降順）">取引先別受注金額</SectionTitle>
          <BarChart rows={customerAmountRows} money emptyLabel="読取済の受注がありません" />
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle sub="AIが検出した不備の種別内訳">エラー種別内訳</SectionTitle>
          <BarChart rows={errorRows} unit="件" emptyLabel="不備のある案件はありません" />
        </Card>
      </div>

      {/* リスト (§6.5) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ListCard
          title="自社対応待ち案件"
          sub="担当者の確認・補完が必要"
          orders={internalList}
          onOpen={(o) => router.push(detailRoute(o))}
        />
        <ListCard
          title="相手先対応待ち案件"
          sub="相手先からの返信待ち"
          orders={customerList}
          onOpen={(o) => router.push(detailRoute(o))}
        />
        <ListCard
          title="高額受注案件"
          sub="読取済・受注金額 上位5件"
          orders={highValueList}
          onOpen={(o) => router.push(detailRoute(o))}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 横棒グラフ (チャートライブラリ不使用・div実装)
// ------------------------------------------------------------

function BarChart({
  rows,
  unit,
  money,
  emptyLabel = "データがありません",
}: {
  rows: BarRow[];
  unit?: string;
  money?: boolean;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const pct = Math.max(2, Math.round((r.value / max) * 100));
        const valueText = money ? yen(r.value) : `${r.value.toLocaleString()}${unit ?? ""}`;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-ink-soft" title={r.label}>
              {r.label}
            </span>
            <div className="flex h-5 flex-1 items-center rounded-md bg-surface-sunken">
              <div
                className={`h-5 rounded-md ${r.colorClass} transition-all`}
                style={{ width: `${pct}%` }}
              />
              <span className="ml-2 whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
                {valueText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// 案件リストカード
// ------------------------------------------------------------

function ListCard({
  title,
  sub,
  orders,
  onOpen,
}: {
  title: string;
  sub?: string;
  orders: DemoOrder[];
  onOpen: (o: DemoOrder) => void;
}) {
  return (
    <Card padded={false} className="flex flex-col">
      <div className="border-b border-surface-border px-5 pb-3 pt-5">
        <SectionTitle sub={sub} right={<span className="text-xs font-semibold tabular-nums text-ink-muted">{orders.length}件</span>}>
          {title}
        </SectionTitle>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-faint">該当なし</p>
      ) : (
        <ul className="divide-y divide-surface-border">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOpen(o)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">
                    {o.customerName ?? <span className="text-red-500">取引先不明</span>}
                  </div>
                  <div className="mt-0.5">
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {yen(o.totalAmount)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
