"use client";

import { useState } from "react";
import { ENTITIES } from "@/lib/mc/data";
import { yen } from "@/lib/mc/calc";
import { BeforeAfter, Btn, Chip, PageHead, Panel, TableWrap, Toast } from "@/components/mc/ui";

const ROWS = [
  { mc: { date: "11/05", item: "ZF-100 400kg", amount: 1_140_000 }, a: { date: "11/05", item: "ZF-100 400kg", amount: 1_140_000 }, state: "一致" },
  { mc: { date: "11/12", item: "TC-20B 200kg", amount: 684_000 }, a: { date: "11/12", item: "TC-20B 200kg", amount: 684_000 }, state: "一致" },
  { mc: { date: "11/19", item: "TC-30S 300kg", amount: 954_000 }, a: { date: "11/19", item: "TC-30S 300kg", amount: 954_000 }, state: "一致" },
  { mc: { date: "11/26", item: "ZF-100 400kg", amount: 1_140_000 }, a: { date: "11/27", item: "ZF-100 400kg", amount: 1_140_000 }, state: "日付ずれ" },
  { mc: null, a: { date: "11/28", item: "ドラム缶回収費", amount: 12_000 }, state: "片側のみ" },
] as const;

export default function Intercompany() {
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const mcTotal = ROWS.reduce((s, r) => s + (r.mc?.amount ?? 0), 0);
  const aTotal = ROWS.reduce((s, r) => s + r.a.amount, 0);
  const mcSales = 320_000;
  return (
    <div>
      <PageHead kicker="管理" title="2法人（関係会社）" sub={`${ENTITIES[0].name} と ${ENTITIES[1].name}（${ENTITIES[1].note}）の取引を、両社の帳簿の目線で突き合わせます。`} />
      <BeforeAfter before="別法人との突合・消込が手作業。" after="同じシステムで2法人を管理しているので、MC側の買掛とA側の売掛を自動で突合。差だけ人が見て、月末に相殺。" />
      <Panel title="11月の突合（処理液の仕入）" pad={false} className="mb-5">
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>MC本体 計上日</th><th>内容</th><th className="num">MC 買掛</th><th>関係会社A 計上日</th><th className="num">A 売掛</th><th>判定（AI）</th></tr></thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i}>
                  <td>{r.mc?.date ?? "—"}</td>
                  <td>{r.a.item}</td>
                  <td className="num">{r.mc ? yen(r.mc.amount) : "—"}</td>
                  <td>{r.a.date}</td>
                  <td className="num">{yen(r.a.amount)}</td>
                  <td className="text-[12px]">
                    {r.state === "一致" && <Chip tone="green">一致</Chip>}
                    {r.state === "日付ずれ" && <><Chip tone="amber">日付1日ずれ</Chip> 金額・内容一致。出荷日と入荷日の違い</>}
                    {r.state === "片側のみ" && <><Chip tone="red">MC側に計上なし</Chip> 回収費の請求漏れ／計上漏れの可能性</>}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
      <Panel title="月末の相殺" right={done ? <Chip tone="green">相殺済み</Chip> : <Btn variant="primary" size="sm" onClick={() => { setDone(true); setToast("相殺の仕訳を両法人に作成しました"); setTimeout(() => setToast(""), 2200); }}>相殺を実行</Btn>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-sunken p-3"><div className="text-[11.5px] text-ink-muted">MC → A への支払（買掛）</div><div className="text-[18px] font-bold tabular-nums">{yen(aTotal)}</div><div className="text-[11px] text-ink-muted">MC帳簿上 {yen(mcTotal)}＋回収費</div></div>
          <div className="rounded-lg bg-surface-sunken p-3"><div className="text-[11.5px] text-ink-muted">A → MC への請求（設備メンテ受託）</div><div className="text-[18px] font-bold tabular-nums">{yen(mcSales)}</div></div>
          <div className="rounded-lg bg-brand-50 p-3"><div className="text-[11.5px] text-brand-700">相殺後の支払額</div><div className="text-[18px] font-bold tabular-nums text-brand-700">{yen(aTotal - mcSales)}</div></div>
        </div>
      </Panel>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
