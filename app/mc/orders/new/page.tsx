"use client";

import { useMemo, useState } from "react";
import { CUSTOMERS, DEMO_TODAY, ITEMS, customerById, factoryById, itemByPartNo, type CustomerId, type Lot } from "@/lib/mc/data";
import { judgeH3, lotAmount, md, num, totalKg, yen } from "@/lib/mc/calc";
import { useMc } from "@/lib/mc/store";
import { WorkTicket } from "@/components/mc/docs";
import { BeforeAfter, Btn, H3Badge, Kv, PageHead, Panel, Sheet } from "@/components/mc/ui";

const input = "h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-[15px] font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function NewOrder() {
  const scope = useMc((s) => s.scope);
  const createLot = useMc((s) => s.createLot);
  const customers = CUSTOMERS.filter((c) => scope === "ALL" || c.factories.includes(scope));
  const [customerId, setCustomerId] = useState<CustomerId>(customers.some((c) => c.id === "C001") ? "C001" : customers[0].id);
  const items = ITEMS.filter((i) => i.customerId === customerId && (scope === "ALL" || i.factoryId === scope));
  const [partNo, setPartNo] = useState(items[0]?.partNo ?? "");
  const [boxes, setBoxes] = useState(24);
  const [qtyOverride, setQtyOverride] = useState<number | null>(null);
  const [lotNo, setLotNo] = useState("6L04A");
  const [due, setDue] = useState("2026-12-04");
  const [created, setCreated] = useState<Lot | null>(null);

  const item = itemByPartNo(partNo);
  const qty = qtyOverride ?? (item ? item.perBox * boxes : 0);
  const kg = item ? totalKg(qty, item.unitWeightG) : 0;
  const h = useMemo(() => (item ? judgeH3(item.partNo) : null), [item]);

  const onCustomer = (id: CustomerId) => {
    setCustomerId(id);
    const first = ITEMS.find((i) => i.customerId === id && (scope === "ALL" || i.factoryId === scope));
    setPartNo(first?.partNo ?? "");
    setQtyOverride(null);
  };

  const submit = () => {
    if (!item) return;
    const lot = createLot({ customerId, partNo, boxes, qty, lotNo, dueDate: due });
    setCreated(lot);
  };

  return (
    <div>
      <PageHead kicker="受託加工 STEP 1" title="受注入力" sub="注文書がAIで読めなかったときや、電話で受けたときの手入力。毎回入れるのは4項目だけで、残りは品番マスタから自動で入ります。" />
      <BeforeAfter
        before="受注入力の画面が重い。上の段だけで20項目以上、下の段に工程1〜6の作業条件。毎回変わるのは数量・箱数・ロットNo・納期だけなのに、画面は全部見せてくる。"
        after="品番を選べば、残りは全部マスタから。人が入れるのは「数量（箱数）・ロットNo・納期」だけ。工程条件は確認用に表示するだけで、触らなくていい。"
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Panel title="① 品番を選ぶ">
            <label className="mb-1 block text-[12px] font-semibold text-ink-muted">得意先</label>
            <select className={input} value={customerId} onChange={(e) => onCustomer(e.target.value as CustomerId)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.short}（{c.id}）</option>)}
            </select>
            <label className="mb-1 mt-3 block text-[12px] font-semibold text-ink-muted">品番</label>
            <select className={input} value={partNo} onChange={(e) => { setPartNo(e.target.value); setQtyOverride(null); }}>
              {items.map((i) => <option key={i.partNo} value={i.partNo}>{i.partNo}　{i.name}</option>)}
            </select>
            {h && (
              <div className={`mt-3 rounded-lg px-3 py-2 text-[12px] leading-relaxed ${h.h3 ? "border border-amber-200 bg-amber-50 text-amber-800" : "bg-surface-sunken text-ink-muted"}`}>
                {h.h3 ? <><H3Badge h3={h.h3} /> {h.reason}</> : <>3H：該当なし（{h.reason}）</>}
              </div>
            )}
          </Panel>

          <Panel title="② 毎回入れる4項目" sub="ここだけ打てば登録できます">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-muted">箱数</label>
                <input type="number" inputMode="numeric" className={input} value={boxes} onChange={(e) => { setBoxes(Number(e.target.value) || 0); setQtyOverride(null); }} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-muted">数量 <span className="font-normal">（入数×箱数）</span></label>
                <input type="number" inputMode="numeric" className={input} value={qty} onChange={(e) => setQtyOverride(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-muted">ロットNo</label>
                <input className={input} value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-muted">納期</label>
                <input type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
            </div>
            {item && (
              <div className="mt-3 rounded-lg bg-violet-50 px-3 py-2 font-mono text-[12px] leading-relaxed text-violet-800">
                入数 {item.perBox} × 箱数 {boxes} ＝ 数量 {num(qty)}
                <br />数量 {num(qty)} × 単重 {item.unitWeightG}g ＝ 総重量 {num(kg, 2)}kg
              </div>
            )}
            <Btn variant="primary" className="mt-4 w-full" onClick={submit} disabled={!item || qty <= 0}>登録して作業票を発行</Btn>
          </Panel>
        </div>

        {item && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="上の段（マスタ・自動）" sub="今の受注入力画面と同じ項目">
              <Kv k="伝票番号" v="（登録時に採番）" from="calc" />
              <Kv k="入荷日 / 受注日" v={`${md(DEMO_TODAY)} / ${md(DEMO_TODAY)}`} from="calc" />
              <Kv k="納期日" v={md(due)} from="input" />
              <Kv k="工場" v={factoryById(item.factoryId).name} from="master" />
              <Kv k="得意先" v={customerById(customerId).short} from="master" />
              <Kv k="外注①" v={item.outsource ?? "なし"} from="master" />
              <Kv k="品群" v={item.group} from="master" />
              <Kv k="処理液" v={item.liquid} from="master" />
              <Kv k="商品" v={`${item.code} ${item.name}`} from="master" />
              <Kv k="仕様" v={item.spec} from="master" />
              <Kv k="ロットNo" v={lotNo} from="input" />
              <Kv k="数量 / 箱数" v={`${num(qty)} / ${boxes}`} from="input" />
              <Kv k="入数 / 単重" v={`${item.perBox} / ${item.unitWeightG}g`} from="master" mono />
            </Panel>
            <Panel title="右の段（計算・自動）">
              <Kv k="総重量" v={`${num(kg, 2)} kg`} from="calc" mono />
              <Kv k="完成ライン" v={item.line} from="master" />
              <Kv k="単価" v={`${item.price}円/${item.priceUnit}`} from="master" mono />
              <Kv k="売上金額（予定）" v={yen(lotAmount({ partNo, qty }, item))} from="calc" mono />
              <Kv k="指定外注" v={item.outsource ?? "—"} from="master" />
              <Kv k="売上要/不要" v="要" from="master" />
              <Kv k="丸めルール" v={customerById(customerId).rounding} from="master" />
            </Panel>
            <Panel title="下の段（作業条件・マスタから）" className="xl:col-span-2" pad={false}>
              <div className="overflow-x-auto p-4 pt-2">
                <div className="mb-2 text-[12px] text-ink-muted">前処理：{[item.pre.degrease && "脱脂", item.pre.bake && "空焼き", item.pre.shot && "ショット"].filter(Boolean).join("・")}</div>
                <table className="mc-table w-full min-w-[640px] text-[12px]">
                  <thead><tr><th>工程</th><th>分類</th><th>処理設備</th><th>パターン</th><th className="num">投入量</th><th className="num">転/回</th><th className="num">傾動</th><th className="num">焼時間</th><th className="num">目盛</th><th className="num">焼前温</th><th className="num">焼後温</th></tr></thead>
                  <tbody>
                    {item.steps.map((s, i) => (
                      <tr key={i}>
                        <td>{i + 1}. {s.step}</td><td>{s.kind}</td><td>{s.equipment}</td><td>{s.pattern}</td><td className="num">{s.chargeKg}kg</td><td className="num">{s.rpm}</td><td className="num">{s.tilt}</td><td className="num">{s.bakeMin}分</td><td className="num">{s.scale}</td><td className="num">{s.preTemp}℃</td><td className="num">{s.postTemp}℃</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>

      <Sheet open={!!created} onClose={() => setCreated(null)} title="登録しました — 作業票（印刷イメージ）">
        {created && (
          <>
            <WorkTicket lot={created} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="primary" href={`/mc/lots/${created.id}`}>ロット詳細へ</Btn>
              <Btn href="/mc/completion">完成入力へ</Btn>
              <Btn onClick={() => setCreated(null)}>続けて入力</Btn>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
