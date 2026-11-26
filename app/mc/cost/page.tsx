"use client";

import { FACTORIES, FACTORY_MONTH, ITEMS, customerById } from "@/lib/mc/data";
import { lotCost, num, pct, yen } from "@/lib/mc/calc";
import { BeforeAfter, Chip, PageHead, Panel, TableWrap } from "@/components/mc/ui";

export default function Cost() {
  const rows = ITEMS.map((it) => {
    const qty = it.perBox * 20;
    return { it, c: lotCost({ partNo: it.partNo, qty }), qty };
  }).sort((a, b) => a.c.rate - b.c.rate);
  return (
    <div>
      <PageHead kicker="管理" title="原価管理" sub="ロットごとに、材料費（処理液）・加工費（ラインの時間）・外注費を積み上げます。品番・得意先・工場のどの切り口でも粗利が見えます。" />
      <BeforeAfter before="原価が案件に結びつかない。どの品番・どの得意先で儲かっているか分からない。" after="作業票No.単位で原価を積み上げるので、品番別・得意先別・工場別の粗利がその場で出る。赤字の品番は単価見直しの候補に。" />
      <Panel title="品番別の粗利（20箱あたりで比較）" sub="粗利率の低い順" className="mb-5" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>品番 / 商品名</th><th>得意先</th><th>工程</th><th className="num">売上</th><th className="num">材料費</th><th className="num">加工費</th><th className="num">外注費</th><th className="num">粗利</th><th className="num">粗利率</th></tr></thead>
            <tbody>
              {rows.map(({ it, c }) => (
                <tr key={it.partNo} className={c.margin < 0 ? "bg-rose-50/60" : ""}>
                  <td><div className="font-mono text-[12px]">{it.partNo}</div><div className="text-[11px] text-ink-muted">{it.name}</div></td>
                  <td>{customerById(it.customerId).short}</td>
                  <td className="text-[11.5px]">{it.steps.length}工程{it.outsource ? "＋外注" : ""}</td>
                  <td className="num">{yen(c.sales)}</td>
                  <td className="num">{yen(c.material)}</td>
                  <td className="num">{yen(c.process)}</td>
                  <td className="num">{c.outsource ? yen(c.outsource) : "—"}</td>
                  <td className={`num font-semibold ${c.margin < 0 ? "text-rose-600" : ""}`}>{yen(c.margin)}</td>
                  <td className="num">{c.margin < 0 ? <Chip tone="red">{pct(c.rate)}</Chip> : pct(c.rate)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-[12px] text-rose-600">「ブラケット リヤ」は外注のショットブラスト費が乗って赤字。久しぶりの受注なので、単価の見直しを相談する好機です（注文書を取り込むと、このロットの原価内訳もロット詳細で見られます）。</p>
        </div>
      </Panel>
      <Panel title="工場別の粗利率（11月）">
        <div className="space-y-2">
          {FACTORIES.map((f) => {
            const m = FACTORY_MONTH[f.id];
            return (
              <div key={f.id} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-24 flex-none font-semibold">{f.short}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-brand-400" style={{ width: `${m.margin * 220}%` }} /></div>
                <span className="w-14 text-right tabular-nums">{pct(m.margin)}</span>
                <span className="hidden w-28 text-right tabular-nums text-ink-muted sm:inline">{num(m.lots)}ロット</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
