"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DemoOrder } from "@/lib/types";
import { detailRoute, formatDate, yen } from "@/lib/format";
import { SourcePreview } from "@/components/SourcePreview";
import { StatusBadge, AssigneeBadge, ChannelBadge, CategoryBadge } from "@/components/badges";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icons";

/** 受注一覧の行クリックで右から開く詳細ドロワー (§7-6 / Attio的な一覧+詳細連携) */
export function DetailDrawer({ order, onClose }: { order: DemoOrder | null; onClose: () => void }) {
  const router = useRouter();

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const issueCount = order.missingFields.length + order.validationErrors.length;
  const goDetail = () => {
    onClose();
    router.push(detailRoute(order));
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="受注の詳細">
      {/* オーバーレイ */}
      <button
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-[fade-in_.15s_ease-out]"
      />
      {/* パネル */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-line-strong bg-surface-elevated shadow-pop">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-6 py-5">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="font-mono text-[12px] text-ink-muted">{order.id}</span>
              <ChannelBadge channel={order.channel} />
            </div>
            <h2 className="truncate text-xl font-bold tracking-tight text-ink">
              {!order.isRead ? "AI未読取の受注" : (order.customerName ?? "取引先未取得")}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              {order.isRead && order.exceptionType && <CategoryBadge exceptionType={order.exceptionType} />}
              <AssigneeBadge assignee={order.assignedTo} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="閉じる"
          >
            <Icon name="chevronRight" className="h-5 w-5" />
          </button>
        </div>

        {/* 本体 (スクロール) */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {!order.isRead ? (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 px-5 py-8 text-center">
              <p className="text-sm text-ink-muted">この受注はまだAIが読み取っていません。</p>
              <div className="mt-4">
                <Button variant="ai" onClick={goDetail}>
                  <Icon name="sparkles" className="h-4 w-4" /> AI読み取り画面を開く
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* AI抽出結果 サマリー */}
              <Section title="AI抽出結果">
                <dl className="divide-y divide-line-subtle overflow-hidden rounded-lg border border-surface-border">
                  <Row label="商品">
                    {order.items[0]?.productName ?? "—"}
                    {order.items.length > 1 ? <span className="ml-1 text-xs text-ink-muted">他{order.items.length - 1}件</span> : null}
                  </Row>
                  <Row label="数量">
                    {order.items[0]?.quantity != null
                      ? `${order.items[0].quantity.toLocaleString()} ${order.items[0].unit ?? ""}`
                      : "—"}
                  </Row>
                  <Row label="受注金額">
                    <span className="font-semibold tabular-nums text-ink">{yen(order.totalAmount)}</span>
                  </Row>
                  <Row label="希望納品日">{formatDate(order.requestedDeliveryDate)}</Row>
                  <Row label="納品先">{order.deliveryAddress ?? <span className="text-rose-600">未取得</span>}</Row>
                </dl>
              </Section>

              {/* 不備理由 */}
              {issueCount > 0 && (
                <Section title={`確認事項（${issueCount}件）`}>
                  <ul className="space-y-2">
                    {order.missingFields.map((m) => (
                      <li key={m.fieldKey} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                        <Icon name="alertTriangle" className="mt-0.5 h-4 w-4 flex-none" />
                        <span><span className="font-medium">{m.fieldLabel}</span> — {m.reason}</span>
                      </li>
                    ))}
                    {order.validationErrors.map((v) => (
                      <li key={v.fieldKey} className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                        <Icon name="alertTriangle" className="mt-0.5 h-4 w-4 flex-none" />
                        <span><span className="font-medium">{v.fieldLabel}</span> — {v.message}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* 元データ */}
              <Section title="元データ">
                <SourcePreview order={order} />
              </Section>

              {/* 処理履歴 */}
              {order.logs && order.logs.length > 0 && (
                <Section title="処理履歴">
                  <ol className="space-y-3">
                    {order.logs.map((log, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-brand-400" aria-hidden />
                        <div className="min-w-0">
                          <div className="text-[13px] text-ink-soft">{log.message}</div>
                          <div className="mt-0.5 text-[11px] text-ink-faint">
                            {log.actor === "ai" ? "AI Agent" : log.actor === "manager" ? "上長" : log.actor === "system" ? "システム" : "担当者"}
                            {" ・ "}
                            {log.timestamp}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}
            </>
          )}
        </div>

        {/* フッター: 次のアクション */}
        <div className="border-t border-surface-border px-6 py-4">
          <Button variant="primary" size="lg" className="w-full" onClick={goDetail}>
            {order.isRead ? "詳細・編集を開く" : "AI読み取り画面を開く"}
            <Icon name="chevronRight" className="h-4 w-4" />
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="w-24 flex-none text-xs font-medium text-ink-muted">{label}</span>
      <span className="flex-1 text-right text-sm text-ink">{children}</span>
    </div>
  );
}
