"use client";

import Link from "next/link";
import { INTAKE_DOCS, customerById, factoryById } from "@/lib/mc/data";
import { inScope, useMc } from "@/lib/mc/store";
import { BeforeAfter, Chip, PageHead, Panel, TableWrap } from "@/components/mc/ui";

export default function IntakeList() {
  const scope = useMc((s) => s.scope);
  const done = useMc((s) => s.docsDone);
  const docs = inScope(INTAKE_DOCS, scope);
  return (
    <div>
      <PageHead kicker="受託加工 STEP 0" title="注文書の取込（AI読み取り）" sub="部品と一緒に届く紙の注文書は複合機でスキャン、FAXは受信と同時に、EDIは自動ダウンロードで、すべてこの一覧に集まります。" />
      <BeforeAfter
        before="注文書（紙・FAX）を目で見て、重い受注入力の画面に1件ずつ手で打つ。CSV一括取込の口はあるが、紙が大部分で使えない。"
        after="AIが読み取って、取込用Excelの白い列と同じ項目を埋める。人は確認して「受入実行」を押すだけ。久しぶりの品番も自動で分かる。"
      />
      <Panel title="届いた注文書" sub="12/01 受信分" pad={false}>
        <div className="p-4 pt-2">
          <TableWrap>
            <thead>
              <tr>
                <th>受信</th><th>工場</th><th>得意先</th><th>書類</th><th>経路</th><th className="num">明細</th><th>状態</th><th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const st = done[d.id];
                return (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap">{d.receivedAt}</td>
                    <td>{factoryById(d.factoryId).short}</td>
                    <td className="font-semibold">{customerById(d.customerId).short}</td>
                    <td>{d.kind}</td>
                    <td><Chip tone={d.channel === "EDI" ? "green" : d.channel === "FAX" ? "gray" : "blue"}>{d.channel}</Chip></td>
                    <td className="num">{d.rows.length}行</td>
                    <td>
                      {st ? (
                        <Chip tone="green">受入済 {st.imported.length}件{st.rejected.length ? `／弾き ${st.rejected.length}` : ""}</Chip>
                      ) : (
                        <Chip tone="cyan">AI読み取り待ち</Chip>
                      )}
                    </td>
                    <td><Link href={`/mc/intake/${d.id}`} className="font-semibold text-brand-600 hover:underline">開く ›</Link></td>
                  </tr>
                );
              })}
              {docs.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-ink-muted">この拠点に届いた注文書はありません（拠点を「全拠点」か「蟹江工場」にしてください）</td></tr>
              )}
            </tbody>
          </TableWrap>
        </div>
      </Panel>
    </div>
  );
}
