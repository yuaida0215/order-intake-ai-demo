"use client";

import Link from "next/link";
import { useState } from "react";
import { customerById, factoryById, itemByPartNo } from "@/lib/mc/data";
import { lotAmount, num, yen } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, PageHead, Panel, TableWrap, Toast } from "@/components/mc/ui";

export default function Matching() {
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const matchLots = useMc((s) => s.matchLots);
  const [toast, setToast] = useState("");
  const rows = inScope(lots, scope).filter((l) => l.status === "delivered");
  const ok = rows.filter((l) => (l.defectQty ?? 0) === 0);
  const diff = rows.filter((l) => (l.defectQty ?? 0) > 0);

  const run = (ids: string[], msg: string) => {
    matchLots(ids);
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <div>
      <PageHead kicker="受託加工 STEP 5" title="照合" sub="注文書×完了票、納品書（控）×完了票 の2つの照合を自動で行い、一致したものは売上計上します。" />
      <BeforeAfter
        before="製造部（得意先による）と総務（MCR処理分）が、注文書×完了票、納品書（控）×完了票を紙で突き合わせる。客先注文書に作業票No.を手で転記。"
        after="作業票No.で全部つながっているので照合は自動。一致したものはまとめて売上計上。人が見るのは「差異あり」だけ。作業票No.の手転記もなくなる。"
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-white p-3"><div className="text-[11.5px] text-ink-muted">照合待ち</div><div className="text-[22px] font-bold">{rows.length}件</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-[11.5px] text-emerald-700">一致（自動）</div><div className="text-[22px] font-bold text-emerald-700">{ok.length}件</div></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><div className="text-[11.5px] text-rose-600">差異あり</div><div className="text-[22px] font-bold text-rose-600">{diff.length}件</div></div>
      </div>

      {diff.length > 0 && (
        <Panel title="差異あり — 人が確認するもの" className="mb-5" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap>
              <thead><tr><th>作業票No</th><th>得意先</th><th>品番</th><th className="num">注文書</th><th className="num">完了票</th><th className="num">納品書（控）</th><th>理由（AI）</th><th></th></tr></thead>
              <tbody>
                {diff.map((l) => (
                  <tr key={l.id}>
                    <td><Link href={`/mc/lots/${l.id}`} className="font-mono text-brand-600 hover:underline">{l.ticketNo}</Link></td>
                    <td>{customerById(l.customerId).short}</td>
                    <td className="font-mono">{l.partNo}</td>
                    <td className="num">{num(l.qty)}</td>
                    <td className="num font-bold text-rose-600">{num(l.completedQty ?? 0)}</td>
                    <td className="num">{num(l.completedQty ?? 0)}</td>
                    <td className="text-[12px]">完了票の不良数 {l.defectQty} と一致。注文書の数量を完成数量で計上し、不良数を客先へ連絡</td>
                    <td><Btn size="sm" onClick={() => run([l.id], `${l.ticketNo} を完成数量で売上計上しました`)}>完成数量で計上</Btn></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
        </Panel>
      )}

      <Panel
        title="一致 — 自動で照合済みにできるもの"
        right={ok.length > 0 && <Btn variant="primary" size="sm" onClick={() => run(ok.map((l) => l.id), `${ok.length}件を照合済みにして売上計上しました`)}>{ok.length}件をまとめて売上計上</Btn>}
        pad={false}
      >
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>作業票No</th><th>工場</th><th>得意先</th><th>品番 / 商品名</th><th className="num">注文書</th><th className="num">完了票</th><th className="num">納品書（控）</th><th>照合</th><th className="num">売上</th></tr></thead>
            <tbody>
              {ok.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/mc/lots/${l.id}`} className="font-mono text-brand-600 hover:underline">{l.ticketNo}</Link></td>
                  <td>{factoryById(l.factoryId).short}</td>
                  <td>{customerById(l.customerId).short}</td>
                  <td><div className="font-mono text-[12px]">{l.partNo}</div><div className="text-[11px] text-ink-muted">{itemByPartNo(l.partNo)!.name}</div></td>
                  <td className="num">{num(l.qty)}</td>
                  <td className="num">{num(l.completedQty ?? l.qty)}</td>
                  <td className="num">{num(l.completedQty ?? l.qty)}</td>
                  <td><Chip tone="green">2つとも一致</Chip></td>
                  <td className="num">{yen(lotAmount(l))}</td>
                </tr>
              ))}
              {ok.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-ink-muted">照合待ちはありません</td></tr>}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
