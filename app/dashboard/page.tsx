"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { CHANNEL_LABEL, STATUS_LABEL, detailRoute, yen } from "@/lib/format";
import type { DemoOrder, OrderChannel, OrderStatus } from "@/lib/types";
import { AgentAvatar, StatusBadge } from "@/components/badges";
import { KpiCard } from "@/components/Kpi";
import { Card, HeroBanner, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LineChart, VBarChart, DonutChart, HBarChart, CHART } from "@/components/charts";
import { MONTHLY_HISTORY, cagr, momRate, pctSigned } from "@/lib/dashboard-data";

const CHANNEL_HEX: Record<OrderChannel, string> = {
  fax_image: CHART.brand,
  email_pdf: CHART.navy,
  email_body: CHART.sky,
  slack: CHART.deep,
  teams: CHART.amber,
  edi: CHART.emerald,
  chatwork: CHART.slate,
};

const STATUS_HEX: Partial<Record<OrderStatus, string>> = {
  new: CHART.axis,
  ai_reading: CHART.brand,
  auto_input_completed: CHART.emerald,
  read_completed: CHART.emerald,
  completed: CHART.emerald,
  internal_review_required: CHART.amber,
  customer_action_required: CHART.amber,
  waiting_customer_reply: CHART.amber,
  reply_drafted: CHART.sky,
  quote_drafted: CHART.sky,
  quote_sent: CHART.sky,
  waiting_manager_approval: CHART.sky,
  po_received: CHART.amber,
};

const man = (yenVal: number) => `¥${(yenVal / 10000).toLocaleString()}万`;

