"use client";

import Link from "next/link";
import { RFI_ITEMS, type RfiItem } from "@/lib/mc/data";
import { Chip, PageHead, Panel, type Tone } from "@/components/mc/ui";

const ANSWER_TONE: Record<RfiItem["answer"], Tone> = { "画面で確認": "green", "一部を画面で・残りは提案書": "amber", "提案書で回答": "gray" };
const PRI_TONE: Record<RfiItem["pri"], Tone> = { 必須: "red", 推奨: "blue", 確認: "violet" };

// RFI 第5章 回答依頼事項（12項目）と、このデモで見せられる範囲
const ASKS: { no: number; text: string; demo: string; href?: string }[] = [
  { no: 1, text: "ERPパッケージ（製品名・バージョン）の概要資料", demo: "提案書で（パッケージではなく、受託加工の部分を作る案も含めて）" },
  { no: 2, text: "第4章の要件に対する対応可否一覧（〇／△／×と補足）", demo: "このページの上の表が下書き" },
  { no: 3, text: "請求グループ管理（複数工場の売上集約請求）の対応方法", demo: "売上・請求の画面で実演", href: "/mc/billing" },
  { no: 4, text: "受注案件別・工場別の原価計算（外注費・材料費の紐付け）", demo: "原価管理・ロット詳細で実演", href: "/mc/cost" },
  { no: 5, text: "受託加工・外注加工・材料仕入・薬液設備販売の統合管理アプローチ", demo: "メニュー構成そのもの（1つのシステムに4業務）", href: "/mc" },
  { no: 6, text: "複数法人管理（会社間取引の消込・内部取引管理）の方法", demo: "2法人の画面で実演", href: "/mc/intercompany" },
  { no: 7, text: "表面処理業・受託加工業への導入事例", demo: "提案書で" },
  { no: 8, text: "オンプレミス導入の可否・推奨サーバースペック（9拠点・約120名）", demo: "構成案は画面、スペックは提案書で", href: "/mc/settings" },
  { no: 9, text: "商奉行・蔵奉行からのデータ移行実績と移行アプローチ", demo: "移す対象は画面、計画は提案書で", href: "/mc/masters" },
  { no: 10, text: "概算費用感（初期費用・ランニング費用の目安レンジ）", demo: "提案書で" },
  { no: 11, text: "2029年3月稼働に向けた標準的な導入スケジュール", demo: "提案書で" },
  { no: 12, text: "保守サポート体制（SLA・対応時間・拠点体制）", demo: "提案書で" },
];

const OPEN = [
  "請求グループは4つか5つか（RFI本文の表は5グループ、第3章の課題の欄は「4請求グループ」と表記）。締め日・支払条件はグループごとに違うか",
  "東日本（東京）グループの売上の中身（薬液・設備の販売か）",
  "帳票の種類・数・様式（作業票・現品票・完了票・納品書・請求書）は工場ごと・客先ごとに違うか",
  "検査合否をどの単位で記録しているか（ロットごと・品番ごと）",
  "品番マスタの件数（8工場の合計）と単価の持ち方",
  "設備の自動運転（FA）とのマスタ連動の仕様（どのマスタを、どちら向きに、どんな形で）",
  "データ移行の範囲（マスタ・受注残・受注履歴を何年分）と、社内サーバー・保守の形",
];

export default function Rfi() {
  const shown = RFI_ITEMS.filter((r) => r.answer === "画面で確認").length;
  const partial = RFI_ITEMS.filter((r) => r.answer === "一部を画面で・残りは提案書").length;
  const doc = RFI_ITEMS.length - shown - partial;
  const secs = Array.from(new Set(RFI_ITEMS.map((r) => r.sec)));
  return (
    <div>
      <PageHead
        kicker="RFI_基幹システム更新 v4 Draft（2026年3月）"
        title="RFI 対応表"
        sub="RFI第4章の要件を原文の順に並べ、このデモのどの画面で確かめられるかをまとめました。画面で見せられないもの（費用・保守・実績など）は提案書でお答えします。"
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-[11.5px] text-emerald-700">画面で確認できる</div><div className="text-[22px] font-bold text-emerald-700">{shown}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[11.5px] text-amber-700">一部を画面で</div><div className="text-[22px] font-bold text-amber-700">{partial}</div></div>
        <div className="rounded-xl border border-line bg-white p-3"><div className="text-[11.5px] text-ink-muted">提案書で回答</div><div className="text-[22px] font-bold">{doc}</div></div>
      </div>

      <div className="space-y-5">
        {secs.map((sec) => (
          <Panel key={sec} title={sec} pad={false}>
            <ul className="divide-y divide-line-subtle">
              {RFI_ITEMS.filter((r) => r.sec === sec).map((r) => (
                <li key={r.req} className="grid gap-2 px-4 py-3 lg:grid-cols-[210px_1fr_1.1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip tone={PRI_TONE[r.pri]}>{r.pri}</Chip>
                      <span className="text-[13.5px] font-bold text-ink">{r.req}</span>
                    </div>
                    <Chip tone={ANSWER_TONE[r.answer]} className="mt-1.5">{r.answer}</Chip>
                  </div>
                  <div className="text-[12px] leading-relaxed text-ink-soft">
                    <div><span className="font-semibold text-ink-muted">要件：</span>{r.text}</div>
                    {r.issue && <div className="mt-1"><span className="font-semibold text-ink-muted">今の課題：</span>{r.issue}</div>}
                  </div>
                  <div className="text-[12.5px] leading-relaxed text-ink">
                    <span className="font-semibold text-brand-600">新基幹：</span>{r.how}
                    {r.links.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.links.map(([label, href]) => (
                          <Link key={href} href={href} className="rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700 hover:bg-brand-100">{label} ›</Link>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ))}

        <Panel title="第5章 回答依頼事項（12項目）とこのデモ" pad={false}>
          <ul className="divide-y divide-line-subtle">
            {ASKS.map((a) => (
              <li key={a.no} className="grid gap-1 px-4 py-2.5 text-[12.5px] sm:grid-cols-[28px_1fr_1fr] sm:items-baseline">
                <span className="font-bold text-brand-500">{a.no}</span>
                <span className="text-ink">{a.text}</span>
                <span className="text-ink-muted">{a.href ? <Link href={a.href} className="font-semibold text-brand-600 hover:underline">{a.demo} ›</Link> : a.demo}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="範囲と金額を絞るために、確かめたいこと">
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-soft">
            {OPEN.map((o) => <li key={o}>{o}</li>)}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
