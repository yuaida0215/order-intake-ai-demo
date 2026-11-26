"use client";

import { INITIAL_DEPOSITS, OUTSOURCE_ORDERS, customerById } from "@/lib/mc/data";
import { lotAmount, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, PageHead, Panel, TableWrap } from "@/components/mc/ui";

type J = { date: string; dr: string; cr: string; amount: number; memo: string; src: string };

export default function Accounting() {
  const lots = useMc((s) => s.lots);
  const deposits = useMc((s) => s.deposits);
  const invoices = useMc((s) => s.invoices);
  const journals: J[] = [];

  // 売上計上（照合OK）— 得意先ごとに集約
  const sold = lots.filter((l) => ["sold", "billed", "paid"].includes(l.status) && l.receivedAt >= "2026-11-25");
  const byCust: Record<string, number> = {};
  for (const l of sold) byCust[l.customerId] = (byCust[l.customerId] ?? 0) + lotAmount(l);
  for (const [cid, amt] of Object.entries(byCust)) journals.push({ date: "11/30", dr: "売掛金", cr: "売上高", amount: amt, memo: `${customerById(cid as never).short} 照合OK分`, src: "照合" });

  // 入金消込
  for (const d of INITIAL_DEPOSITS) {
    const k = deposits[d.id];
    if (!k) continue;
    const inv = invoices.find((i) => i.id === d.suggestion.invoiceId)!;
    journals.push({ date: d.date, dr: "普通預金", cr: "売掛金", amount: d.amount, memo: `${customerById(inv.customerId).short} ${inv.id}`, src: "入金消込" });
    if (k === "fee") journals.push({ date: d.date, dr: "支払手数料", cr: "売掛金", amount: 660, memo: "振込手数料（先方負担分）", src: "入金消込" });
    if (k === "acceptance") journals.push({ date: d.date, dr: "売上値引", cr: "売掛金", amount: 22000, memo: "検収差額（不良返品）", src: "入金消込" });
  }
  // 外注費
  for (const o of OUTSOURCE_ORDERS.filter((x) => x.status.startsWith("戻り"))) journals.push({ date: o.returnAt, dr: "外注加工費", cr: "買掛金", amount: o.cost, memo: `${o.vendor} ${o.process}`, src: "外注加工" });
  // 材料仕入（関係会社A）
  journals.push({ date: "11/26", dr: "材料仕入高", cr: "買掛金（関係会社A）", amount: 1_140_000, memo: "ZF-100 400kg", src: "材料仕入" });

  const download = () => {
    const csv = ["日付,借方科目,借方金額,貸方科目,貸方金額,摘要", ...journals.map((j) => `2026/${j.date},${j.dr},${j.amount},${j.cr},${j.amount},"${j.memo}"`)].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = "仕訳_会計取込用_202611.csv";
    a.click();
  };

  return (
    <div>
      <PageHead kicker="管理" title="会計連携（仕訳）" sub="売上計上・入金消込・外注・仕入の各画面で行った操作から、仕訳を自動で作ります。" right={<Btn variant="primary" size="sm" onClick={download}>会計ソフト取込用CSVを書き出す</Btn>} />
      <BeforeAfter before="会計機能を使いこなせず、仕訳は手作業。CSVをExcelで手集計。" after="業務の操作がそのまま仕訳になる。会計ソフトへはCSVまたはAPIで連携（会計ソフトは選定に合わせて形式を切替）。" />
      <Panel title={`自動で作った仕訳（${journals.length}件）`} sub="入金消込などを操作すると増えます" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>日付</th><th>借方</th><th>貸方</th><th className="num">金額</th><th>摘要</th><th>発生元</th></tr></thead>
            <tbody>
              {journals.map((j, i) => (
                <tr key={i}>
                  <td>{j.date}</td><td className="font-semibold">{j.dr}</td><td>{j.cr}</td><td className="num">{yen(j.amount)}</td><td className="text-[12px]">{j.memo}</td><td><Chip tone="blue">{j.src}</Chip></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
    </div>
  );
}