export default function Page() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const allUnread = orders.length > 0 && orders.every((o) => !o.isRead);

  // --- 当月ライブ集計 (読取状態に依存) ---
  const kpi = useMemo(() => {
    const read = orders.filter((o) => o.isRead);
    const autoInput = orders.filter((o) => o.status === "auto_input_completed" || o.status === "completed").length;
    const internalWait = read.filter((o) => o.assignedTo === "internal_user").length;
    const customerWait = read.filter((o) => o.assignedTo === "customer").length;
    const monthlyAmount = read.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const autoRate = read.length > 0 ? Math.round((autoInput / read.length) * 100) : 0;
    return { count: orders.length, monthlyAmount, autoInput, autoRate, internalWait, customerWait };
  }, [orders]);

  // --- 成長指標 (過去12ヶ月ダミー実績) ---
  const growth = useMemo(() => {
    const H = MONTHLY_HISTORY;
    const last = H[H.length - 1];
    const prev = H[H.length - 2];
    const first = H[0];
    return {
      amountCagr: cagr(first.amount, last.amount, H.length - 1),
      amountMoM: momRate(prev.amount, last.amount),
      ordersMoM: momRate(prev.orders, last.orders),
      rateDelta: last.autoRate - prev.autoRate,
      savedDelta: last.savedMinutes - prev.savedMinutes,
      last,
      prev,
    };
  }, []);

  const amountTrend = MONTHLY_HISTORY.map((m) => ({ label: m.label, value: m.amount }));
  const ordersTrend = MONTHLY_HISTORY.map((m) => ({ label: m.label, value: m.orders }));

  // KpiCard spark 用の系列
  const amountSpark = MONTHLY_HISTORY.map((m) => m.amount);
  const ordersSpark = MONTHLY_HISTORY.map((m) => m.orders);
  const rateSpark = MONTHLY_HISTORY.map((m) => m.autoRate);

  // --- 構成比・ランキング (当月ライブ) ---
  const channelSlices = useMemo(() => {
    const counts = new Map<OrderChannel, number>();
    for (const o of orders) counts.set(o.channel, (counts.get(o.channel) ?? 0) + 1);
    return (Object.keys(CHANNEL_LABEL) as OrderChannel[])
      .filter((c) => (counts.get(c) ?? 0) > 0)
      .map((c) => ({ label: CHANNEL_LABEL[c], value: counts.get(c) ?? 0, color: CHANNEL_HEX[c] }));
  }, [orders]);

  const statusBars = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    return Array.from(counts.entries()).map(([s, v]) => ({
      label: STATUS_LABEL[s],
      value: v,
      color: STATUS_HEX[s] ?? CHART.brand,
    }));
  }, [orders]);

  const customerBars = useMemo(() => {
    const read = orders.filter((o) => o.isRead && o.totalAmount !== null);
    const byCustomer = new Map<string, number>();
    for (const o of read) byCustomer.set(o.customerName ?? "取引先不明", (byCustomer.get(o.customerName ?? "取引先不明") ?? 0) + (o.totalAmount ?? 0));
    return Array.from(byCustomer.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, color: CHART.brand }));
  }, [orders]);

  // --- リスト ---
  const internalList = useMemo(() => orders.filter((o) => o.isRead && o.assignedTo === "internal_user"), [orders]);
  const customerList = useMemo(() => orders.filter((o) => o.isRead && o.assignedTo === "customer"), [orders]);
  const highValueList = useMemo(
    () => [...orders].filter((o) => o.isRead && o.totalAmount !== null).sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0)).slice(0, 5),
    [orders],
  );

  return (
    <div className="space-y-8">
      <HeroBanner
        eyebrow="MONTHLY ANALYTICS"
        title="月次ダッシュボード"
        description="AIによる受注処理の成果と受注状況を可視化します。対象期間：2025年8月 〜 2026年7月（当月）。"
        right={
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 text-right">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8FB0CC]">読取済 受注金額</div>
            <div className="mt-1 text-[26px] font-bold leading-none tabular-nums text-white">{yen(kpi.monthlyAmount)}</div>
            <div className="mt-1.5 text-[12px] tabular-nums text-[#B7C7D8]">
              当月 {kpi.count}件 ・ AI自動処理 {kpi.autoInput}件
            </div>
          </div>
        }
      />

      {allUnread ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-ink-soft">
          <AgentAvatar size="h-8 w-8" />
          <span>受注一覧で「AIで受注を取り込む」を実行すると、当月の構成比・ランキングにも反映されます（推移は過去実績を表示）。</span>
        </div>
      ) : null}

      {/* 成長サマリー */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <GrowthCard label="受注金額 年率成長率 (CAGR)" value={pctSigned(growth.amountCagr)} caption="過去12ヶ月・年率換算" positive={growth.amountCagr >= 0} />
        <GrowthCard label="受注金額 前月比" value={pctSigned(growth.amountMoM)} caption={`${man(growth.prev.amount)} → ${man(growth.last.amount)}`} positive={growth.amountMoM >= 0} />
        <GrowthCard label="受注件数 前月比" value={pctSigned(growth.ordersMoM)} caption={`${growth.prev.orders}件 → ${growth.last.orders}件`} positive={growth.ordersMoM >= 0} />
        <GrowthCard label="AI自動処理率 前月差" value={`${growth.rateDelta >= 0 ? "+" : ""}${growth.rateDelta}pt`} caption={`${growth.prev.autoRate}% → ${growth.last.autoRate}%`} positive={growth.rateDelta >= 0} />
      </div>

      {/* 当月KPI */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="当月の受注件数"
          value={`${kpi.count}件`}
          tone="brand"
          icon={<Icon name="fileText" className="h-[18px] w-[18px]" />}
          spark={ordersSpark}
          trend={{ dir: growth.ordersMoM >= 0 ? "up" : "down", value: pctSigned(growth.ordersMoM) }}
        />
        <KpiCard
          label="当月の受注金額（読取済）"
          value={yen(kpi.monthlyAmount)}
          tone="default"
          icon={<Icon name="yen" className="h-[18px] w-[18px]" />}
          spark={amountSpark}
          trend={{ dir: growth.amountMoM >= 0 ? "up" : "down", value: pctSigned(growth.amountMoM) }}
        />
        <KpiCard
          label="AI自動処理完了"
          value={`${kpi.autoInput}件`}
          tone="emerald"
          icon={<Icon name="checkCircle" className="h-[18px] w-[18px]" />}
          sub={kpi.autoRate > 0 ? `読取済の${kpi.autoRate}%` : "AI読み取り待ち"}
          spark={rateSpark}
          trend={{ dir: growth.rateDelta >= 0 ? "up" : "down", value: `${growth.rateDelta >= 0 ? "+" : ""}${growth.rateDelta}pt` }}
        />
        <KpiCard label="人の確認が必要" value={`${kpi.internalWait + kpi.customerWait}件`} tone="amber" icon={<Icon name="userCheck" className="h-[18px] w-[18px]" />} />
      </div>

      {/* 受注金額の推移 + 要因分析 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            sub="月次の受注金額（過去12ヶ月）"
            right={
              <div className="flex items-center gap-2">
                <TrendPill positive={growth.amountMoM >= 0}>前月比 {pctSigned(growth.amountMoM)}</TrendPill>
                <span className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[12px] font-medium text-brand-700">
                  CAGR {pctSigned(growth.amountCagr)}
                </span>
              </div>
            }
          >
            受注金額の推移
          </SectionTitle>
          <LineChart data={amountTrend} color={CHART.brand} format={(v) => man(v)} />
        </Card>

        <Card>
          <SectionTitle sub="前月からの変化と主因">要因分析</SectionTitle>
          <FactorAnalysis growth={growth} />
        </Card>
      </div>

      {/* 受注件数の推移 + チャネル構成 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            sub="月次の受注件数（過去12ヶ月）"
            right={<TrendPill positive={growth.ordersMoM >= 0}>前月比 {pctSigned(growth.ordersMoM)}</TrendPill>}
          >
            受注件数の推移
          </SectionTitle>
          <VBarChart data={ordersTrend} color={CHART.sky} format={(v) => `${v}件`} />
        </Card>

        <Card>
          <SectionTitle sub="当月・受信チャネルの構成比">チャネル別構成</SectionTitle>
          {channelSlices.length > 0 ? (
            <DonutChart data={channelSlices} centerValue={String(orders.length)} centerLabel="受注" />
          ) : (
            <p className="py-6 text-center text-sm text-ink-faint">集計対象がありません</p>
          )}
        </Card>
      </div>

      {/* ステータス別 + 取引先別 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="当月・全受注のステータス分布">ステータス別件数</SectionTitle>
          <HBarChart data={statusBars} format={(v) => `${v}件`} emptyLabel="集計対象がありません" />
        </Card>
        <Card>
          <SectionTitle sub="読取済・取引先別 受注金額（上位）">取引先別受注金額</SectionTitle>
          <HBarChart data={customerBars} format={(v) => yen(v)} emptyLabel="読取済の受注がありません" />
        </Card>
      </div>

      {/* 対応待ちリスト */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ListCard title="自社対応待ち案件" sub="担当者の確認・補完が必要" orders={internalList} onOpen={(o) => router.push(detailRoute(o))} />
        <ListCard title="相手先対応待ち案件" sub="相手先からの返信待ち" orders={customerList} onOpen={(o) => router.push(detailRoute(o))} />
        <ListCard title="高額受注案件" sub="読取済・受注金額 上位5件" orders={highValueList} onOpen={(o) => router.push(detailRoute(o))} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function GrowthCard({ label, value, caption, positive }: { label: string; value: string; caption: string; positive: boolean }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5">
      <div className="text-[13px] font-medium text-ink-muted">{label}</div>
      <div className={`mt-2 flex items-center gap-1.5 text-[28px] font-bold leading-none tracking-tight tabular-nums ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        <Icon name="trendingUp" className={`h-5 w-5 ${positive ? "" : "rotate-180"}`} strokeWidth={2.2} />
        {value}
      </div>
      <div className="mt-2 text-xs tabular-nums text-ink-muted">{caption}</div>
    </div>
  );
}

function TrendPill({ positive, children }: { positive: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-medium ${positive ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-600"}`}>
      <Icon name="trendingUp" className={`h-3.5 w-3.5 ${positive ? "" : "rotate-180"}`} />
      {children}
    </span>
  );
}

function FactorAnalysis({
  growth,
}: {
  growth: { amountMoM: number; ordersMoM: number; rateDelta: number; savedDelta: number; last: { amount: number }; prev: { amount: number } };
}) {
  const amtDiff = growth.last.amount - growth.prev.amount;
  const factors = [
    {
      icon: "trendingUp" as const,
      tone: "emerald" as const,
      title: `受注金額 ${pctSigned(growth.amountMoM)}（${amtDiff >= 0 ? "+" : ""}${man(amtDiff)}）`,
      body: "高単価案件（株式会社東京ストア）の受注と、メール／FAX経由の取り込み増加が主因。",
    },
    {
      icon: "gauge" as const,
      tone: "brand" as const,
      title: `AI自動処理率 +${growth.rateDelta}pt`,
      body: "商品マスタ照合・料金算出ロジックの精度向上により、確認待ち件数が減少。",
    },
    {
      icon: "clock" as const,
      tone: "info" as const,
      title: `削減時間 +${growth.savedDelta}分`,
      body: "自動処理率の上昇に連動し、手作業の入力・照合時間が減少。処理リードタイムも短縮。",
    },
  ];
  const toneCls: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    brand: "bg-brand-50 text-brand-600",
    info: "bg-brand-50 text-brand-600",
  };
  return (
    <div className="space-y-3">
      {factors.map((f, i) => (
        <div key={i} className="flex gap-3">
          <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${toneCls[f.tone]}`}>
            <Icon name={f.icon} className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink">{f.title}</div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        </div>
      ))}
      <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-ink-faint">
        ※ 推移・成長率はデモ用の想定実績（過去12ヶ月）に基づく参考値です。
      </p>
    </div>
  );
}

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
        <SectionTitle sub={sub} right={<span className="text-[13px] font-semibold tabular-nums text-ink-muted">{orders.length}件</span>}>
          {title}
        </SectionTitle>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-faint">該当なし</p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOpen(o)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-sunken"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">
                    {o.customerName ?? <span className="text-rose-600">取引先不明</span>}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{yen(o.totalAmount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
