"use client";

import Link from "next/link";
import { RFI_ITEMS } from "@/lib/mc/data";
import { Chip, PageHead, Panel } from "@/components/mc/ui";

const OPEN = [
  "帳票の種類・数・様式（作業票・現品票・完了票・納品書・請求書）は工場ごと・客先ごとに違うか",
  "品番マスタの件数（8工場の合計）と単価の持ち方",
  "設備の自動運転（FA）とのマスタ連動の仕様（どのマスタを、どちら向きに、どんな形で）",
  "社内サーバーの用意と保守の形（常駐か訪問か）",
  "データ移行の範囲（マスタ・受注残・受注履歴を何年分）",
];

export default function Rfi() {
  const areas = Array.from(new Set(RFI_ITEMS.map((r) => r.area)));
  const ok = RFI_ITEMS.filter((r) => r.fit === "○").length;
  return (
    <div>
      <PageHead kicker="RFI_基幹システム更新 v4 Draft（2026/3）" title="RFI 対応表" sub="RFIの必須要件・推奨要件・課題ごとに、このデモのどの画面で確かめられるかをまとめました。行をタップすると該当画面に移ります。" />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-white p-3"><div className="text-[11.5px] text-ink-muted">要件</div><div className="text-[22px] font-bold">{RFI_ITEMS.length}項目</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-[11.5px] text-emerald-700">画面で確認できる（○）</div><div className="text-[22px] font-bold text-emerald-700">{ok}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[11.5px] text-amber-700">範囲の相談が要る（△）</div><div className="text-[22px] font-bold text-amber-700">{RFI_ITEMS.length - ok}</div></div>
      </div>
      <div className="space-y-5">
        {areas.map((a) => (
          <Panel key={a} title={a} pad={false}>
            <ul className="divide-y divide-line-subtle">
              {RFI_ITEMS.filter((r) => r.area === a).map((r) => (
                <li key={r.req}>
                  <Link href={r.href} className="grid gap-2 px-4 py-3 hover:bg-surface-sunken/70 md:grid-cols-[200px_1fr_1.2fr_auto] md:items-start">
                    <div className="flex items-center gap-2">
                      <Chip tone={r.fit === "○" ? "green" : "amber"}>{r.fit}</Chip>
                      <span className="text-[13px] font-bold text-ink">{r.req}</span>
                    </div>
                    <div className="text-[12px] text-ink-muted"><span className="mr-1 font-semibold text-ink-soft">今：</span>{r.now}</div>
                    <div className="text-[12.5px] text-ink"><span className="mr-1 font-semibold text-brand-600">新基幹：</span>{r.how}</div>
                    <span className="text-[12px] font-semibold text-brand-600">画面 ›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
      <Panel title="金額と範囲を絞るために、確かめたいこと" className="mt-5">
        <ol className="list-decimal space-y-1.5 pl-5 text-[13px] text-ink-soft">
          {OPEN.map((o) => <li key={o}>{o}</li>)}
        </ol>
        <p className="mt-3 text-[11.5px] text-ink-muted">RFIのほかの質問（製品名・概算費用・2029年3月稼働の日程・保守体制・同業の導入事例）は、提案書で別にお答えします。</p>
      </Panel>
    </div>
  );
}
