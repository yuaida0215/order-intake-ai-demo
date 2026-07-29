"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Card } from "@/components/ui";
import { WatchBanner } from "@/components/WatchBanner";
import { AlertCard } from "@/components/AlertCard";
import type { OrderAlert } from "@/lib/types";

export default function AlertsPage() {
  const router = useRouter();
  const alerts = useOrderStore((s) => s.alerts);
  const acceptAlert = useOrderStore((s) => s.acceptAlert);
  const archiveAlert = useOrderStore((s) => s.archiveAlert);
  const [showArchived, setShowArchived] = useState(false);

  const pending = useMemo(
    () => alerts.filter((a) => a.status === "pending").sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1)),
    [alerts],
  );
  const archived = useMemo(() => alerts.filter((a) => a.status === "archived"), [alerts]);

  function handleAccept(alert: OrderAlert) {
    const orderId = acceptAlert(alert.id);
    if (!orderId) return;
    router.push(alert.kind === "purchase_order_received" ? `/orders/${orderId}/po` : `/orders/${orderId}/read`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">受注アラート</h1>
        <p className="mt-1 text-sm text-ink-muted">
          AIが会話・書類から検知した「受注らしい」案件を確認し、読み取りへ進めるかアーカイブするかを判断します。
        </p>
      </div>

      <WatchBanner />

      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-wide text-ink">受注アラート ({pending.length}件)</h2>
          <p className="mt-0.5 text-xs text-ink-muted">対応が必要なアラート</p>
        </div>
        {pending.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-ink-faint">現在、確認が必要なアラートはありません。</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {pending.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAccept={() => handleAccept(alert)}
                onArchive={(reason) => archiveAlert(alert.id, reason)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-xs font-medium text-ink-muted hover:text-ink"
        >
          {showArchived ? "▲" : "▼"} アーカイブ済み ({archived.length}件)
        </button>
        {showArchived && (
          <Card className="mt-2">
            {archived.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-faint">アーカイブ済みのアラートはありません。</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {archived.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-ink-soft">
                      {a.suggestedCustomerName ?? "取引先不明"}
                      <span className="ml-2 text-xs text-ink-faint">{a.archivedReason}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-faint">{a.archivedAt}</span>
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
