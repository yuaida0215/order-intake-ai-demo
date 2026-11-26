"use client";

import { useState } from "react";
import { BILLING_GROUPS, CUSTOMERS, FACTORIES, MONTH_BASE, customerById, factoryById, type BillingGroupId, type FactoryId, type Invoice } from "@/lib/mc/data";
import { lotAmount, num, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { InvoicePreview } from "@/components/mc/docs";
import { BeforeAfter, Btn, Chip, PageHead, Panel, Sheet, TableWrap, Toast } from "@/components/mc/ui";

export default function Billing() {
  const lots = useMc((s) => s.lots);
  const invoices = useMc((s) => s.invoices);
  const closed = useMc((s) => s.closedGroups);
  const closeGroup = useMc((s) => s.closeGroup);
  const fg = useMc((s) => s.factoryGroup);
  const setFactoryGroup = useMc((s) => s.setFactoryGroup);
  const [sel, setSel] = useState<BillingGroupId>("G1");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const factoriesOf = (g: BillingGroupId) => FACTORIES.filter((f) => fg[f.id] === g);
  const group = BILLING_GROUPS.find((g) => g.id === sel)!;
  const selFactories = factoriesOf(sel).map((f) => f.id);

  // 選んだグループの、得意先ごとの集約（締め前）
  const rows = CUSTOMERS.map((c) => {
    const lines = selFactories
      .map((f) => {
        const base = MONTH_BASE[c.id][f];
        const live = lots.filter((l) => l.customerId === c.id && l.factoryId === f && l.status === "sold");
        if (!base && !live.length) return null;
        return { f, lots: (base?.lots ?? 0) + live.length, live: live.length, amount: (base?.amount ?? 0) + live.reduce((s, l) => s + lotAmount(l), 0) };
      })
      .filter(Boolean) as { f: FactoryId; lots: number; live: number; amount: number }[];
    return { c, lines, total: lines.reduce((s, x) => s + x.amount, 0) };
  }).filter((r) => r.lines.length);
  const groupTotal = rows.reduce((s, r) => s + r.total, 0);
  const isClosed = closed.includes(sel);

  const ledger = () => {
    const head = "請求書No,得意先コード,得意先,請求グループ,発行元,期間,ロット数,税抜,消費税,税込,状態";
    const body = invoices.map((i) => {
      const c = customerById(i.customerId);
      return [i.id, c.code, c.short, BILLING_GROUPS.find((g) => g.id === i.group)!.name, i.issuer, i.period, i.lots, i.amount, i.tax, i.amount + i.tax, i.status === "paid" ? "入金済" : "入金待ち"].join(",");
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + [head, ...body].join("\r\n")], { type: "text/csv" }));
    a.download = "得意先元帳_202611.csv";
    a.click();
  };

  return (
    <div>
      <PageHead
        kicker="販売（RFI 必須｜請求グループ管理）"
        title="売上・請求（5グループ）"
        sub="照合OKで売上計上したロットを、請求グループの単位で集約して請求書にします。同じ得意先なら、グループ内の複数工場の売上が1枚の請求書になります。"
        right={<Btn size="sm" onClick={ledger}>得意先元帳を出力（CSV）</Btn>}
      />
      <BeforeAfter
        before="5グループ（名古屋／西日本／厚木／太田／東京）の集約請求に、今のシステムが柔軟に対応できていない。請求書の発行・得意先元帳の出力は基幹の外（人の手・紙）。"
        after="工場→請求グループの対応表を持ち、締め処理で得意先ごとに複数工場の売上を1枚に（工場別の内訳つき）。グループの組み替えも画面から。"
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
        {BILLING_GROUPS.map((g) => {
          const fs = factoriesOf(g.id);
          const active = g.id === sel;
          return (
            <button
              key={g.id}
              onClick={() => setSel(g.id)}
              className={`rounded-xl border bg-white p-3 text-left transition ${active ? "border-brand-400 ring-2 ring-brand-100" : "border-line hover:border-brand-200"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold text-ink">{g.name}</span>
                {closed.includes(g.id) ? <Chip tone="green">締め済</Chip> : <Chip tone="gray">{g.id}</Chip>}
              </div>
              <div className="mt-1 text-[11.5px] text-ink-muted">発行元：{g.issuer}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-muted">対象：{fs.length ? fs.map((f) => f.short).join("・") : g.id === "G5" ? "東京事務所" : "なし"}</div>
            </button>
          );
        })}
      </div>

      <Panel
        title={`${group.name} — 11月度の締め処理`}
        sub={`発行元 ${group.issuer}｜対象 ${selFactories.length ? selFactories.map((f) => factoryById(f).short).join("・") : sel === "G5" ? "東京事務所" : "なし"}`}
        right={
          isClosed ? <Chip tone="green">締め処理済み</Chip> : rows.length > 0 ? (
            <Btn variant="primary" size="sm" onClick={() => { const made = closeGroup(sel); flash(`${group.name}：${made.length}社の請求書を発行しました（発行元 ${group.issuer}）`); }}>
              締め処理を実行（{rows.length}社）
            </Btn>
          ) : null
        }
        className="mb-5"
        pad={false}
      >
        <div className="p-4 pt-1">
          {rows.length === 0 && !isClosed ? (
            <p className="py-6 text-center text-[12.5px] text-ink-muted">
              {sel === "G5" ? "東京事務所の売上は、このデモでは対象がありません（東京グループの中身は確認事項）。" : "このグループに売上はありません。"}
            </p>
          ) : (
            <TableWrap minW={520}>
              <thead><tr><th>得意先</th><th>工場別の内訳</th><th className="num">ロット</th><th className="num">税抜金額</th><th>請求書</th></tr></thead>
              <tbody>
                {(isClosed ? invoices.filter((i) => i.group === sel && i.period.startsWith("11月度")).map((i) => ({ c: customerById(i.customerId), lines: i.breakdown.map((b) => ({ f: b.factoryId, lots: b.lots, live: 0, amount: b.amount })), total: i.amount, inv: i })) : rows.map((r) => ({ ...r, inv: undefined as Invoice | undefined }))).map((r) => (
                  <tr key={r.c.id}>
                    <td className="font-semibold">{r.c.short}<div className="font-mono text-[10.5px] font-normal text-ink-muted">{r.c.code}</div></td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.lines.map((x) => (
                          <span key={x.f} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px]">
                            {factoryById(x.f).short} {yen(x.amount)}{x.live ? <span className="text-brand-600">（本日+{x.live}）</span> : null}
                          </span>
                        ))}
                      </div>
                      {r.lines.length > 1 && <div className="mt-0.5 text-[10.5px] font-semibold text-brand-600">{r.lines.length}工場分を1枚に集約</div>}
                    </td>
                    <td className="num">{num(r.lines.reduce((s, x) => s + x.lots, 0))}</td>
                    <td className="num font-semibold">{yen(r.total)}</td>
                    <td>{r.inv ? <button onClick={() => setPreview(r.inv!)} className="font-mono text-[12px] font-semibold text-brand-600 hover:underline">{r.inv.id}</button> : <Chip tone="blue">締め前</Chip>}</td>
                  </tr>
                ))}
                {!isClosed && rows.length > 0 && (
                  <tr><td className="font-bold">合計</td><td /><td /><td className="num font-bold">{yen(groupTotal)}</td><td /></tr>
                )}
              </tbody>
            </TableWrap>
          )}
          <p className="mt-2 text-[11px] text-ink-muted">締め日・支払条件はRFIに記載がないため、ここでは11月度（11/1〜11/30）としています。</p>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="発行済みの請求書" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap minW={460}>
              <thead><tr><th>請求書No</th><th>得意先</th><th>グループ</th><th className="num">税込</th><th>状態</th></tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td><button onClick={() => setPreview(i)} className="font-mono text-brand-600 hover:underline">{i.id}</button><div className="text-[10.5px] text-ink-muted">{i.period.slice(0, 4)}</div></td>
                    <td>{customerById(i.customerId).short}</td>
                    <td className="text-[11.5px]">{BILLING_GROUPS.find((g) => g.id === i.group)!.name}</td>
                    <td className="num">{yen(i.amount + i.tax)}</td>
                    <td>{i.status === "paid" ? <Chip tone="green">入金済</Chip> : <Chip tone="amber">入金待ち</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
        </Panel>

        <Panel title="請求グループの設定" sub="工場の付け替えは次の締めから反映（RFI：グループ設定が柔軟に変更できること）" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap minW={300}>
              <thead><tr><th>工場</th><th>請求グループ（発行元）</th></tr></thead>
              <tbody>
                {FACTORIES.map((f) => (
                  <tr key={f.id}>
                    <td className="font-semibold">{f.name}</td>
                    <td>
                      <select
                        value={fg[f.id]}
                        onChange={(e) => {
                          const g = BILLING_GROUPS.find((x) => x.id === e.target.value)!;
                          setFactoryGroup(f.id, g.id);
                          flash(`${f.name} を「${g.name}」（発行元 ${g.issuer}）に付け替えました`);
                        }}
                        className="h-8 w-full rounded-md border border-line px-2 text-[12px]"
                      >
                        {BILLING_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}（{g.issuer}）</option>)}
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
