"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import {
  CHANNEL_LABEL,
  CHANNEL_ICON,
  STATUS_LABEL,
  ASSIGNEE_LABEL,
  formatDate,
  formatDateTime,
  yen,
} from "@/lib/format";
import type { AssigneeType, DemoOrder, OrderChannel, OrderStatus } from "@/lib/types";
import { AssigneeBadge, CategoryBadge, StatusBadge } from "@/components/badges";
import { KpiCard } from "@/components/Kpi";
import { Button, Card, PageHeader } from "@/components/ui";
import { ProcessPipeline, type PipelineStage } from "@/components/ai";
import { DetailDrawer } from "@/components/DetailDrawer";
import { Icon } from "@/components/icons";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 分を「X時間Y分」表記に */
function fmtDuration(min: number): string {
  if (min <= 0) return "0分";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

export default function OrdersPage() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const markReading = useOrderStore((s) => s.markReading);
  const revealOrder = useOrderStore((s) => s.revealOrder);
  const addAlerts = useOrderStore((s) => s.addAlerts);
  const alerts = useOrderStore((s) => s.alerts);
  const pendingAlertCount = useOrderStore((s) => s.alerts.filter((a) => a.status === "pending").length);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeType | "all">("all");
  const [search, setSearch] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const unreadCount = orders.filter((o) => !o.isRead).length;

  // KPI (§7-2: 最重要4指標)
  const kpi = useMemo(() => {
    const read = orders.filter((o) => o.isRead);
    const autoInput = orders.filter(
      (o) => o.status === "auto_input_completed" || o.status === "completed",
    ).length;
    const humanReview = read.filter((o) => o.exceptionType !== null).length;
    const savedMinutes = read.length * 12; // 手作業換算: 1件あたり約12分
    const autoRate = read.length > 0 ? Math.round((autoInput / read.length) * 100) : 0;
    const monthlyAmount = read.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    return { received: orders.length, autoInput, humanReview, savedMinutes, autoRate, monthlyAmount };
  }, [orders]);

  // 処理パイプライン (§7-3)
  const pipeline = useMemo<PipelineStage[]>(() => {
    const read = orders.filter((o) => o.isRead);
    const matched = read.filter((o) => o.exceptionType === null);
    const registered = orders.filter(
      (o) => o.status === "auto_input_completed" || o.status === "completed",
    );
    const done = orders.filter((o) => o.status === "completed" || o.status === "auto_input_completed");
    return [
      { key: "received", label: "受付", count: orders.length },
      { key: "read", label: "読み取り", count: read.length },
      { key: "matched", label: "照合", count: matched.length },
      { key: "registered", label: "登録", count: registered.length },
      { key: "done", label: "完了", count: done.length },
    ];
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        if (channelFilter !== "all" && o.channel !== channelFilter) return false;
        if (assigneeFilter !== "all" && o.assignedTo !== assigneeFilter) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const hay = `${o.customerName ?? ""} ${o.items[0]?.productName ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [orders, statusFilter, channelFilter, assigneeFilter, search],
  );

  const filtersActive =
    statusFilter !== "all" || channelFilter !== "all" || assigneeFilter !== "all" || search.trim() !== "";

  async function runBulkRead() {
    const ids = orders.filter((o) => !o.isRead).map((o) => o.id);
    if (ids.length === 0) return;
    setBulkRunning(true);
    for (const id of ids) {
      markReading(id);
      await sleep(180);
    }
    await sleep(300);
    for (const id of ids) {
      revealOrder(id);
      await sleep(260);
    }
    setBulkRunning(false);
  }

  async function importFrom(endpoint: string, label: string) {
    setImporting(label);
    setImportNote(null);
    try {
      const knownThreadKeys = [
        ...alerts.map((a) => a.thread.threadKey),
        ...orders.map((o) => o.threadKey).filter((k): k is string => !!k),
      ];
      const res = await fetch(`/api/ingest/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knownThreadKeys }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportNote(`${label}取り込みエラー: ${data.error ?? res.status}`);
        return;
      }
      const added = addAlerts(data.alerts ?? []);
      setImportNote(
        added > 0
          ? `${label}から受注らしい会話を${added}件検知しました。「受注アラート」で確認してください。`
          : (data.scanned ?? 0) > 0
            ? `${label}に新着はありません（すべて確認済みです）。`
            : `${label}に受注らしい会話は見つかりませんでした。`,
      );
    } catch {
      setImportNote(`${label}取り込みエラー: サーバーに接続できませんでした。`);
    } finally {
      setImporting(null);
    }
  }

  const statusOptions = Array.from(new Set(orders.map((o) => o.status)));

  function resetFilters() {
    setStatusFilter("all");
    setChannelFilter("all");
    setAssigneeFilter("all");
    setSearch("");
  }

  return (
    <div className="space-y-8">
      {/* ページヘッダ */}
      <PageHeader
        title="受注一覧"
        description="メール・FAX・チャット・EDIから届いた注文を、AIが自動で読み取り・分類します。"
        actions={
          <>
            <div className="hidden items-center gap-1 rounded-lg border border-surface-border bg-surface p-1 sm:flex">
              <span className="pl-2 pr-1 text-[11px] font-medium text-ink-muted">取り込み元</span>
              {[
                ["chatwork", "Chatwork"],
                ["slack", "Slack"],
                ["gmail", "メール"],
              ].map(([ep, label]) => (
                <button
                  key={ep}
                  onClick={() => importFrom(ep, label)}
                  disabled={importing !== null}
                  className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink disabled:opacity-40"
                >
                  {importing === label ? "確認中…" : label}
                </button>
              ))}
            </div>
            <Button
              size="lg"
              variant="ai"
              className={bulkRunning ? "ai-gradient-anim" : ""}
              onClick={runBulkRead}
              disabled={bulkRunning || unreadCount === 0}
            >
              {bulkRunning ? (
                <>
                  <Spinner /> AIが読み取り中…
                </>
              ) : (
                <>
                  <Icon name="sparkles" className="h-[18px] w-[18px]" /> AIで受注を取り込む
                  {unreadCount > 0 ? `（${unreadCount}）` : ""}
                </>
              )}
            </Button>
          </>
        }
      />

      {/* KPI 4指標 */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="本日の受注"
          value={`${kpi.received}件`}
          tone="brand"
          icon={<Icon name="inbox" className="h-[18px] w-[18px]" />}
          sub="メール・FAX・チャット・EDI"
        />
        <KpiCard
          label="AI自動処理完了"
          value={`${kpi.autoInput}件`}
          tone="emerald"
          icon={<Icon name="checkCircle" className="h-[18px] w-[18px]" />}
          sub={kpi.autoRate > 0 ? `読取済の${kpi.autoRate}%を自動処理` : "AI読み取り待ち"}
        />
        <KpiCard
          label="人の確認が必要"
          value={`${kpi.humanReview}件`}
          tone="amber"
          icon={<Icon name="userCheck" className="h-[18px] w-[18px]" />}
          sub={kpi.humanReview > 0 ? "要確認項目あり" : "確認事項なし"}
        />
        <KpiCard
          label="本日の削減時間"
          value={fmtDuration(kpi.savedMinutes)}
          tone="info"
          icon={<Icon name="clock" className="h-[18px] w-[18px]" />}
          sub="手作業換算・1件あたり約12分"
        />
      </div>

      {/* 処理状況サマリー */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-soft">処理状況</h2>
          <span className="text-xs text-ink-muted">
            本日の受注金額（読取済）
            <span className="ml-2 font-semibold tabular-nums text-ink">{yen(kpi.monthlyAmount)}</span>
          </span>
        </div>
        <ProcessPipeline stages={pipeline} />
      </div>

      {/* AI検知アラート (§7-4) */}
      {pendingAlertCount > 0 && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] px-5 py-4 sm:flex-row sm:items-center">
          <span className="ai-gradient flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white shadow-glow-sm">
            <Icon name="sparkles" className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">
              AIが未登録の受注候補を{pendingAlertCount}件検知しました
            </p>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              チャット・メールの会話内容を確認し、受注として取り込むか判断してください。
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push("/alerts")}>
            候補を確認
            <Icon name="chevronRight" className="h-4 w-4" />
          </Button>
        </div>
      )}

      {importNote && (
        <div className="rounded-lg border border-info-500/30 bg-info-500/10 px-4 py-3 text-sm text-info-300">
          {importNote}
        </div>
      )}

      {/* フィルターツールバー (§7-5) */}
      <Card padded={false} className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Icon name="inbox" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="取引先・商品名で検索"
              className="h-10 w-full rounded-lg border border-surface-border bg-surface-input pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-500"
            />
          </div>
          <FilterSelect
            label="ステータス"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as OrderStatus | "all")}
            options={[["all", "すべて"], ...statusOptions.map((s) => [s, STATUS_LABEL[s]] as [string, string])]}
          />
          <FilterSelect
            label="チャネル"
            value={channelFilter}
            onChange={(v) => setChannelFilter(v as OrderChannel | "all")}
            options={[["all", "すべて"], ...(Object.keys(CHANNEL_LABEL) as OrderChannel[]).map((c) => [c, CHANNEL_LABEL[c]] as [string, string])]}
          />
          <FilterSelect
            label="対応者"
            value={assigneeFilter}
            onChange={(v) => setAssigneeFilter(v as AssigneeType | "all")}
            options={[
              ["all", "すべて"],
              ["ai", ASSIGNEE_LABEL.ai],
              ["internal_user", ASSIGNEE_LABEL.internal_user],
              ["customer", ASSIGNEE_LABEL.customer],
              ["none", ASSIGNEE_LABEL.none],
            ]}
          />
          {filtersActive && (
            <button
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <Icon name="refresh" className="h-3.5 w-3.5" /> リセット
            </button>
          )}
          <div className="ml-auto text-[13px] text-ink-muted">
            全 {orders.length} 件中 <span className="font-semibold text-ink">{filtered.length}</span> 件
          </div>
        </div>
      </Card>

      {/* 受注一覧テーブル (§7-6) */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                <Th>受信日時</Th>
                <Th>取引先</Th>
                <Th>商品</Th>
                <Th className="text-right">受注金額</Th>
                <Th>ステータス</Th>
                <Th>次に必要な対応</Th>
                <Th>対応者</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id} order={o} onOpen={() => setDrawerId(o.id)} />
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-ink-muted">
                    条件に合致する受注がありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 詳細ドロワー (§7-6) */}
      <DetailDrawer order={orders.find((o) => o.id === drawerId) ?? null} onClose={() => setDrawerId(null)} />
    </div>
  );
}

