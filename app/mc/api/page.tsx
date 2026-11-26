"use client";

import { useState } from "react";
import { BeforeAfter, Chip, PageHead, Panel } from "@/components/mc/ui";

const APIS = [
  { m: "POST", p: "/api/v1/orders/import", d: "受注の登録（EDI・顧客ポータル・AI読み取りから）", who: "客先EDI／ポータル／AI読み取り" },
  { m: "GET", p: "/api/v1/lots?factory=F03&status=processing", d: "ロット（作業票）の一覧", who: "BI／現場端末" },
  { m: "POST", p: "/api/v1/lots/{ticketNo}/complete", d: "完成数量の登録", who: "ハンディ端末／設備" },
  { m: "GET", p: "/api/v1/masters/items/{partNo}", d: "品番マスタ（工程1〜6の作業条件つき）", who: "設備の自動運転（FA）" },
  { m: "POST", p: "/api/v1/fa/sync", d: "承認済みの作業条件を設備へ配信", who: "設備の自動運転（FA）" },
  { m: "GET", p: "/api/v1/journals?from=2026-11-01&to=2026-11-30", d: "仕訳（会計連携）", who: "会計ソフト" },
];

const SAMPLE = `POST /api/v1/orders/import
{
  "source": "EDI",
  "customerCode": "C003",
  "factory": "F04",
  "slipNo": "EDI-20261201-03",
  "lines": [
    { "partNo": "48231-60A02", "boxes": 12, "qty": 2400,
      "lotNo": "OH-4471", "dueDate": "2026-12-03" }
  ]
}

→ 201 Created
{
  "lots": [
    { "ticketNo": "KF261201-101", "h3": null,
      "status": "ticketed" }
  ],
  "rejected": []
}`;

export default function Api() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHead kicker="管理（推奨要件：REST API）" title="API・EDI連携" sub="客先とのデータのやり取り、設備の自動運転、会計ソフト、BIをAPIでつなぎます。" />
      <BeforeAfter before="自社の追加開発部分がAPIでつながらず、CSVだけ。EDIや顧客ポータルとの連携ができない。" after="受注・ロット・マスタ・仕訳をREST APIで公開。EDIで来る客先は人の手を通らず受注になり、設備とはマスタを同期。" />
      <Panel title="つながる相手" className="mb-5">
        <div className="grid grid-cols-2 gap-2 text-center text-[12px] sm:grid-cols-3 lg:grid-cols-6">
          {["客先EDI", "顧客ポータル", "複合機・FAX（AI読み取り）", "設備の自動運転（FA）", "会計ソフト", "BI"].map((x) => (
            <div key={x} className="rounded-lg border border-line bg-surface-sunken px-2 py-3 font-semibold text-ink">{x}</div>
          ))}
        </div>
        <div className="my-2 text-center text-[18px] text-brand-400">⇅</div>
        <div className="rounded-lg bg-navy px-4 py-3 text-center text-[13px] font-bold text-white">新基幹システム（社内サーバー）— REST API</div>
      </Panel>
      <Panel title="APIの例" right={<button onClick={() => setOpen(!open)} className="text-[12px] font-semibold text-brand-600">{open ? "サンプルを閉じる" : "受注登録のサンプルを見る"}</button>}>
        <ul className="divide-y divide-line-subtle">
          {APIS.map((a) => (
            <li key={a.p} className="flex flex-wrap items-center gap-2 py-2.5">
              <Chip tone={a.m === "GET" ? "green" : "blue"}>{a.m}</Chip>
              <code className="break-all font-mono text-[12px] text-ink">{a.p}</code>
              <span className="w-full text-[12px] text-ink-muted sm:ml-auto sm:w-auto">{a.d}｜{a.who}</span>
            </li>
          ))}
        </ul>
        {open && <pre className="mt-3 overflow-x-auto rounded-lg bg-[#0f1b2a] p-3 font-mono text-[11.5px] leading-relaxed text-emerald-200">{SAMPLE}</pre>}
      </Panel>
    </div>
  );
}
