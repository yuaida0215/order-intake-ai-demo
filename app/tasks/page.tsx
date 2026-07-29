"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { deriveTasks, type TaskItem, type TaskOwner } from "@/lib/tasks";
import { Button, Card, PageHeader, SectionTitle } from "@/components/ui";
import { KpiCard } from "@/components/Kpi";

const OWNER_LABEL: Record<TaskOwner, string> = {
  internal_user: "自社担当のタスク",
  manager: "上長のタスク",
  customer: "相手先からの回答待ち",
  ai: "AI処理中",
};

const OWNER_ORDER: TaskOwner[] = ["internal_user", "manager", "customer", "ai"];

export default function TasksPage() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const alerts = useOrderStore((s) => s.alerts);
  const demoDate = useOrderStore((s) => s.demoDate);
  const reminderSettings = useOrderStore((s) => s.reminderSettings);

  const [ownerFilter, setOwnerFilter] = useState<TaskOwner | "all">("all");
  const [highOnly, setHighOnly] = useState(false);

  const tasks = useMemo(
    () => deriveTasks(orders, alerts, demoDate, reminderSettings),
    [orders, alerts, demoDate, reminderSettings],
  );

  const counts = useMemo(() => {
    const c: Record<TaskOwner, number> = { internal_user: 0, manager: 0, customer: 0, ai: 0 };
    tasks.forEach((t) => (c[t.owner] += 1));
    return c;
  }, [tasks]);

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => (ownerFilter === "all" ? true : t.owner === ownerFilter))
        .filter((t) => (highOnly ? t.priority === "high" : true)),
    [tasks, ownerFilter, highOnly],
  );

  const grouped = useMemo(() => {
    const map = new Map<TaskOwner, TaskItem[]>();
    for (const owner of OWNER_ORDER) map.set(owner, []);
    for (const t of filtered) map.get(t.owner)?.push(t);
    return map;
  }, [filtered]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="対応状況一覧"
        description="AIと担当者それぞれの対応状況を横断で確認します。"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {OWNER_ORDER.map((owner) => (
          <button
            key={owner}
            type="button"
            className="w-full text-left"
            onClick={() => setOwnerFilter(ownerFilter === owner ? "all" : owner)}
          >
            <KpiCard
              label={OWNER_LABEL[owner]}
              value={counts[owner]}
              tone={owner === "manager" ? "amber" : owner === "customer" ? "red" : owner === "ai" ? "brand" : "default"}
              icon={owner === "internal_user" ? "🧑‍💼" : owner === "manager" ? "👤" : owner === "customer" ? "📨" : "🤖"}
            />
          </button>
        ))}
      </div>

      <Card padded={false} className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2.5 text-[13px] text-ink-muted">
            <span className="font-medium">対応者</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as TaskOwner | "all")}
              className="h-10 rounded-lg border border-line bg-surface-input px-3 text-sm text-ink-soft outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            >
              <option value="all">すべて</option>
              {OWNER_ORDER.map((o) => (
                <option key={o} value={o}>
                  {OWNER_LABEL[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            <input
              type="checkbox"
              checked={highOnly}
              onChange={(e) => setHighOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line bg-surface-input accent-brand-500"
            />
            優先度：高のみ
          </label>
          <div className="ml-auto text-[13px] text-ink-muted">
            全 {tasks.length} 件中 <b className="text-ink">{filtered.length}</b> 件表示
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {OWNER_ORDER.map((owner) => {
          const items = grouped.get(owner) ?? [];
          if (ownerFilter !== "all" && ownerFilter !== owner) return null;
          if (items.length === 0) return null;
          return (
            <Card key={owner} padded={false}>
              <div className="border-b border-surface-border px-5 pb-4 pt-5">
                <SectionTitle right={<span className="text-[13px] font-semibold tabular-nums text-ink-muted">{items.length}件</span>}>
                  {OWNER_LABEL[owner]}
                </SectionTitle>
              </div>
              <ul className="divide-y divide-surface-border">
                {items.map((t) => (
                  <li
                    key={t.key}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {t.priority === "high" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                          優先度：高
                        </span>
                      )}
                      <span className="shrink-0 text-sm font-medium text-ink">{t.customerName}</span>
                      <span className="truncate text-sm text-ink-soft">{t.title}</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => router.push(t.href)}>
                      対応する →
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-ink-faint">該当するタスクはありません。</p>
          </Card>
        )}
      </div>
    </div>
  );
}
