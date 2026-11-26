"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LOT_FLOW, customerById, factoryById, itemByPartNo, type LotStatus } from "@/lib/mc/data";
import { md, num } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { Btn, Chip, FlowMini, H3Badge, PageHead, Panel, StatusChip, TableWrap } from "@/components/mc/ui";

function Orders() {
  const params = useSearchParams();
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const [tab, setTab] = useState<LotStatus | "all" | "h3">(params.get("h3") ? "h3" : "all");
  const scoped = inScope(lots, scope);
  const rows = scoped.filter((l) => (tab === "all" ? true : tab === "h3" ? !!l.h3 : l.status === tab));
  const tabs: { key: LotStatus | "all" | "h3"; label: string; n: number }[] = [
    { key: "all", label: "すべて", n: scoped.length },
    { key: "h3", label: "3Hあり", n: scoped.filter((l) => l.h3).length },
    ...LOT_FLOW.map((f) => ({ key: f.key, label: f.short, n: scoped.filter((l) => l.status === f.key).length })),
  ];
  return (
    <div>
      <PageHead
        kicker="受託加工 STEP 1"
        title="受注・作業票"
        sub="受注伝票＝作業票。作業票No.（バーコード）で、完成・納品・照合・請求まで同じ番号でつながります。"
        right={<Btn variant="primary" href="/mc/orders/new">＋ 受注入力（手入力）</Btn>}
      />
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-none rounded-full border px-3 py-1.5 text-[12px] font-semibold ${tab === t.key ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft"}`}
          >
            {t.label} <span className="opacity-70">{t.n}</span>
          </button>
        ))}
      </div>
      <Panel pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead>
              <tr>
                <th>作業票No</th><th>工場</th><th>得意先</th><th>品番 / 商品名</th><th className="num">箱数</th><th className="num">数量</th><th>ロットNo</th><th>入荷</th><th>納期</th><th>3H</th><th>取込元</th><th>状態</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const it = itemByPartNo(l.partNo)!;
                return (
                  <tr key={l.id}>
                    <td><Link href={`/mc/lots/${l.id}`} className="font-mono font-semibold text-brand-600 hover:underline">{l.ticketNo}</Link></td>
                    <td>{factoryById(l.factoryId).short}</td>
                    <td>{customerById(l.customerId).short}</td>
                    <td><div className="font-mono text-[12px]">{l.partNo}</div><div className="text-[11px] text-ink-muted">{it.name}</div></td>
                    <td className="num">{l.boxes}</td>
                    <td className="num">{num(l.qty)}</td>
                    <td>{l.lotNo}</td>
                    <td>{md(l.receivedAt)}</td>
                    <td>{md(l.dueDate)}</td>
                    <td><H3Badge h3={l.h3} /></td>
                    <td><Chip tone={l.source === "手入力" ? "gray" : l.source === "EDI" ? "green" : "cyan"}>{l.source}</Chip></td>
                    <td><div className="flex items-center gap-2"><StatusChip status={l.status} /><FlowMini status={l.status} /></div></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={12} className="py-8 text-center text-ink-muted">該当するロットはありません</td></tr>}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
