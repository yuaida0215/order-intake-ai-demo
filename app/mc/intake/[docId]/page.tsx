"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { INTAKE_DOCS, customerById, factoryById, itemByPartNo, type Lot } from "@/lib/mc/data";
import { judgeH3, md, num, pct } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { OrderDocImage, WorkTicket } from "@/components/mc/docs";
import { Btn, Chip, H3Badge, PageHead, Panel, Sheet, TableWrap } from "@/components/mc/ui";

const STEPS = ["文字を読み取り中（手書き・訂正線も含む）", "品番マスタと照合中（入数・商品コード・工程条件）", "過去の受注 1,502,981件から3Hを判定中", "取込用の形に整えています"];

export default function IntakeRead() {
  const { docId } = useParams<{ docId: string }>();
  const doc = INTAKE_DOCS.find((d) => d.id === docId);
  const done = useMc((s) => (doc ? s.docsDone[doc.id] : undefined));
  const lots = useMc((s) => s.lots);
  const importDoc = useMc((s) => s.importDoc);
  const [phase, setPhase] = useState<"idle" | "reading" | "read" | "imported">(done ? "imported" : "idle");
  const [step, setStep] = useState(0);
  const [ticket, setTicket] = useState<Lot | null>(null);

  useEffect(() => {
    if (phase !== "reading") return;
    if (step >= STEPS.length) {
      setPhase("read");
      return;
    }
    const t = setTimeout(() => setStep((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [phase, step]);

  if (!doc) return <div className="py-20 text-center text-ink-muted">注文書が見つかりません</div>;
  const c = customerById(doc.customerId);
  const rows = doc.rows.map((r) => {
    const item = itemByPartNo(r.partNo);
    const h = judgeH3(r.partNo);
    const state = !item ? "reject" : h.h3 ? "check" : r.handwritten ? "fixed" : "ok";
    return { r, item, h, state };
  });
  const okCount = rows.filter((x) => x.state !== "reject").length;
  const rejectCount = rows.length - okCount;
  const importedLots = done ? lots.filter((l) => done.imported.includes(l.id)) : [];

  const exportCsv = () => {
    const head = ["便", "ヘッダー備考", "品番", "加工内容", "箱数", "数量", "納期", "指示番号", "明細備考"];
    const body = rows.map(({ r, item }, i) => [doc.bin, `${c.short} ${doc.kind}`, r.partNo, item?.spec ?? "（マスタ未登録）", r.boxes, r.qty, md(r.due), `${doc.slipNo}-${i + 1}`, r.note ?? ""]);
    const csv = [head, ...body].map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `支給伝票_取込用_${doc.slipNo}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHead
        kicker={`受託加工 STEP 0｜${factoryById(doc.factoryId).name}`}
        title={`${c.short}「${doc.kind}」`}
        sub={`${doc.channel}・受信 ${doc.receivedAt}・伝票No. ${doc.slipNo}`}
        right={<Btn href="/mc/intake" size="sm">← 一覧へ</Btn>}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <Panel title="届いた注文書（原本）" sub={doc.channel === "EDI" ? "EDIのデータそのもの" : "部品と一緒に届いた紙をスキャンしたもの"}>
          <OrderDocImage doc={doc} />
        </Panel>

        <div className="space-y-5">
          {phase === "idle" && (
            <Panel title="AI読み取り">
              <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
                読み取るのは、取込用Excelの<b>白い列</b>（人が伝票を見て打っていた所）だけです。余計な欄は読みません。青い列（商品コード・入数など）はマスタから引きます。
              </p>
              <Btn variant="ai" onClick={() => { setStep(0); setPhase("reading"); }}>AIで読み取る</Btn>
            </Panel>
          )}

          {phase === "reading" && (
            <Panel title="AI読み取り中…">
              <ul className="space-y-2">
                {STEPS.map((s, i) => (
                  <li key={s} className={`flex items-center gap-2 text-[13px] ${i < step ? "text-emerald-700" : i === step ? "font-semibold text-brand-600" : "text-ink-faint"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${i < step ? "bg-emerald-100" : i === step ? "animate-pulse-soft bg-brand-100" : "bg-slate-100"}`}>{i < step ? "✓" : i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="ai-gradient-anim h-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
              </div>
            </Panel>
          )}

          {(phase === "read" || phase === "imported") && (
            <Panel
              title="読み取り結果"
              sub={phase === "imported" ? "受入実行済み" : "取込用Excel「支給伝票」シートと同じ項目"}
              right={<Btn size="sm" onClick={exportCsv}>取込用CSVを書き出す（今の基幹へ）</Btn>}
              pad={false}
            >
              <div className="p-4 pt-2">
                <TableWrap>
                  <thead>
                    <tr>
                      <th>判定</th><th>品番</th><th>商品名</th><th>商品コード</th><th className="num">入数</th><th className="num">箱数</th><th className="num">数量</th><th>ロットNo</th><th>納期</th><th>3H</th><th className="num">信頼度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ r, item, h, state }) => (
                      <tr key={r.partNo + r.lotNo}>
                        <td>
                          {state === "reject" ? <Chip tone="red">弾く</Chip> : state === "check" ? <Chip tone="amber">要確認</Chip> : state === "fixed" ? <Chip tone="cyan">AI補正</Chip> : <Chip tone="green">OK</Chip>}
                        </td>
                        <td className="font-mono">{r.partNo}</td>
                        <td>{item?.name ?? <span className="text-rose-600">マスタ未登録</span>}</td>
                        <td className="font-mono text-ink-muted">{item?.code ?? "—"}</td>
                        <td className="num">{item?.perBox ?? r.perBox}</td>
                        <td className={`num ${r.handwritten && !r.mergedFrom ? "bg-accent-soft font-bold" : ""}`}>{r.boxes}</td>
                        <td className={`num ${r.mergedFrom ? "bg-accent-soft font-bold" : ""}`}>{num(r.qty)}</td>
                        <td>{r.lotNo}</td>
                        <td>{md(r.due)}</td>
                        <td><H3Badge h3={h.h3} /></td>
                        <td className="num">{pct(r.conf, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                <ul className="mt-3 space-y-1.5">
                  {rows.filter((x) => x.r.note || x.h.h3).map(({ r, h }) => (
                    <li key={r.partNo + "n"} className="rounded-lg bg-surface-sunken px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
                      <span className="mr-1 font-mono font-semibold text-ink">{r.partNo}</span>
                      {r.note && <span className="mr-2">✎ {r.note}</span>}
                      {h.h3 && <span><H3Badge h3={h.h3} /> {h.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          )}

          {phase === "read" && (
            <Panel title="受注一括取込（今の「受注一括取込発行」と同じ流れ）">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-[11.5px] text-emerald-700">取り込める件数</div>
                  <div className="text-[24px] font-bold text-emerald-700">{okCount}件</div>
                </div>
                <div className={`rounded-lg border p-3 ${rejectCount ? "border-rose-200 bg-rose-50" : "border-line bg-white"}`}>
                  <div className={`text-[11.5px] ${rejectCount ? "text-rose-600" : "text-ink-muted"}`}>弾かれる件数（受入エラー）</div>
                  <div className={`text-[24px] font-bold ${rejectCount ? "text-rose-600" : "text-ink-faint"}`}>{rejectCount}件</div>
                </div>
              </div>
              {rejectCount > 0 && <p className="mt-2 text-[12px] text-ink-muted">弾かれた品番は、受入実行と同時に「新規品登録表」を起票して各部門に回します（CSVへの書き出し・出し直しは不要）。</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={() => { importDoc(doc.id); setPhase("imported"); }}>
                  受入実行（受注伝票を作って作業票を出す）
                </Btn>
              </div>
            </Panel>
          )}

          {phase === "imported" && done && (
            <Panel title="受入実行しました" sub="作業票を発行。部品につけて製造部へ">
              <ul className="divide-y divide-line-subtle">
                {importedLots.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 py-2 text-[12.5px]">
                    <span className="font-mono font-semibold">{l.ticketNo}</span>
                    <span className="font-mono text-ink-muted">{l.partNo}</span>
                    <span>{num(l.qty)}個</span>
                    <H3Badge h3={l.h3} />
                    <span className="ml-auto flex gap-1.5">
                      <Btn size="sm" onClick={() => setTicket(l)}>作業票を見る</Btn>
                      <Btn size="sm" href={`/mc/lots/${l.id}`}>ロット詳細</Btn>
                    </span>
                  </li>
                ))}
              </ul>
              {done.rejected.length > 0 && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-700">
                  {done.rejected.join("・")} はマスタ未登録のため「新規品登録表」を起票しました（製造部 → 品質保証部 → 総務の順に回覧）。
                  <Link href="/mc/masters" className="ml-1 font-semibold underline">回覧状況を見る</Link>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn variant="primary" href="/mc/completion">次へ：完成入力</Btn>
                <Btn href="/mc/intake">ほかの注文書</Btn>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <Sheet open={!!ticket} onClose={() => setTicket(null)} title="作業票（印刷イメージ）">
        {ticket && <WorkTicket lot={ticket} />}
      </Sheet>
    </div>
  );
}
