"use client";

import Link from "next/link";
import { useState } from "react";
import { BILLING_GROUPS, CUSTOMERS, MONTH_BASE, type BillingGroupId, type CustomerId, type Invoice } from "@/lib/mc/data";
import { lotAmount, num, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { InvoicePreview } from "@/components/mc/docs";
import { BeforeAfter, Btn, Chip, PageHead, Panel, Sheet, TableWrap, Toast } from "@/components/mc/ui";

const GROUP_STATE: Record<BillingGroupId, string> = {
  G1: "11/30締め — 今日が締め処理日",
  G2: "11/20締め — 請求済み（次回 12/20）",
  G3: "11/15締め — 請求済み（次回 12/15）",
  G4: "客先の買掛リスト待ち（12/5 受領予定）",
  G5: "2法人画面で相殺",
};

export default function Billing() {
  const lots = useMc((s) => s.lots);
  const invoices = useMc((s) => s.invoices);
  const closed = useMc((s) => s.closedGroups);
  const closeGroup = useMc((s) => s.closeGroup);
  const [groupOf, setGroupOf] = useState<Record<CustomerId, BillingGroupId>>(() => Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.group])) as Record<CustomerId, BillingGroupId>);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const liveSold = (id: CustomerId) => lots.filter((l) => l.customerId === id && l.status === "sold");
  const g1Customers = CUSTOMERS.filter((c) => c.group === "G1");
  const g1Total = g1Customers.reduce((s, c) => s + MONTH_BASE[c.id].amount + liveSold(c.id).reduce((a, l) => a + lotAmount(l), 0), 0);

  return (
    <div>
      <PageHead kicker="販売" title="売上・請求（5グループ）" sub="照合OKで売上計上したロットを、請求グループの締め日ごとにまとめて請求書にします。" />
      <BeforeAfter
        before="請求グループの集約が硬く、請求書発行・得意先元帳の出力は基幹の外（人の手・紙）。"
        after="締め日・支払条件ごとの5グループで締め処理。得意先のグループ付け替えも画面から。請求書は作業票No.単位の明細つきで発行。"
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
        {BILLING_GROUPS.map((g) => {
          const isClosedToday = g.id === "G1" && closed.includes("G1");
          return (
            <div key={g.id} className={`rounded-xl border bg-white p-3 ${g.id === "G1" && !isClosedToday ? "border-brand-400 ring-2 ring-brand-100" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">{g.name}</span>
                <Chip tone="gray">{g.id}</Chip>
              </div>
              <div className="mt-1 text-[11.5px] text-ink-muted">締め：{g.cutoff}／{g.pay}</div>
              <div className="mt-1 text-[11.5px] text-ink-muted">{g.id === "G5" ? "関係会社A（仮称）" : `得意先 ${CUSTOMERS.filter((c) => groupOf[c.id] === g.id).length}社`}</div>
              <div className={`mt-2 text-[11.5px] font-semibold ${g.id === "G1" && !isClosedToday ? "text-brand-600" : "text-ink-soft"}`}>
                {isClosedToday ? "11/30締め — 請求書発行済み" : GROUP_STATE[g.id]}
              </div>
              {g.id === "G5" && <Link href="/mc/intercompany" className="mt-1 inline-block text-[11.5px] font-semibold text-brand-600 hover:underline">2法人画面へ ›</Link>}
            </div>
          );
        })}
      </div>

      <Panel
        title="月末締め（G1）11月度の締め処理"
        sub="11/1〜11/30 に売上計上したロット（月内の計上分＋本日照合分）"
        right={
          !closed.includes("G1") ? (
            <Btn variant="primary" size="sm" onClick={() => { const made = closeGroup("G1"); flash(`${made.length}社の請求書を発行しました`); }}>締め処理を実行（{g1Customers.length}社）</Btn>
          ) : (
            <Chip tone="green">締め処理済み</Chip>
          )
        }
        className="mb-5"
        pad={false}
      >
        <div className="p-4 pt-1">
          <TableWrap minW={480}>
            <thead><tr><th>得意先</th><th className="num">月内計上（ロット）</th><th className="num">本日照合分</th><th className="num">税抜金額</th><th>状態</th></tr></thead>
            <tbody>
              {g1Customers.map((c) => {
                const live = liveSold(c.id);
                const inv = invoices.find((i) => i.customerId === c.id && i.period.startsWith("11月度（11/1"));
                return (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.short}</td>
                    <td className="num">{num(MONTH_BASE[c.id].lots)}</td>
                    <td className="num">{inv ? "—" : `${live.length}件 / ${yen(live.reduce((a, l) => a + lotAmount(l), 0))}`}</td>
                    <td className="num">{inv ? yen(inv.amount) : yen(MONTH_BASE[c.id].amount + live.reduce((a, l) => a + lotAmount(l), 0))}</td>
                    <td>{inv ? <button onClick={() => setPreview(inv)} className="font-semibold text-brand-600 hover:underline">{inv.id} を見る</button> : <Chip tone="blue">締め前</Chip>}</td>
                  </tr>
                );
              })}
              {!closed.includes("G1") && (
                <tr><td className="font-bold">合計</td><td /><td /><td className="num font-bold">{yen(g1Total)}</td><td /></tr>
              )}
            </tbody>
          </TableWrap>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="発行済みの請求書" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap minW={420}>
              <thead><tr><th>請求書No</th><th>得意先</th><th>期間</th><th className="num">税込</th><th>状態</th></tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td><button onClick={() => setPreview(i)} className="font-mono text-brand-600 hover:underline">{i.id}</button></td>
                    <td>{CUSTOMERS.find((c) => c.id === i.customerId)!.short}</td>
                    <td className="text-[11.5px]">{i.period}</td>
                    <td className="num">{yen(i.amount + i.tax)}</td>
                    <td>{i.status === "paid" ? <Chip tone="green">入金済</Chip> : <Chip tone="amber">入金待ち</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
        </Panel>

        <Panel title="得意先の請求グループ" sub="付け替えは次回の締めから反映（デモ）" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap minW={300}>
              <thead><tr><th>得意先</th><th>受注の経路</th><th>請求グループ</th></tr></thead>
              <tbody>
                {CUSTOMERS.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.short}</td>
                    <td className="text-[11.5px] text-ink-muted">{c.channel}</td>
                    <td>
                      <select
                        value={groupOf[c.id]}
                        onChange={(e) => { setGroupOf({ ...groupOf, [c.id]: e.target.value as BillingGroupId }); flash(`${c.short} を「${BILLING_GROUPS.find((g) => g.id === e.target.value)!.name}」に付け替えました（次回の締めから）`); }}
                        className="h-8 rounded-md border border-line px-2 text-[12px]"
                      >
                        {BILLING_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.id} {g.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
        </Panel>
      </div>

      <Sheet open={!!preview} onClose={() => setPreview(null)} title="請求書（印刷イメージ）">
        {preview && <InvoicePreview inv={preview} />}
      </Sheet>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
