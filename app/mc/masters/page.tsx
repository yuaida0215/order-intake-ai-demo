"use client";

import { useState } from "react";
import { ITEMS, customerById, factoryById, type Item } from "@/lib/mc/data";
import { md, num } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, Kv, PageHead, Panel, Sheet, TableWrap } from "@/components/mc/ui";

const FLOW = ["起票（製造事務）", "製造部：処理条件を記入", "品質保証部：確認", "総務：マスタ登録", "登録完了"];

export default function Masters() {
  const scope = useMc((s) => s.scope);
  const newItems = useMc((s) => s.newItems);
  const fa = useMc((s) => s.fa);
  const advanceNewItem = useMc((s) => s.advanceNewItem);
  const sendFa = useMc((s) => s.sendFa);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Item | null>(null);
  const items = inScope(ITEMS, scope).filter((i) => !q || i.partNo.includes(q) || i.name.includes(q));

  return (
    <div>
      <PageHead kicker="管理" title="品番マスタ・FA連携" sub="品番ごとに工程1〜6の作業条件を持ちます。新しい品番は「新規品登録表」を画面で回覧、条件を変えたら設備の自動運転へも配信します。" />
      <BeforeAfter
        before="品番マスタは得意先×工場ごとの取込用Excel（蟹江だけで約1,400行×165列）。新規品登録表は紙で各部門を回る。基幹のマスタを変えると設備の自動運転のマスタも変わるため、要件定義が止まっている。"
        after="品番マスタは1か所に集約。新規品登録表は画面で回覧し、総務の登録で完了。条件の変更は「変更→承認→設備へ配信」の順に流すので、基幹と設備のマスタがずれない（連携の方式は要相談）。"
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel title="新規品登録表の回覧" sub="注文書の取込で「初めて」の品番が出ると自動で起票">
          {newItems.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">回覧中の登録表はありません。東海精密の支給伝票（D-1201-01）を取り込むと、未登録の品番が起票されます。</p>
          ) : (
            <ul className="space-y-3">
              {newItems.map((n) => (
                <li key={n.partNo} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold">{n.partNo}</span>
                    <span className="text-[12px] text-ink-muted">{n.name}｜{customerById(n.customerId).short}｜{factoryById(n.factoryId).short}</span>
                    <span className="ml-auto">{n.step >= 4 ? <Chip tone="green">登録完了</Chip> : <Btn size="sm" onClick={() => advanceNewItem(n.partNo)}>次の部門へ回す</Btn>}</span>
                  </div>
                  <ol className="mt-2 flex flex-wrap gap-1">
                    {FLOW.map((f, i) => (
                      <li key={f} className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${i < n.step ? "bg-emerald-50 text-emerald-700" : i === n.step ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-faint"}`}>{f}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="設備の自動運転（FA）への配信" sub="マスタの変更を承認してから設備へ">
          <ul className="space-y-3">
            {fa.map((f) => (
              <li key={f.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold">{f.partNo}</span>
                  <span className="text-[11.5px] text-ink-muted">変更 {f.at}</span>
                  <span className="ml-auto">{f.status === "配信済み" ? <Chip tone="green">設備へ配信済み</Chip> : <Btn size="sm" variant="primary" onClick={() => sendFa(f.id)}>承認して設備へ配信</Btn>}</span>
                </div>
                <div className="mt-2 rounded bg-surface-sunken px-2 py-1.5 font-mono text-[12px]">
                  <span className="text-rose-600 line-through">焼時間 25分</span> → <span className="font-bold text-emerald-700">焼時間 30分</span>
                  <div className="mt-0.5 font-sans text-[11.5px] text-ink-muted">{f.change}</div>
                </div>
                <div className="mt-1 text-[11.5px] text-ink-muted">この変更は受注時の3H判定で「変更」として作業票にも表示されます。</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="品番マスタ"
        right={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="品番・商品名で検索" className="h-8 w-48 rounded-lg border border-line px-2 text-[12.5px]" />}
        pad={false}
      >
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>品番</th><th>商品コード</th><th>商品名</th><th>得意先</th><th>工場</th><th>加工内容</th><th className="num">入数</th><th className="num">単重</th><th>前回受注</th><th>改訂</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.partNo} className="cursor-pointer" onClick={() => setSel(i)}>
                  <td className="font-mono font-semibold text-brand-600">{i.partNo}</td>
                  <td className="font-mono">{i.code}</td>
                  <td>{i.name}</td>
                  <td>{customerById(i.customerId).short}</td>
                  <td>{factoryById(i.factoryId).short}</td>
                  <td className="text-[11.5px]">{i.spec}</td>
                  <td className="num">{i.perBox}</td>
                  <td className="num">{i.unitWeightG}g</td>
                  <td>{i.lastOrder ? md(i.lastOrder) : "—"}</td>
                  <td>{i.revisedAt ? <Chip tone="violet">{md(i.revisedAt)}</Chip> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Panel>

      <Panel title="今の基幹からの移行" className="mt-5">
        <div className="grid gap-3 text-[12.5px] sm:grid-cols-3">
          <div className="rounded-lg bg-surface-sunken p-3"><div className="font-semibold">品番マスタ</div><div className="text-ink-muted">取込用Excelの「マスター」シート（工場ごと）と基幹のマスタを統合</div></div>
          <div className="rounded-lg bg-surface-sunken p-3"><div className="font-semibold">受注残</div><div className="text-ink-muted">切替日時点で未完了のロット</div></div>
          <div className="rounded-lg bg-surface-sunken p-3"><div className="font-semibold">受注履歴 {num(1502981)}件</div><div className="text-ink-muted">3H（久しぶり）の判定に使う。何年分を移すかは要相談</div></div>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-muted">移行元：商奉行・蔵奉行＋自社の追加開発（受注入力 Ver3.0.0.0）</p>
      </Panel>

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.partNo} ${sel.name}` : ""}>
        {sel && (
          <>
            <Kv k="商品コード" v={sel.code} mono />
            <Kv k="得意先 / 工場" v={`${customerById(sel.customerId).short} / ${factoryById(sel.factoryId).name}`} />
            <Kv k="品群 / 処理液" v={`${sel.group} / ${sel.liquid}`} />
            <Kv k="加工内容" v={sel.spec} />
            <Kv k="入数 / 単重" v={`${sel.perBox} / ${sel.unitWeightG}g`} mono />
            <Kv k="単価" v={`${sel.price}円/${sel.priceUnit}`} mono />
            <Kv k="完成ライン" v={sel.line} />
            <Kv k="指定外注" v={sel.outsource ?? "—"} />
            {sel.revisionNote && <Kv k="改訂" v={`${md(sel.revisedAt!)} ${sel.revisionNote}`} />}
            <div className="mt-3 overflow-x-auto">
              <table className="mc-table w-full min-w-[560px] text-[12px]">
                <thead><tr><th>工程</th><th>処理液</th><th>設備</th><th>パターン</th><th className="num">投入量</th><th className="num">転/回</th><th className="num">傾動</th><th className="num">焼時間</th><th>焼前/焼後</th></tr></thead>
                <tbody>
                  {sel.steps.map((s, i) => (
                    <tr key={i}><td>{i + 1}. {s.step}</td><td>{s.liquid}</td><td>{s.equipment}</td><td>{s.pattern}</td><td className="num">{s.chargeKg}kg</td><td className="num">{s.rpm}</td><td className="num">{s.tilt}</td><td className="num">{s.bakeMin}分</td><td>{s.preTemp}/{s.postTemp}℃</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
