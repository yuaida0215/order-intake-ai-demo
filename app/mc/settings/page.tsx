"use client";

import { FACTORIES } from "@/lib/mc/data";
import { ROLES, canSee, useMc } from "@/lib/mc/store";
import { BeforeAfter, Chip, PageHead, Panel, TableWrap } from "@/components/mc/ui";

const MENUS: [string, string][] = [
  ["/mc/intake", "注文書の取込"], ["/mc/orders", "受注・作業票"], ["/mc/completion", "完成入力"], ["/mc/shipping", "納品書・出荷"], ["/mc/matching", "照合"],
  ["/mc/billing", "売上・請求"], ["/mc/payments", "入金消込"], ["/mc/goods", "薬液・設備販売"], ["/mc/outsourcing", "外注加工"], ["/mc/materials", "材料仕入"],
  ["/mc/cost", "原価管理"], ["/mc/accounting", "会計連携"], ["/mc/intercompany", "2法人"], ["/mc/masters", "品番マスタ"], ["/mc/bi", "経営ダッシュボード"],
];

export default function Settings() {
  const role = useMc((s) => s.role);
  return (
    <div>
      <PageHead kicker="基盤" title="拠点・権限・構成" sub="右上の「利用者」を切り替えると、メニューと見える拠点が変わります。" />
      <BeforeAfter before="拠点間でリアルタイムに共有できない。" after="9拠点が1つのデータを見る。役割×拠点で、使えるメニューと見える範囲を分ける。" />
      <Panel title="役割ごとに使えるメニュー" className="mb-5" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>メニュー</th>{ROLES.map((r) => <th key={r.id} className={`text-center ${r.id === role ? "!bg-brand-50 !text-brand-700" : ""}`}>{r.label}</th>)}</tr></thead>
            <tbody>
              {MENUS.map(([href, label]) => (
                <tr key={href}>
                  <td>{label}</td>
                  {ROLES.map((r) => <td key={r.id} className={`text-center ${r.id === role ? "bg-brand-50/50" : ""}`}>{canSee(r.id, href) ? <span className="font-bold text-emerald-600">○</span> : <span className="text-ink-faint">—</span>}</td>)}
                </tr>
              ))}
              <tr><td className="font-semibold">見える拠点</td>{ROLES.map((r) => <td key={r.id} className="text-center text-[12px]">{r.factory === "ALL" ? "全拠点" : "自工場のみ"}</td>)}</tr>
            </tbody>
          </TableWrap>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="置き場所の構成（案）">
          <div className="space-y-2 text-[12.5px]">
            <div className="rounded-lg bg-navy px-3 py-3 text-white"><b>社内サーバー（オンプレミス）</b><div className="text-[11.5px] text-white/70">新基幹のアプリ・データベース。クラウド必須の製品は使わない</div></div>
            <div className="text-center text-brand-400">⇅ 拠点間VPN（接続済み）</div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11.5px]">
              {["名古屋4工場", "西日本2工場・東日本2工場", "東京事務所"].map((x) => <div key={x} className="rounded-lg border border-line bg-surface-sunken p-2 font-semibold">{x}<div className="font-normal text-ink-muted">ブラウザで利用</div></div>)}
            </div>
            <p className="pt-1 text-[11.5px] text-ink-muted">AI読み取りの置き場所（社内か外部サービスか）、サーバー機器・OS・DBの用意、保守（常駐／訪問）は要相談。</p>
          </div>
        </Panel>
        <Panel title="拠点" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap>
              <thead><tr><th>拠点</th><th>地域</th><th>帳票様式</th><th>接続</th></tr></thead>
              <tbody>
                {FACTORIES.map((f) => <tr key={f.id}><td className="font-semibold">{f.name}</td><td>{f.region}</td><td>{f.name}様式</td><td><Chip tone="green">VPN</Chip></td></tr>)}
                <tr><td className="font-semibold">東京事務所</td><td>東日本</td><td>—</td><td><Chip tone="green">VPN</Chip></td></tr>
              </tbody>
            </TableWrap>
          </div>
        </Panel>
      </div>
    </div>
  );
}
