"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { BILLING_GROUPS, INTAKE_DOCS, LOT_FLOW, customerById, factoryById, itemByPartNo } from "@/lib/mc/data";
import { judgeH3, lotAmount, lotCost, md, num, pct, salesKg, totalKg, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { DeliveryNote, InvoicePreview, OrderDocImage, WorkTicket } from "@/components/mc/docs";
import { Btn, Chip, H3Badge, Kv, PageHead, Panel, Sheet, StatusChip } from "@/components/mc/ui";

type DocKind = "order" | "work" | "genpin" | "kanryo" | "delivery" | "invoice";

export default function LotDetail() {
  const { id } = useParams<{ id: string }>();
  const lot = useMc((s) => s.lots.find((l) => l.id === id));
  const invoices = useMc((s) => s.invoices);
  const advance = useMc((s) => s.advance);
  const fg = useMc((s) => s.factoryGroup);
  const [doc, setDoc] = useState<DocKind | null>(null);
  if (!lot) return <div className="py-20 text-center text-ink-muted">ロットが見つかりません（デモを最初に戻した可能性があります）</div>;

  const it = itemByPartNo(lot.partNo)!;
  const c = customerById(lot.customerId);
  const idx = LOT_FLOW.findIndex((f) => f.key === lot.status);
  const cost = lotCost(lot);
  const src = INTAKE_DOCS.find((d) => d.id === lot.docId);
  const inv = invoices.find((i) => i.id === lot.invoiceId);
  const h = lot.h3 ? judgeH3(lot.partNo) : null;

  const steps = [
    { label: "注文書の取込", sub: lot.source, done: true },
    ...LOT_FLOW.map((f, i) => ({ label: f.label, sub: "", done: i <= idx })),
  ];

  const docButtons: { k: DocKind; label: string; show: boolean }[] = [
    { k: "order", label: "注文書（原本）", show: !!src },
    { k: "work", label: "作業票", show: true },
    { k: "genpin", label: "現品票", show: idx >= 2 },
    { k: "kanryo", label: "完了票", show: idx >= 2 },
    { k: "delivery", label: "納品書", show: idx >= 3 },
    { k: "invoice", label: "請求書", show: !!inv },
  ];

  return (
    <div>
      <PageHead
        kicker={`ロット詳細｜${factoryById(lot.factoryId).name}`}
        title={`${lot.ticketNo}`}
        sub={`${c.short}　${lot.partNo} ${it.name}　ロットNo ${lot.lotNo}`}
        right={
          <>
            <StatusChip status={lot.status} />
            {idx < LOT_FLOW.length - 1 && (
              <Btn size="sm" variant="secondary" onClick={() => advance([lot.id])}>次の工程へ進める（デモ）</Btn>
            )}
          </>
        }
      />

      <Panel title="1ロットの一生" sub="同じ作業票No.のまま、注文書から入金までつながる" className="mb-5">
        <ol className="relative grid gap-0 sm:grid-cols-8">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex gap-3 pb-4 sm:flex-col sm:items-center sm:gap-1.5 sm:pb-0 sm:text-center">
              {i < steps.length - 1 && (
                <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 sm:left-1/2 sm:top-[13px] sm:h-0.5 sm:w-full ${steps[i + 1].done ? "bg-brand-400" : "bg-slate-200"}`} />
              )}
              <span className={`relative z-10 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${s.done ? "bg-brand-500 text-white" : "border-2 border-slate-200 bg-white text-ink-faint"} ${i === idx + 1 ? "ring-4 ring-brand-100" : ""}`}>
                {s.done ? "✓" : i}
              </span>
              <span className={`text-[12px] font-semibold leading-tight ${s.done ? "text-ink" : "text-ink-faint"}`}>
                {s.label}
                {s.sub && <span className="block text-[10.5px] font-normal text-ink-muted">{s.sub}</span>}
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="受注の内容">
          <Kv k="伝票番号" v={lot.id} mono />
          <Kv k="入荷日 / 納期" v={`${md(lot.receivedAt)} / ${md(lot.dueDate)}`} />
          <Kv k="入数 × 箱数" v={`${it.perBox} × ${lot.boxes}`} mono />
          <Kv k="数量" v={num(lot.qty)} mono />
          {lot.completedQty != null && <Kv k="完成数量（不良）" v={`${num(lot.completedQty)}（${lot.defectQty ?? 0}）`} mono />}
          <Kv k="総重量" v={`${num(totalKg(lot.completedQty ?? lot.qty, it.unitWeightG), 2)} kg`} mono />
          <Kv k="売上重量 × 単価" v={`${num(salesKg(lot, it), customerById(lot.customerId).weightRound === 1 ? 0 : 1)}kg × ${it.price}円`} mono />
          <Kv k="売上金額" v={yen(lotAmount(lot))} mono />
          {lot.inspection && <Kv k="検査" v={lot.inspection} />}
          <Kv k="請求グループ" v={`${BILLING_GROUPS.find((g) => g.id === fg[lot.factoryId])!.name}（発行元 ${BILLING_GROUPS.find((g) => g.id === fg[lot.factoryId])!.issuer}）`} />
          {lot.deliveryNo && <Kv k="納品書No" v={lot.deliveryNo} mono />}
          {lot.invoiceId && <Kv k="請求書No" v={lot.invoiceId} mono />}
          {h && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12px] text-amber-800">
              <H3Badge h3={lot.h3} /> {h.reason}
            </div>
          )}
        </Panel>

        <Panel title="帳票" sub="すべて作業票No.で紐づいている">
          <div className="grid grid-cols-2 gap-2">
            {docButtons.map((b) => (
              <button
                key={b.k}
                disabled={!b.show}
                onClick={() => setDoc(b.k)}
                className="rounded-lg border border-line bg-white px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {b.label}
                <span className="block text-[10.5px] font-normal text-ink-muted">{b.show ? "タップで表示" : b.k === "order" ? "この例は原本なし" : "まだ発行前"}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="このロットの原価" sub="材料費・労務費・設備費・外注費を積み上げ">
          <Kv k="材料費（処理液）" v={yen(cost.material)} mono />
          <Kv k="労務費" v={yen(cost.labor)} mono />
          <Kv k="設備費（ライン・焼付炉）" v={yen(cost.equipment)} mono />
          <Kv k="外注費" v={yen(cost.outsource)} mono />
          <Kv k="原価 計" v={yen(cost.total)} mono />
          <Kv k="売上" v={yen(cost.sales)} mono />
          <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2">
            <span className="text-[12px] text-ink-muted">粗利</span>
            <span className={`text-[16px] font-bold tabular-nums ${cost.margin < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {yen(cost.margin)}（{pct(cost.rate)}）
            </span>
          </div>
          {cost.margin < 0 && <p className="mt-2 text-[11.5px] text-rose-600">外注費が乗ると赤字。単価の見直し候補（原価管理画面に一覧）</p>}
        </Panel>
      </div>

      <Panel title="履歴" className="mt-5">
        <ul className="space-y-2">
          {lot.events.map((e, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-3 text-[12.5px]">
              <span className="w-20 flex-none font-mono text-ink-muted">{e.at}</span>
              <span className="flex-1 text-ink">{e.label}</span>
              <Chip>{e.by}</Chip>
            </li>
          ))}
        </ul>
      </Panel>

      <Sheet open={!!doc} onClose={() => setDoc(null)} title={docButtons.find((b) => b.k === doc)?.label ?? ""}>
        {doc === "order" && src && <OrderDocImage doc={src} />}
        {doc === "work" && <WorkTicket lot={lot} />}
        {doc === "genpin" && <WorkTicket lot={lot} title="現 品 票" />}
        {doc === "kanryo" && <WorkTicket lot={lot} title="完 了 票" />}
        {doc === "delivery" && <DeliveryNote lots={[lot]} no={lot.deliveryNo ?? ""} />}
        {doc === "invoice" && inv && <InvoicePreview inv={inv} />}
      </Sheet>
    </div>
  );
}
