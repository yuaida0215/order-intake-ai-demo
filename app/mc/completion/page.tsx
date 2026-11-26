"use client";

import { useState } from "react";
import { customerById, factoryById, itemByPartNo, type Lot } from "@/lib/mc/data";
import { applyRule, md, num } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { WorkTicket } from "@/components/mc/docs";
import { BeforeAfter, Barcode, Btn, Chip, H3Badge, PageHead, Panel, Sheet, StatusChip, Toast } from "@/components/mc/ui";

const hand = { fontFamily: '"Comic Sans MS","Segoe Print","Bradley Hand",cursive', color: "#1d3f8f" };

/** 作業票に手書きされた完成数量（デモ用に決め打ち。ロットごとに差のばらつき） */
const handwritten = (l: Lot) => {
  const k = [...l.ticketNo].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 5;
  return l.qty - Math.round(l.qty * [0.003, 0, 0.026, 0.002, 0.009][k]);
};

export default function Completion() {
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const completeLot = useMc((s) => s.completeLot);
  const advance = useMc((s) => s.advance);
  const waiting = inScope(lots, scope).filter((l) => l.status === "ticketed" || l.status === "processing");
  const [selId, setSelId] = useState<string | null>(null);
  const [read, setRead] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [qty, setQty] = useState<number | null>(null);
  const [inspection, setInspection] = useState<"合格" | "条件付き合格" | "不合格">("合格");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<Lot | null>(null);
  const sel = waiting.find((l) => l.id === selId) ?? null;

  const pick = (l: Lot) => {
    setSelId(l.id);
    setRead(null);
    setQty(null);
    setInspection("合格");
  };
  const scan = () => waiting[0] && pick(waiting.find((l) => l.status === "processing") ?? waiting[0]);
  const aiRead = () => {
    if (!sel) return;
    setReading(true);
    setTimeout(() => {
      const v = handwritten(sel);
      setRead(v);
      const r = applyRule(sel, v);
      setQty(r.needsHuman ? null : r.value);
      setReading(false);
    }, 900);
  };
  const submit = () => {
    if (!sel || qty == null) return;
    completeLot(sel.id, qty, inspection);
    const done = { ...sel, status: "completed" as const, completedQty: qty, defectQty: Math.max(0, sel.qty - qty), inspection };
    setPreview(done);
    setSelId(null);
    setToast(`${sel.ticketNo} を完成登録。現品票・完了票を発行しました`);
    setTimeout(() => setToast(""), 2600);
  };

  return (
    <div>
      <PageHead kicker="受託加工 STEP 3" title="完成入力・検査" sub="終わった作業票が戻ったら、バーコードを読むだけで該当ロットが開きます。手書きの完成数量はAIが読み、取引先ごとの丸めの決まりを当てて、検査の合否と一緒に登録します。" />
      <BeforeAfter
        before="戻った作業票を見て伝票番号を打ち、手書きの完成数量を入力。手書きが読みにくい。取引先ごとの丸めルールを人が覚えている。"
        after="作業票のバーコードを読む → 手書きの完成数量はAIが読み取り → 得意先の丸めの決まりを当てる。差が決まりの幅を超えた時だけ、人が数量を確定。検査の合否もここで記録。"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel
          title={`完成入力待ち（${waiting.length}件）`}
          right={
            <div className="flex gap-2">
              {waiting.some((l) => l.status === "ticketed") && (
                <Btn size="sm" onClick={() => advance(waiting.filter((l) => l.status === "ticketed").map((l) => l.id), "製造部")}>作業票発行分を処理開始に</Btn>
              )}
            </div>
          }
          pad={false}
        >
          <div className="p-3">
            <Btn variant="primary" className="mb-3 w-full" onClick={scan} disabled={!waiting.length}>
              ▮▯▮▮▯▮ 作業票のバーコードを読む
            </Btn>
            <ul className="divide-y divide-line-subtle">
              {waiting.map((l) => {
                const it = itemByPartNo(l.partNo)!;
                return (
                  <li key={l.id}>
                    <button onClick={() => pick(l)} className={`flex w-full items-center gap-2 px-1 py-2.5 text-left ${selId === l.id ? "bg-brand-50" : "hover:bg-surface-sunken"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[12.5px] font-semibold text-ink">{l.ticketNo}</span>
                        <span className="block truncate text-[11.5px] text-ink-muted">{factoryById(l.factoryId).short}｜{customerById(l.customerId).short}｜{it.name}｜{num(l.qty)}個｜納期 {md(l.dueDate)}</span>
                      </span>
                      <H3Badge h3={l.h3} />
                      <StatusChip status={l.status} />
                    </button>
                  </li>
                );
              })}
              {waiting.length === 0 && <li className="py-8 text-center text-[12.5px] text-ink-muted">完成入力待ちはありません</li>}
            </ul>
          </div>
        </Panel>

        <Panel title={sel ? `${sel.ticketNo} の完成入力` : "作業票を選んでください"}>
          {!sel ? (
            <p className="py-10 text-center text-[13px] text-ink-muted">左の「作業票のバーコードを読む」を押すか、一覧から選びます。</p>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-slate-600 bg-white p-3">
                <div>
                  <div className="text-[11px] text-slate-500">戻ってきた作業票（下半分）</div>
                  <div className="font-mono text-[12px] font-semibold text-slate-800">{sel.partNo}　注文 {num(sel.qty)}個</div>
                </div>
                <Barcode value={sel.ticketNo} height={26} />
                <div className="grid w-full grid-cols-3 gap-2 text-[10.5px] text-slate-500">
                  <div className="h-14 rounded border border-slate-400 px-1.5 py-0.5">
                    完成数量（手書き）
                    <div className="mt-0.5 -rotate-3 text-[20px] font-bold" style={hand}>{num(handwritten(sel))}</div>
                  </div>
                  <div className="h-14 rounded border border-slate-400 px-1.5 py-0.5">
                    不良数
                    <div className="mt-0.5 -rotate-2 text-[18px] font-bold" style={hand}>{sel.qty - handwritten(sel) || "—"}</div>
                  </div>
                  <div className="h-14 rounded border border-slate-400 px-1.5 py-0.5">
                    担当印
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-500/70 text-[9px] font-bold text-rose-600/80">山田</div>
                  </div>
                </div>
              </div>

              {read == null ? (
                <Btn variant="ai" className="mt-4 w-full" onClick={aiRead} disabled={reading}>
                  {reading ? "手書きを読み取り中…" : "手書きの完成数量をAIで読む"}
                </Btn>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[12.5px]">
                    <span className="text-accent-600">手書きの完成数量（読めたまま）</span>
                    <span className="font-mono text-[15px] font-bold text-ink">{num(read)}個</span>
                  </div>
                  {(() => {
                    const r = applyRule(sel, read);
                    return (
                      <div className={`rounded-lg px-3 py-2 text-[12px] leading-relaxed ${r.needsHuman ? "border border-amber-300 bg-amber-50 text-amber-900" : "bg-violet-50 text-violet-800"}`}>
                        <div><b>丸めの決まり（{customerById(sel.customerId).short}）</b>：{r.ruleLabel}<span className="ml-1 text-[10.5px] opacity-70">※想定</span></div>
                        <div className="mt-0.5">{r.note}</div>
                        {r.needsHuman && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Btn size="sm" variant={qty === read ? "primary" : "secondary"} onClick={() => setQty(read)}>完成数のまま {num(read)}</Btn>
                            <Btn size="sm" variant={qty === sel.qty ? "primary" : "secondary"} onClick={() => setQty(sel.qty)}>注文数 {num(sel.qty)}</Btn>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <label className="block text-[12px] font-semibold text-ink-muted">検査（RFI：完成数量の入力・検査合否管理）</label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {(["合格", "条件付き合格", "不合格"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setInspection(v)}
                          className={`h-9 rounded-lg border text-[12.5px] font-semibold ${inspection === v ? (v === "合格" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : v === "不合格" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-amber-500 bg-amber-50 text-amber-800") : "border-line bg-white text-ink-soft"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-[12px] font-semibold text-ink-muted">計上する完成数量</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={qty ?? ""}
                    placeholder="上のどちらかを選ぶか、数量を入力"
                    onChange={(e) => setQty(Number(e.target.value) || 0)}
                    className="h-12 w-full rounded-lg border border-line-strong px-3 text-[18px] font-bold tabular-nums focus:border-brand-500 focus:outline-none"
                  />
                  {qty != null && qty < sel.qty && <div className="text-[12px] text-amber-700">注文数量との差 {num(sel.qty - qty)}個 → 照合画面で「差異あり」として出ます</div>}
                  <Btn variant="primary" className="w-full" onClick={submit} disabled={qty == null || qty <= 0}>完成登録（現品票・完了票を発行）</Btn>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Sheet open={!!preview} onClose={() => setPreview(null)} title="発行した帳票（印刷イメージ）" wide>
        {preview && (
          <div className="grid gap-4 md:grid-cols-2">
            <WorkTicket lot={preview} title="現 品 票" />
            <WorkTicket lot={preview} title="完 了 票" />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Btn variant="primary" href="/mc/shipping">次へ：納品書・出荷</Btn>
              <Btn onClick={() => setPreview(null)}>続けて完成入力</Btn>
            </div>
          </div>
        )}
      </Sheet>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