function OrderRow({ order, onOpen }: { order: DemoOrder; onOpen: () => void }) {
  const reading = order.status === "ai_reading";

  return (
    <tr
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className={`cursor-pointer border-b border-line-subtle transition-colors last:border-0 hover:bg-white/[0.03] focus:bg-white/[0.03] focus:outline-none ${order.isRead ? "row-reveal" : ""}`}
    >
      <Td className="whitespace-nowrap text-ink-muted">{formatDateTime(order.receivedAt)}</Td>

      {!order.isRead ? (
        <>
          <Td>
            <div className="flex items-center gap-2">
              <span className="text-ink-faint" aria-hidden>{CHANNEL_ICON[order.channel]}</span>
              <span className="text-ink-faint">AI未読取</span>
            </div>
          </Td>
          <Td>{reading ? <Skeleton w="w-40" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td className="text-right">{reading ? <Skeleton w="w-16" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td><StatusBadge status={order.status} animated={reading} /></Td>
          <Td>
            <span className="text-[13px] text-ink-faint">{reading ? "AIが読み取り中…" : "AI読み取り待ち"}</span>
          </Td>
          <Td><span className="text-ink-faint">—</span></Td>
        </>
      ) : (
        <>
          <Td>
            <div className="flex items-center gap-2">
              <span className="text-ink-faint" aria-hidden title={CHANNEL_LABEL[order.channel]}>
                {CHANNEL_ICON[order.channel]}
              </span>
              <span className="max-w-[160px] truncate font-medium text-ink" title={order.customerName ?? ""}>
                {order.customerName ?? <span className="text-rose-400">未取得</span>}
              </span>
            </div>
          </Td>
          <Td className="max-w-[180px] truncate text-ink-soft" title={order.items[0]?.productName ?? ""}>
            {order.items[0]?.productName ?? <span className="text-rose-400">未取得</span>}
            {order.items.length > 1 ? <span className="ml-1 text-xs text-ink-muted">他{order.items.length - 1}件</span> : null}
          </Td>
          <Td className="whitespace-nowrap text-right font-semibold tabular-nums text-ink">{yen(order.totalAmount)}</Td>
          <Td><StatusBadge status={order.status} /></Td>
          <Td className="max-w-[220px]"><NextActionCell order={order} /></Td>
          <Td><AssigneeBadge assignee={order.assignedTo} /></Td>
        </>
      )}
    </tr>
  );
}

/** 次に必要な対応 (不備は要約表示) */
function NextActionCell({ order }: { order: DemoOrder }) {
  if (order.exceptionType) {
    const count = order.missingFields.length + order.validationErrors.length;
    const summary =
      order.validationErrors[0]?.message ??
      (order.missingFields.length > 0
        ? `${order.missingFields.map((m) => m.fieldLabel).join("・")}を要確認`
        : order.recommendedAction);
    return (
      <div className="flex flex-col items-start gap-1">
        <CategoryBadge exceptionType={order.exceptionType} />
        <span className="block max-w-[210px] truncate text-xs text-ink-muted" title={summary}>
          {count > 0 ? `${count}件の確認事項 — ` : ""}
          {summary}
        </span>
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-300">
      <Icon name="checkCircle" className="h-3.5 w-3.5" /> 基幹登録が可能
    </span>
  );
}

// ---- 小物 ----
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-ink-muted">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-surface-border bg-surface-input px-3 text-sm text-ink-soft outline-none transition-colors focus:border-brand-500 [&>option]:bg-surface [&>option]:text-ink"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-4 py-3.5 ${className}`}>{children}</th>;
}
function Td({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-4 py-4 align-middle ${className}`} title={title}>
      {children}
    </td>
  );
}
function Skeleton({ w }: { w: string }) {
  return <span className={`skeleton inline-block h-3.5 ${w} align-middle`} />;
}
function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
