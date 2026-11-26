"use client";

import { useState } from "react";
import { LIQUIDS, itemByPartNo } from "@/lib/mc/data";
import { num, totalKg, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, PageHead, Panel, TableWrap, Toast } from "@/components/mc/ui";

export default function Materials() {
  const lots = useMc((s) => s.lots);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  // 受注残（作業票発行〜処理中）から処理液の使用見込みを計算
  const need: Record<string, number> = {};
  for (const l of lots.filter((x) => x.status === "ticketed" || x.status === "processing")) {
    const it = itemByPartNo(l.partNo);
    if (!it) continue;
    const kg = totalKg(l.qty, it.unitWeightG);
    for (const s of it.steps) need[s.liquid] = (need[s.liquid] ?? 0) + kg * 0.012;
  }
  return (
    <div>
      <PageHead kicker="購買" title="材料仕入（処理液）" sub="製品の在庫は持たない一方で、処理液は在庫を持ちます。受注残の工程条件から使用量を見込み、発注点を割る前に発注案を出します。" />
      <BeforeAfter before="処理液の残量と発注は担当者の経験頼み。仕入は会計と別々に入力。" after="受注した品番の工程（処理液・投入量）から使用量を自動で見込み、発注点で発注案。関係会社Aからの仕入は2法人の突合まで自動。" />
      <Panel title="処理液の在庫と発注案" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>処理液</th><th>仕入先</th><th className="num">在庫</th><th className="num">受注残の使用見込</th><th className="num">発注点</th><th className="num">単価</th><th>判定</th><th></th></tr></thead>
            <tbody>
              {LIQUIDS.map((m) => {
                const n = need[m.code] ?? 0;
                const short = m.stockKg - n < m.reorderKg;
                const qty = Math.ceil((m.reorderKg * 2 - m.stockKg + n) / 20) * 20;
                return (
                  <tr key={m.code}>
                    <td className="font-semibold">{m.name}</td>
                    <td className="text-[12px]">{m.supplier}</td>
                    <td className="num">{num(m.stockKg)}kg</td>
                    <td className="num">{num(n, 1)}kg</td>
                    <td className="num">{num(m.reorderKg)}kg</td>
                    <td className="num">{yen(m.unitPrice)}/kg</td>
                    <td>{short ? <Chip tone="red">発注点割れ</Chip> : <Chip tone="green">十分</Chip>}</td>
                    <td>
                      {short && (ordered.includes(m.code) ? <Chip tone="green">発注済み {num(qty)}kg</Chip> : (
                        <Btn size="sm" variant="primary" onClick={() => { setOrdered([...ordered, m.code]); setToast(`${m.code} を ${num(qty)}kg 発注しました（${m.supplier}）`); setTimeout(() => setToast(""), 2400); }}>
                          {num(qty)}kg 発注
                        </Btn>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-[11.5px] text-ink-muted">使用見込みは「総重量 × 塗り回数 × 付着係数」の簡易計算（デモ）。本番は実績の使用量で係数を合わせます。</p>
        </div>
      </Panel>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
