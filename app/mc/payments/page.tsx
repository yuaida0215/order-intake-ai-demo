"use client";

import { useState } from "react";
import { INITIAL_DEPOSITS, customerById } from "@/lib/mc/data";
import { yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, PageHead, Panel, Sheet, Toast } from "@/components/mc/ui";

export default function Payments() {
  const invoices = useMc((s) => s.invoices);
  const deposits = useMc((s) => s.deposits);
  const applyDeposit = useMc((s) => s.applyDeposit);
  const [letter, setLetter] = useState(false);
  const [toast, setToast] = useState("");
  const open = invoices.filter((i) => i.status !== "paid");
  const doneCount = Object.keys(deposits).length;
  const accDep = INITIAL_DEPOSITS.find((d) => d.suggestion.kind === "acceptance")!;
  const accInv = invoices.find((i) => i.id === accDep.suggestion.invoiceId)!;

  const apply = (id: string, msg: string) => {
    applyDeposit(id);
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <div>
      <PageHead kicker="販売" title="入金消込・検収差額" sub="銀行の入金データを取り込むと、AIが請求書との消込候補と、差額の理由を出します。" />
      <BeforeAfter
        before="入金を見て請求と手で突き合わせ。検収は客先の買掛リストと自社の得意先元帳を突き合わせ、差額は書面で調整。"
        after="入金と請求を自動で突き合わせ。差額は「振込手数料」「検収差額（不良返品など）」と理由まで出す。差額調整書の下書きもその場で。"
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-white p-3"><div className="text-[11.5px] text-ink-muted">11/30 着金</div><div className="text-[22px] font-bold">{INITIAL_DEPOSITS.length}件</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-[11.5px] text-emerald-700">消込済み</div><div className="text-[22px] font-bold text-emerald-700">{doneCount}件</div></div>
        <div className="rounded-xl border border-line bg-white p-3"><div className="text-[11.5px] text-ink-muted">入金待ちの請求</div><div className="text-[22px] font-bold">{open.length}件</div></div>
      </div>

      <Panel title="入金データ（銀行から取込）と消込候補" pad={false}>
        <ul className="divide-y divide-line-subtle">
          {INITIAL_DEPOSITS.map((d) => {
            const inv = invoices.find((i) => i.id === d.suggestion.invoiceId)!;
            const state = deposits[d.id];
            const k = d.suggestion.kind;
            return (
              <li key={d.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1.3fr_auto] md:items-center">
                <div>
                  <div className="font-mono text-[12px] text-ink-muted">{d.date}　{d.id}</div>
                  <div className="font-mono text-[13px] font-semibold text-ink">{d.payerKana}</div>
                  <div className="text-[16px] font-bold tabular-nums text-ink">{yen(d.amount)}</div>
                </div>
                <div className="rounded-lg bg-surface-sunken p-3 text-[12px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">→ {customerById(inv.customerId).short}　{inv.id}</span>
                    <span className="tabular-nums text-ink-muted">請求 {yen(inv.amount + inv.tax)}</span>
                    {k === "exact" ? <Chip tone="green">完全一致</Chip> : k === "fee" ? <Chip tone="amber">差額 {yen(d.suggestion.diff)}</Chip> : <Chip tone="red">差額 {yen(d.suggestion.diff)}</Chip>}
                  </div>
                  <div className="mt-1 leading-relaxed text-ink-soft">AI：{d.suggestion.reason}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {state ? (
                    <Chip tone="green">消込済み</Chip>
                  ) : k === "exact" ? (
                    <Btn size="sm" variant="primary" onClick={() => apply(d.id, "消込しました")}>消込</Btn>
                  ) : k === "fee" ? (
                    <Btn size="sm" variant="primary" onClick={() => apply(d.id, `消込し、${Math.abs(d.suggestion.diff).toLocaleString()}円を支払手数料で仕訳しました`)}>手数料処理して消込</Btn>
                  ) : (
                    <>
                      <Btn size="sm" onClick={() => setLetter(true)}>差額調整書の下書き</Btn>
                      <Btn size="sm" variant="primary" onClick={() => apply(d.id, `消込し、${Math.abs(d.suggestion.diff).toLocaleString()}円を売上値引で仕訳しました`)}>検収差額で消込</Btn>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Sheet open={letter} onClose={() => setLetter(false)} title="差額調整書（AI下書き）">
        <div className="rounded-lg border border-slate-300 bg-white p-4 text-[13px] leading-relaxed text-slate-800">
          <div className="text-right text-[12px]">2026年12月1日</div>
          <div className="mt-2 font-bold">播磨鍛造株式会社　購買ご担当者様</div>
          <div className="mt-3 text-center text-[16px] font-bold tracking-[0.2em]">差額調整のご連絡</div>
          <p className="mt-3">平素より格別のお引き立てを賜り、誠にありがとうございます。11月30日にお振込みいただきました10月度ご請求分につきまして、下記のとおり差額を確認いたしましたのでご連絡申し上げます。</p>
          <table className="mt-3 w-full border-collapse text-[12px]">
            <tbody>
              {[
                ["ご請求金額（INV-2610-0018）", yen(accInv.amount + accInv.tax)],
                ["ご入金額", yen(accDep.amount)],
                ["差額", yen(Math.abs(accDep.suggestion.diff))],
                ["差額の内容", "10/24納品分 ナックルアーム（34120-HM051）不良返品139個（約172kg）分の減額（貴社 買掛リスト記載）"],
              ].map(([k, v]) => (
                <tr key={k}><td className="w-48 border border-slate-300 bg-slate-50 px-2 py-1">{k}</td><td className="border border-slate-300 px-2 py-1">{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3">上記差額は売上値引として処理させていただきます。内容に相違がございましたら、お手数ですがご連絡くださいますようお願い申し上げます。</p>
          <div className="mt-3 text-right">株式会社ＭＣシステムズ 総務部</div>
        </div>
        <div className="mt-3 flex gap-2"><Btn variant="primary" onClick={() => setLetter(false)}>この内容で保存</Btn></div>
      </Sheet>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
