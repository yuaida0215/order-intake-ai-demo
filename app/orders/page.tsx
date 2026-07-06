"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import {
  CHANNEL_LABEL,
  STATUS_LABEL,
  ASSIGNEE_LABEL,
  detailRoute,
  formatDate,
  formatDateTime,
  totalQuantity,
  yen,
} from "@/lib/format";
import type { AssigneeType, DemoOrder, OrderChannel, OrderStatus } from "@/lib/types";
import { AgentAvatar, AssigneeBadge, CategoryBadge, ChannelBadge, StatusBadge } from "@/components/badges";
import { KpiCard } from "@/components/Kpi";
import { Button, Card } from "@/components/ui";
import { toDemoOrders } from "@/lib/ingest";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function OrdersPage() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const markReading = useOrderStore((s) => s.markReading);
  const revealOrder = useOrderStore((s) => s.revealOrder);
  const addOrders = useOrderStore((s) => s.addOrders);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeType | "all">("all");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [importing, setImporting] = useState<string | null>(null); // 取り込み中のチャネル名
  const [importNote, setImportNote] = useState<string | null>(null);

  const unreadCount = orders.filter((o) => !o.isRead).length;

  // KPI (§6.1)
  const kpi = useMemo(() => {
    const readOrders = orders.filter((o) => o.isRead);
    return {
      receivedToday: orders.length,
      autoInput: orders.filter((o) => o.status === "auto_input_completed" || o.status === "completed").length,
      internalWait: orders.filter((o) => o.isRead && o.assignedTo === "internal_user").length,
      customerWait: orders.filter((o) => o.isRead && o.assignedTo === "customer").length,
      monthlyAmount: readOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0),
    };
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        if (channelFilter !== "all" && o.channel !== channelFilter) return false;
        if (assigneeFilter !== "all" && o.assignedTo !== assigneeFilter) return false;
        return true;
      }),
    [orders, statusFilter, channelFilter, assigneeFilter],
  );

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
      const res = await fetch(`/api/ingest/${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setImportNote(`${label}取り込みエラー: ${data.error ?? res.status}`);
        return;
      }
      const added = addOrders(toDemoOrders(data.orders));
      setImportNote(
        added > 0
          ? `${label}から${added}件の受注を取り込みました。「AIで一括読み取り」で分類できます。`
          : (data.orders?.length ?? 0) > 0
            ? `${label}に新着はありません（すべて取り込み済みです）。`
            : `${label}に受注らしいメッセージは見つかりませんでした。`
      );
    } catch (e) {
      setImportNote(`${label}取り込みエラー: サーバーに接続できませんでした。`);
    } finally {
      setImporting(null);
    }
  }

  const statusOptions = Array.from(new Set(orders.map((o) => o.status)));

  return (
    <div className="space-y-6">
      {/* ページヘッダ */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">受注一覧</h1>
          <p className="mt-1 text-sm text-ink-muted">
            すべてのチャネルから届いた受注を、AIが読み取り・分類します。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-white p-1">
            <span className="pl-2 text-[11px] font-medium text-ink-muted">取り込み:</span>
            <Button size="sm" variant="ghost" onClick={() => importFrom("chatwork", "Chatwork")} disabled={importing !== null}>
              {importing === "Chatwork" ? "確認中…" : "🗨️ Chatwork"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => importFrom("slack", "Slack")} disabled={importing !== null}>
              {importing === "Slack" ? "確認中…" : "💬 Slack"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => importFrom("gmail", "メール")} disabled={importing !== null}>
              {importing === "メール" ? "確認中…" : "✉️ メール"}
            </Button>
          </div>
          <Button variant="primary" className="ai-gradient-anim shadow-glow" onClick={runBulkRead} disabled={bulkRunning || unreadCount === 0}>
            {bulkRunning ? (
              <>
                <Spinner /> AIが読み取り中…
              </>
            ) : (
              <>🤖 AIで一括読み取り{unreadCount > 0 ? `（${unreadCount}件）` : ""}</>
            )}
          </Button>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="本日受信件数" value={kpi.receivedToday} tone="brand" icon="📥" />
        <KpiCard label="自動入力完了" value={kpi.autoInput} tone="emerald" icon="✅" />
        <KpiCard label="自社確認待ち" value={kpi.internalWait} tone="amber" icon="🧑‍💼" />
        <KpiCard label="相手先確認待ち" value={kpi.customerWait} tone="red" icon="📨" />
        <KpiCard label="受注金額（読取済）" value={<span className="gradient-text">{yen(kpi.monthlyAmount)}</span>} tone="default" icon="💴" />
      </div>

      {/* Chatwork取り込み結果 */}
      {importNote && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-800">
          {importNote}
        </div>
      )}

      {/* 未読案内バナー */}
      {unreadCount > 0 && !bulkRunning ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <AgentAvatar size="h-8 w-8" pulse />
          <span>
            <b>{unreadCount}件</b>の受注が届いています。「AIで一括読み取り」を押すと、AIが内容を読み取り・分類します。
          </span>
        </div>
      ) : null}

      {/* フィルター */}
      <Card padded={false} className="p-4">
        <div className="flex flex-wrap items-center gap-3">
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
          <FilterSelect label="受信月" value="2026-07" onChange={() => {}} options={[["2026-07", "2026年7月"]]} />
          <div className="ml-auto text-xs text-ink-muted">
            全 {orders.length} 件中 <b className="text-ink">{filtered.length}</b> 件表示
          </div>
        </div>
      </Card>

      {/* 受注一覧テーブル */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-sunken text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                <Th>受信日時</Th>
                <Th>チャネル</Th>
                <Th>取引先</Th>
                <Th>商品</Th>
                <Th className="text-right">数量</Th>
                <Th className="text-right">受注金額</Th>
                <Th>希望納品日</Th>
                <Th>ステータス / 不備内容</Th>
                <Th>対応者</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id} order={o} onOpen={() => router.push(detailRoute(o))} />
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-ink-muted">
                    条件に合致する受注がありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function OrderRow({ order, onOpen }: { order: DemoOrder; onOpen: () => void }) {
  const reading = order.status === "ai_reading";
  const q = totalQuantity(order);
  const unit = order.items[0]?.unit ?? "";

  return (
    <tr
      onClick={onOpen}
      className={`cursor-pointer border-b border-surface-border transition-colors last:border-0 hover:bg-brand-50/40 ${order.isRead ? "row-reveal" : ""}`}
    >
      <Td className="whitespace-nowrap text-ink-soft">{formatDateTime(order.receivedAt)}</Td>
      <Td><ChannelBadge channel={order.channel} /></Td>

      {!order.isRead ? (
        // 読み取り前は抽出結果を伏せる
        <>
          <Td>{reading ? <Skeleton w="w-28" /> : <span className="text-ink-faint">AI未読取</span>}</Td>
          <Td>{reading ? <Skeleton w="w-40" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td className="text-right">{reading ? <Skeleton w="w-10" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td className="text-right">{reading ? <Skeleton w="w-16" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td>{reading ? <Skeleton w="w-20" /> : <span className="text-ink-faint">—</span>}</Td>
          <Td>
            <div className="flex flex-col gap-1">
              <StatusBadge status={order.status} />
              {reading ? (
                <span className="animate-pulse-soft text-[11px] text-brand-500">AIが読み取り中…</span>
              ) : (
                <span className="text-[11px] text-ink-faint">AI読み取り待ち</span>
              )}
            </div>
          </Td>
          <Td><span className="text-ink-faint">—</span></Td>
        </>
      ) : (
        <>
          <Td className="max-w-[120px] truncate whitespace-nowrap font-medium text-ink" title={order.customerName ?? ""}>
            {order.customerName ?? <span className="text-red-500">未取得</span>}
          </Td>
          <Td className="max-w-[150px] truncate text-ink-soft" title={order.items[0]?.productName ?? ""}>
            {order.items[0]?.productName ?? <span className="text-red-500">未取得</span>}
            {order.items.length > 1 ? <span className="ml-1 text-xs text-ink-muted">他{order.items.length - 1}件</span> : null}
          </Td>
          <Td className="whitespace-nowrap text-right tabular-nums text-ink-soft">{q !== null ? `${q.toLocaleString()} ${unit}` : "—"}</Td>
          <Td className="text-right font-semibold tabular-nums text-ink">{yen(order.totalAmount)}</Td>
          <Td className="whitespace-nowrap text-ink-soft">{formatDate(order.requestedDeliveryDate)}</Td>
          <Td className="max-w-[170px]">
            <div className="flex flex-col gap-1">
              <StatusBadge status={order.status} />
              <IssueCell order={order} />
            </div>
          </Td>
          <Td><AssigneeBadge assignee={order.assignedTo} /></Td>
        </>
      )}
    </tr>
  );
}

function IssueCell({ order }: { order: DemoOrder }) {
  if (order.exceptionType) {
    const issue =
      order.validationErrors[0]?.message ??
      (order.missingFields.length > 0
        ? `不足: ${order.missingFields.map((m) => m.fieldLabel).join("・")}`
        : order.recommendedAction);
    return (
      <div className="flex flex-col items-start gap-1">
        <CategoryBadge exceptionType={order.exceptionType} />
        <span className="block max-w-[155px] truncate text-[11px] text-ink-muted" title={issue}>
          {issue}
        </span>
      </div>
    );
  }
  return (
    <span className="block max-w-[155px] truncate text-[11px] text-emerald-600" title={order.recommendedAction}>
      ▸ {order.recommendedAction}
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
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-sm text-ink-soft outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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
  return <th className={`whitespace-nowrap px-3 py-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-3 py-3 align-top ${className}`} title={title}>
      {children}
    </td>
  );
}
function Skeleton({ w }: { w: string }) {
  return <span className={`skeleton inline-block h-3.5 ${w} align-middle`} />;
}
function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
