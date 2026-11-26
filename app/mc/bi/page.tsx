"use client";

import { FACTORIES, FACTORY_MONTH, MONTHLY_SALES } from "@/lib/mc/data";
import { num, pct } from "@/lib/mc/calc";
import { BeforeAfter, PageHead, Panel, Stat, TableWrap } from "@/components/mc/ui";

export default function Bi() {
  const total = FACTORIES.reduce((s, f) => s + FACTORY_MONTH[f.id].sales, 0);
  const lots = FACTORIES.reduce((s, f) => s + FACTORY_MONTH[f.id].lots, 0);
  const margin = FACTORIES.reduce((s, f) => s + FACTORY_MONTH[f.id].sales * FACTORY_MONTH[f.id].margin, 0) / total;
  const max = Math.max(...MONTHLY_SALES.map((m) => m.v));
  const maxF = Math.max(...FACTORIES.map((f) => FACTORY_MONTH[f.id].sales));
  return (
    <div>
      <PageHead kicker="管理（推奨要件：BI）" title="経営ダッシュボード" sub="全拠点が同じデータを見ているので、集計はいつでも最新です。（数字はデモ用の仮の値）" />
      <BeforeAfter before="CSVを書き出してExcelで手集計。拠点間でリアルタイムに共有できない。" after="8工場の売上・粗利・納期遵守・3Hをその場で。工場ごとの比較も、得意先・品番への掘り下げも同じ画面で。" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="11月 売上（受託加工）" value={`${(total / 1e6).toFixed(1)}百万円`} sub="前月比 −1.0%" />
        <Stat label="11月 ロット数" value={num(lots)} sub="8工場合計" />
        <Stat label="粗利率" value={pct(margin)} tone="green" sub="ロット原価の積み上げ" />
        <Stat label="3H 確認件数" value="186件" tone="amber" sub="初めて41・久しぶり128・変更17" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="月別 売上（百万円）">
          <div className="flex h-44 items-end gap-3">
            {MONTHLY_SALES.map((m) => (
              <div key={m.m} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] tabular-nums text-ink-muted">{m.v}</span>
                <div className="w-full rounded-t bg-brand-400" style={{ height: `${(m.v / max) * 130}px` }} />
                <span className="text-[11px] text-ink-muted">{m.m}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="工場別 売上（11月）">
          <div className="space-y-2">
            {FACTORIES.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-16 flex-none font-semibold">{f.short}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-navy-light" style={{ width: `${(FACTORY_MONTH[f.id].sales / maxF) * 100}%` }} /></div>
                <span className="w-20 text-right tabular-nums">{(FACTORY_MONTH[f.id].sales / 1e6).toFixed(1)}百万</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="工場別の指標" className="mt-5" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>工場</th><th>地域</th><th className="num">ロット数</th><th className="num">売上</th><th className="num">粗利率</th><th className="num">納期遵守率</th></tr></thead>
            <tbody>
              {FACTORIES.map((f) => {
                const m = FACTORY_MONTH[f.id];
                return (
                  <tr key={f.id}><td className="font-semibold">{f.name}</td><td>{f.region}</td><td className="num">{num(m.lots)}</td><td className="num">¥{num(m.sales)}</td><td className="num">{pct(m.margin)}</td><td className="num">{pct(m.onTime)}</td></tr>
                );
              })}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
    </div>
  );
}
