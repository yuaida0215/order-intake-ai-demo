"use client";

import { GOODS, GOODS_ORDERS } from "@/lib/mc/data";
import { num, yen } from "@/lib/mc/calc";
import { BeforeAfter, Chip, PageHead, Panel, TableWrap } from "@/components/mc/ui";

export default function Goods() {
  return (
    <div>
      <PageHead kicker="販売（別の商流）" title="薬液・処理設備の販売" sub="受託加工とは別に、在庫を持って売る商流です。同じシステムの中で、受注・引当・出荷・請求までを扱います。" />
      <BeforeAfter before="受託加工と物販の2つの商流を一元管理できない。" after="1つのシステムで2つの商流。得意先・請求・会計連携は共通で、物販だけ在庫と引当を持つ。" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="在庫" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap>
              <thead><tr><th>品目</th><th className="num">在庫</th><th className="num">引当済</th><th className="num">引当可能</th><th className="num">単価</th><th>判定</th></tr></thead>
              <tbody>
                {GOODS.map((g) => {
                  const free = g.stock - g.allocated;
                  return (
                    <tr key={g.code}>
                      <td><div className="font-semibold">{g.name}</div><div className="font-mono text-[11px] text-ink-muted">{g.code}</div></td>
                      <td className="num">{g.stock}{g.unit}</td>
                      <td className="num">{g.allocated}</td>
                      <td className="num font-semibold">{free}</td>
                      <td className="num">{yen(g.price)}</td>
                      <td>{g.stock === 0 ? <Chip tone="gray">受注生産</Chip> : free < g.reorder ? <Chip tone="red">補充が必要</Chip> : <Chip tone="green">十分</Chip>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </div>
        </Panel>
        <Panel title="受注・出荷" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap>
              <thead><tr><th>受注No</th><th>得意先</th><th>品目</th><th className="num">数量</th><th>納期</th><th>状態</th></tr></thead>
              <tbody>
                {GOODS_ORDERS.map((o) => {
                  const g = GOODS.find((x) => x.code === o.item)!;
                  return (
                    <tr key={o.id}>
                      <td className="font-mono">{o.id}</td>
                      <td>{o.customer}</td>
                      <td className="text-[12px]">{g.name}</td>
                      <td className="num">{num(o.qty)}</td>
                      <td>{o.due}</td>
                      <td><Chip tone={o.status.startsWith("出荷済") ? "green" : o.status.startsWith("見積") ? "gray" : "blue"}>{o.status}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </div>
        </Panel>
      </div>
    </div>
  );
}
