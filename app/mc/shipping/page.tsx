"use client";

import { useState } from "react";
import { customerById, factoryById, itemByPartNo, type Lot } from "@/lib/mc/data";
import { lotAmount, num, yen } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { DeliveryNote } from "@/components/mc/docs";
import { BeforeAfter, Btn, PageHead, Panel, Sheet, TableWrap } from "@/components/mc/ui";

export default function Shipping() {
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const deliver = useMc((s) => s.deliver);
  const [issued, setIssued] = useState<{ no: string; lots: Lot[] } | null>(null);
  const completed = inScope(lots, scope).filter((l) => l.status === "completed");
  const groups = Object.values(
    completed.reduce<Record<string, Lot[]>>((acc, l) => {
      const k = `${l.factoryId}-${l.customerId}`;
      (acc[k] ||= []).push(l);
      return acc;
    }, {}),
  );

  const issue = (g: Lot[]) => {
    const no = deliver(g.map((l) => l.id));
    setIssued({ no, lots: g.map((l) => ({ ...l, status: "delivered", deliveryNo: no })) });
  };

  return (
    <div>
      <PageHead kicker="受託加工 STEP 4" title="納品書・出荷" sub="完成したロットを、工場×得意先ごとにまとめて納品書にします。控は照合用に自動で残ります。" />
      <BeforeAfter
        before="現品票と納品書は工場で作って製品と一緒に返す。納品書の発行は今の基幹の外（人の手・紙）。"
        after="完成済みのロットが得意先ごとに自動でまとまり、ボタン1つで納品書。工場ごとの様式・得意先指定の様式に切り替えられる。"
      />
      {groups.length === 0 && (
        <Panel><p className="py-8 text-center text-[13px] text-ink-muted">納品書の発行待ちはありません。完成入力をすると、ここに並びます。</p></Panel>
      )}
      <div className="space-y-5">
        {groups.map((g) => {
          const c = customerById(g[0].customerId);
          const total = g.reduce((s, l) => s + lotAmount(l), 0);
          return (
            <Panel
              key={g[0].factoryId + g[0].customerId}
              title={`${c.short}（${factoryById(g[0].factoryId).short}工場）`}
              sub={`${g.length}ロット・${yen(total)}`}
              right={<Btn variant="primary" size="sm" onClick={() => issue(g)}>納品書を発行して出荷</Btn>}
              pad={false}
            >
              <div className="p-4 pt-1">
                <TableWrap>
                  <thead><tr><th>作業票No</th><th>品番</th><th>商品名</th><th>ロットNo</th><th className="num">箱数</th><th className="num">完成数量</th><th className="num">金額</th></tr></thead>
                  <tbody>
                    {g.map((l) => (
                      <tr key={l.id}>
                        <td className="font-mono">{l.ticketNo}</td>
                        <td className="font-mono">{l.partNo}</td>
                        <td>{itemByPartNo(l.partNo)!.name}</td>
                        <td>{l.lotNo}</td>
                        <td className="num">{l.boxes}</td>
                        <td className="num">{num(l.completedQty ?? l.qty)}</td>
                        <td className="num">{yen(lotAmount(l))}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            </Panel>
          );
        })}
      </div>
      <Sheet open={!!issued} onClose={() => setIssued(null)} title="納品書を発行しました（印刷イメージ）">
        {issued && (
          <>
            <DeliveryNote lots={issued.lots} no={issued.no} />
            <div className="mt-4 flex gap-2">
              <Btn variant="primary" href="/mc/matching">次へ：照合</Btn>
              <Btn onClick={() => setIssued(null)}>閉じる</Btn>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
