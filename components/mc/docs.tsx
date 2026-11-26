"use client";

import { customerById, factoryById, itemByPartNo, BILLING_GROUPS, type IntakeDoc, type Invoice, type Lot } from "@/lib/mc/data";
import { lotAmount, md, num, totalKg, yen } from "@/lib/mc/calc";
import { Barcode } from "./ui";

const hand = { fontFamily: '"Comic Sans MS","Segoe Print","Bradley Hand",cursive', color: "#1d3f8f" };

// ------------------------------------------------------------
// 届いた注文書（紙スキャン・FAX・EDI）の見た目
// ------------------------------------------------------------
export function OrderDocImage({ doc }: { doc: IntakeDoc }) {
  const c = customerById(doc.customerId);
  if (doc.channel === "EDI") {
    return (
      <div className="overflow-x-auto rounded-lg border border-line bg-[#0f1b2a] p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
        <div className="mb-1 text-white/40"># {c.name} EDI 納入指示 {doc.slipNo}（受信 {doc.receivedAt}）</div>
        <div className="text-white/60">納入指示No,品番,品名,箱数,数量,ロットNo,納期</div>
        {doc.rows.map((r, i) => (
          <div key={i}>{`${doc.slipNo}-${i + 1},${r.partNo},${r.name},${r.boxes},${r.qty},${r.lotNo},${r.due.replaceAll("-", "/")}`}</div>
        ))}
      </div>
    );
  }
  const fax = doc.channel === "FAX";
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-300 p-3 sm:p-4 ${fax ? "bg-[#f4f4f1] grayscale" : "bg-[#fffdf7]"}`}
      style={fax ? { backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,.025) 0 1px,transparent 1px 3px)" } : undefined}
    >
      {fax && <div className="mb-2 font-mono text-[9.5px] text-slate-500">12/01/2026 08:40 FAX 0567-XX-XXXX {c.short} P.001/001</div>}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-bold tracking-[0.3em] text-slate-800">{doc.kind}</div>
          <div className="mt-1 text-[11px] text-slate-600">株式会社ＭＣシステムズ {factoryById(doc.factoryId).name} 御中</div>
        </div>
        <div className="text-right text-[10.5px] leading-tight text-slate-600">
          <div className="font-bold text-slate-800">{c.name}</div>
          <div>伝票No. {doc.slipNo}</div>
          <div>{doc.bin}　発行 2026/11/30</div>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-[11px] text-slate-800">
          <thead>
            <tr className="bg-slate-200/60">
              {["No", "品番", "品名", "入数", "箱数", "数量", "ロットNo", "納期"].map((h) => (
                <th key={h} className="border border-slate-400 px-1.5 py-1 font-semibold">{h}</th>
              ))}
              <th className="w-14 border-0 bg-transparent" />
            </tr>
          </thead>
          <tbody>
            {(() => { let n = 0; return doc.rows.flatMap((r, i) => {
              if (r.mergedFrom) {
                return r.mergedFrom.map((q, k) => (
                  <tr key={`${i}-${k}`}>
                    <td className="border border-slate-400 px-1.5 py-1 text-center">{++n}</td>
                    <td className="border border-slate-400 px-1.5 py-1 font-mono">{r.partNo}</td>
                    <td className="border border-slate-400 px-1.5 py-1">{r.name}</td>
                    <td className="border border-slate-400 px-1.5 py-1 text-right">{r.perBox}</td>
                    <td className="border border-slate-400 px-1.5 py-1 text-right">{k === 0 ? 2 : 1}</td>
                    <td className="border border-slate-400 px-1.5 py-1 text-right">{num(q)}</td>
                    <td className="border border-slate-400 px-1.5 py-1">{r.lotNo}</td>
                    <td className="border border-slate-400 px-1.5 py-1">{md(r.due)}</td>
                    {k === 0 && (
                      <td rowSpan={r.mergedFrom!.length} className="border-0 pl-1 align-middle" style={hand}>
                        <span className="flex items-center whitespace-nowrap">
                          <span className="text-[30px] leading-none">{"}"}</span>
                          <span className="ml-0.5 inline-block -rotate-6 text-[14px] font-bold">{num(r.qty)}</span>
                        </span>
                      </td>
                    )}
                  </tr>
                ));
              }
              const corrected = r.handwritten && !r.mergedFrom;
              return [
                <tr key={i}>
                  <td className="border border-slate-400 px-1.5 py-1 text-center">{++n}</td>
                  <td className="border border-slate-400 px-1.5 py-1 font-mono">{r.partNo}</td>
                  <td className="border border-slate-400 px-1.5 py-1">{r.name}</td>
                  <td className="border border-slate-400 px-1.5 py-1 text-right">{r.perBox}</td>
                  <td className="relative border border-slate-400 px-1.5 py-1 text-right">
                    {corrected ? (
                      <>
                        <span className="text-slate-500 line-through decoration-2">{r.boxes + 1}</span>
                        <span className="ml-1 inline-block -rotate-6 text-[14px] font-bold" style={hand}>{r.boxes}</span>
                      </>
                    ) : (
                      r.boxes
                    )}
                  </td>
                  <td className="border border-slate-400 px-1.5 py-1 text-right">{corrected ? num((r.boxes + 1) * (r.perBox ?? 1)) : num(r.qty)}</td>
                  <td className="border border-slate-400 px-1.5 py-1">{r.lotNo}</td>
                  <td className="border border-slate-400 px-1.5 py-1">{md(r.due)}</td>
                  <td className="border-0" />
                </tr>,
              ];
            }); })()}
          </tbody>
        </table>
      </div>
      {!fax && (
        <div className="mt-2 flex items-end justify-between">
          <div className="text-[10px] text-slate-500">※ 部品に同梱。現品票を添付のこと</div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-500/70 text-[10px] font-bold text-rose-600/80">検印</div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 作業票 / 現品票 / 完了票（同じ型で表題だけ変える）
// ------------------------------------------------------------
export function WorkTicket({ lot, title = "作 業 票" }: { lot: Lot; title?: "作 業 票" | "現 品 票" | "完 了 票" }) {
  const it = itemByPartNo(lot.partNo)!;
  const c = customerById(lot.customerId);
  const f = factoryById(lot.factoryId);
  const q = title === "作 業 票" ? lot.qty : lot.completedQty ?? lot.qty;
  return (
    <div className="rounded-lg border-2 border-slate-700 bg-white p-3 text-slate-900 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-slate-700 pb-2">
        <div>
          <div className="text-[18px] font-bold tracking-[0.25em]">{title}</div>
          <div className="text-[10.5px] text-slate-600">株式会社ＭＣシステムズ {f.name}　{it.line}</div>
        </div>
        <Barcode value={lot.ticketNo} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] sm:grid-cols-4">
        <Cell k="伝票番号" v={lot.id} />
        <Cell k="得意先" v={c.short} />
        <Cell k="入荷日" v={md(lot.receivedAt)} />
        <Cell k="納期日" v={md(lot.dueDate)} strong />
        <Cell k="品番" v={lot.partNo} />
        <Cell k="商品名" v={it.name} />
        <Cell k="ロットNo" v={lot.lotNo} />
        <Cell k="加工内容" v={it.spec} />
        <Cell k="入数×箱数" v={`${it.perBox}×${lot.boxes}`} />
        <Cell k={title === "作 業 票" ? "数量" : "完成数量"} v={num(q)} strong />
        <Cell k="単重" v={`${it.unitWeightG}g`} />
        <Cell k="総重量" v={`${num(totalKg(q, it.unitWeightG), 2)}kg`} />
      </div>
      {title === "作 業 票" && (
        <>
          <div className="mt-2 text-[10.5px] font-semibold text-slate-600">
            前処理：{[it.pre.degrease && "脱脂", it.pre.bake && "空焼き", it.pre.shot && "ショット"].filter(Boolean).join("・")}
            {it.outsource && `（外注：${it.outsource}）`}
          </div>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-100">
                  {["工程", "処理液", "設備", "パターン", "投入量", "転/回", "傾動", "焼時間", "焼前/焼後"].map((h) => (
                    <th key={h} className="border border-slate-400 px-1 py-0.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {it.steps.map((s, i) => (
                  <tr key={i}>
                    <td className="border border-slate-400 px-1 py-0.5">{i + 1}. {s.step}</td>
                    <td className="border border-slate-400 px-1 py-0.5">{s.liquid}</td>
                    <td className="border border-slate-400 px-1 py-0.5">{s.equipment}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center">{s.pattern}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-right">{s.chargeKg}kg</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-right">{s.rpm}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-right">{s.tilt}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-right">{s.bakeMin}分</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center">{s.preTemp}/{s.postTemp}℃</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10.5px]">
            {["完成数量（手書き）", "不良数", "担当印"].map((k) => (
              <div key={k} className="h-11 rounded border border-slate-400 px-1.5 py-0.5 text-slate-500">{k}</div>
            ))}
          </div>
        </>
      )}
      {title === "完 了 票" && (
        <div className="mt-2 flex flex-wrap gap-3 rounded border border-slate-400 px-2 py-1.5 text-[11.5px]">
          <span>検査：<b>{lot.inspection ?? "合格"}</b></span>
          <span>不良数：<b>{lot.defectQty ?? 0}</b></span>
          <span>完成日：<b>12/1</b></span>
        </div>
      )}
      {lot.h3 && title === "作 業 票" && (
        <div className="mt-2 rounded border-2 border-rose-500 px-2 py-1 text-[11px] font-bold text-rose-600">
          【3H：{lot.h3}】作業前に処理条件を確認すること
        </div>
      )}
    </div>
  );
}

function Cell({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="min-w-0 border-b border-slate-200 py-0.5">
      <div className="text-[9.5px] text-slate-500">{k}</div>
      <div className={`truncate ${strong ? "text-[13px] font-bold" : "font-semibold"}`}>{v}</div>
    </div>
  );
}

// ------------------------------------------------------------
// 納品書
// ------------------------------------------------------------
export function DeliveryNote({ lots, no }: { lots: Lot[]; no: string }) {
  if (!lots.length) return null;
  const c = customerById(lots[0].customerId);
  const f = factoryById(lots[0].factoryId);
  return (
    <div className="rounded-lg border border-slate-400 bg-white p-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[18px] font-bold tracking-[0.3em]">納 品 書</div>
          <div className="mt-1 text-[12px] font-semibold">{c.name} 御中</div>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <div>No. {no}</div>
          <div>2026年12月1日</div>
          <div className="mt-1 font-bold">株式会社ＭＣシステムズ</div>
          <div>{f.name}</div>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              {["作業票No", "品番", "品名", "ロットNo", "箱数", "数量", "金額"].map((h) => (
                <th key={h} className="border border-slate-400 px-1.5 py-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => {
              const it = itemByPartNo(l.partNo)!;
              return (
                <tr key={l.id}>
                  <td className="border border-slate-400 px-1.5 py-1 font-mono">{l.ticketNo}</td>
                  <td className="border border-slate-400 px-1.5 py-1 font-mono">{l.partNo}</td>
                  <td className="border border-slate-400 px-1.5 py-1">{it.name}</td>
                  <td className="border border-slate-400 px-1.5 py-1">{l.lotNo}</td>
                  <td className="border border-slate-400 px-1.5 py-1 text-right">{l.boxes}</td>
                  <td className="border border-slate-400 px-1.5 py-1 text-right">{num(l.completedQty ?? l.qty)}</td>
                  <td className="border border-slate-400 px-1.5 py-1 text-right">{yen(lotAmount(l))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10.5px] text-slate-500">様式：{f.name} 標準様式（得意先指定様式への切替可）　控は照合用に自動保存</div>
    </div>
  );
}

// ------------------------------------------------------------
// 請求書
// ------------------------------------------------------------
export function InvoicePreview({ inv }: { inv: Invoice }) {
  const c = customerById(inv.customerId);
  const g = BILLING_GROUPS.find((x) => x.id === inv.group)!;
  return (
    <div className="rounded-lg border border-slate-400 bg-white p-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[20px] font-bold tracking-[0.4em]">請 求 書</div>
          <div className="mt-2 text-[13px] font-bold">{c.name} 御中</div>
          <div className="mt-1 text-[11px] text-slate-600">{inv.period}／得意先コード {c.code}</div>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <div>No. {inv.id}</div>
          <div>発行日 {inv.issuedAt.replaceAll("-", "/")}</div>
          <div className="mt-1 font-bold">株式会社ＭＣシステムズ</div>
          <div>{inv.issuer}（{g.name}）</div>
          <div>登録番号 T0000000000000</div>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-y-2 border-slate-800 py-2">
        <span className="text-[12px] font-semibold">ご請求金額（税込）</span>
        <span className="text-[22px] font-bold tabular-nums">{yen(inv.amount + inv.tax)}</span>
      </div>
      <table className="mt-3 w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 px-2 py-1 text-left">納品工場</th>
            <th className="border border-slate-400 px-2 py-1 text-right">納品ロット数</th>
            <th className="border border-slate-400 px-2 py-1 text-right">金額（税抜）</th>
          </tr>
        </thead>
        <tbody>
          {inv.breakdown.map((b) => (
            <tr key={b.factoryId}>
              <td className="border border-slate-400 px-2 py-1">{factoryById(b.factoryId).name}</td>
              <td className="border border-slate-400 px-2 py-1 text-right">{num(b.lots)}件</td>
              <td className="border border-slate-400 px-2 py-1 text-right">{yen(b.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="border border-slate-400 px-2 py-1 font-semibold">小計 / 消費税（10%）</td>
            <td className="border border-slate-400 px-2 py-1 text-right">{num(inv.lots)}件</td>
            <td className="border border-slate-400 px-2 py-1 text-right">{yen(inv.amount)} / {yen(inv.tax)}</td>
          </tr>
        </tbody>
      </table>
      {inv.breakdown.length > 1 && <div className="mt-2 text-[11px] font-semibold text-brand-700">{inv.breakdown.length}工場分の売上を、発行元 {inv.issuer} から1枚にまとめて請求</div>}
      <div className="mt-2 text-[10.5px] text-slate-500">明細は納品書（作業票No.単位）ごとに別紙。お支払期日 {inv.dueAt.replaceAll("-", "/")}</div>
      {inv.diffNote && <div className="mt-2 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">入金：{inv.diffNote}</div>}
    </div>
  );
}
