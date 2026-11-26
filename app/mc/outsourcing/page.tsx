"use client";

import { useState } from "react";
import { OUTSOURCE_ORDERS, customerById, factoryById, itemByPartNo } from "@/lib/mc/data";
import { num, yen } from "@/lib/mc/calc";
import { inScope, useMc } from "@/lib/mc/store";
import { BeforeAfter, Btn, Chip, PageHead, Panel, TableWrap, Toast } from "@/components/mc/ui";

export default function Outsourcing() {
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const [sent, setSent] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const auto = inScope(lots, scope).filter((l) => itemByPartNo(l.partNo)?.outsource && l.status === "ticketed");
  const rows = inScope(OUTSOURCE_ORDERS, scope);
  return (
    <div>
      <PageHead kicker="購買" title="外注加工" sub="品番マスタに「指定外注」がある品番を受注すると、外注指示を自動で作ります。戻り・外注費はそのロットの原価に入ります。" />
      <BeforeAfter before="外注①②は受注入力の画面で手入力。外注費がどのロットのものか分からず、原価が案件に結びつかない。" after="受注と同時に外注指示書を自動作成。外注先の請求書はロット（作業票No.）に紐づき、そのまま原価と買掛に。" />
      {auto.length > 0 && (
        <Panel title="自動で作った外注指示（今日の受注から）" className="mb-5" pad={false}>
          <div className="p-4 pt-1">
            <TableWrap>
              <thead><tr><th>作業票No</th><th>得意先</th><th>品番</th><th>外注先</th><th>工程</th><th className="num">数量</th><th className="num">外注費（見込）</th><th></th></tr></thead>
              <tbody>
                {auto.map((l) => {
                  const it = itemByPartNo(l.partNo)!;
                  return (
                    <tr key={l.id}>
                      <td className="font-mono">{l.ticketNo}</td>
                      <td>{customerById(l.customerId).short}</td>
                      <td className="font-mono">{l.partNo}</td>
                      <td>{it.outsource}</td>
                      <td>ショットブラスト（前処理）</td>
                      <td className="num">{num(l.qty)}</td>
                      <td className="num">{yen(l.qty * 15)}</td>
                      <td>{sent.includes(l.id) ? <Chip tone="green">送付済み</Chip> : <Btn size="sm" variant="primary" onClick={() => { setSent([...sent, l.id]); setToast("外注指示書を外注先へ送付しました（FAX/メール）"); setTimeout(() => setToast(""), 2200); }}>外注指示書を送る</Btn>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </div>
        </Panel>
      )}
      <Panel title="外注の状況" pad={false}>
        <div className="p-4 pt-1">
          <TableWrap>
            <thead><tr><th>外注No</th><th>工場</th><th>外注先</th><th>工程</th><th>品番</th><th className="num">数量</th><th>出荷</th><th>戻り予定</th><th>状態</th><th className="num">外注費</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono">{o.id}</td>
                  <td>{factoryById(o.factoryId).short}</td>
                  <td>{o.vendor}</td>
                  <td>{o.process}</td>
                  <td className="font-mono">{o.partNo}</td>
                  <td className="num">{num(o.qty)}</td>
                  <td>{o.sentAt}</td>
                  <td>{o.returnAt}</td>
                  <td><Chip tone={o.status.startsWith("戻り") ? "green" : o.status === "出荷待ち" ? "blue" : "amber"}>{o.status}</Chip></td>
                  <td className="num">{yen(o.cost)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
