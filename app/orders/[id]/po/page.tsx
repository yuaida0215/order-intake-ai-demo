"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Button, Card, Field, LinkButton, PageHeader, SectionTitle } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { SourcePreview } from "@/components/SourcePreview";
import { formatDate, yen } from "@/lib/format";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));
  const transcribePoToCore = useOrderStore((s) => s.transcribePoToCore);
  const [transcribing, setTranscribing] = useState(false);

  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="text-lg font-bold text-ink">受注が見つかりません</div>
            <LinkButton href="/orders" variant="primary">
              受注一覧へ
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const po = order.poDocument;
  const alreadyDone = order.status === "auto_input_completed" || order.status === "completed";

  async function handleTranscribe() {
    if (!order || transcribing || alreadyDone) return;
    setTranscribing(true);
    await sleep(600);
    transcribePoToCore(order.id);
    router.push(`/orders/${order.id}/core-system-input`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="発注書の受領・転記"
        description="先方から届いた発注書の内容を確認し、基幹システムへ転記します。"
        backHref="/orders"
        backLabel="受注一覧に戻る"
        meta={
          <>
            <span className="font-mono text-[13px] text-ink-faint">{order.id}</span>
            <StatusBadge status={order.status} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="AIが読み取った発注書の原本です">元データ</SectionTitle>
          <div className="mt-4">
            <SourcePreview order={order} />
          </div>
        </Card>

        <Card>
          <SectionTitle sub="AIが自動抽出した発注内容">AI抽出結果</SectionTitle>

          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="取引先名">{po?.extracted.customerName ?? order.customerName ?? "—"}</Field>
              <Field label="発注日">{formatDate(po?.extracted.orderDate ?? order.orderDate)}</Field>
              <Field label="希望納品日">{formatDate(po?.extracted.requestedDeliveryDate ?? order.requestedDeliveryDate)}</Field>
              <Field label="納品先">{po?.extracted.deliveryAddress ?? order.deliveryAddress ?? "—"}</Field>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-medium text-ink-muted">商品明細</div>
              <div className="overflow-hidden rounded-lg border border-surface-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-sunken text-[11px] text-ink-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">商品コード</th>
                      <th className="px-3 py-2 text-left font-medium">商品名</th>
                      <th className="px-3 py-2 text-right font-medium">数量</th>
                      <th className="px-3 py-2 text-right font-medium">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {order.items.map((item) => (
                      <tr key={item.lineNo}>
                        <td className="px-3 py-2 font-mono text-xs text-ink-soft">{item.productCode ?? "—"}</td>
                        <td className="px-3 py-2 text-ink">{item.productName ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink">
                          {item.quantity?.toLocaleString() ?? "—"}
                          {item.unit ? <span className="ml-0.5 text-xs text-ink-muted">{item.unit}</span> : null}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink">{yen(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-4 py-3">
              <span className="text-sm font-medium text-ink-soft">合計金額</span>
              <span className="text-lg font-bold tabular-nums text-ink">{yen(order.totalAmount)}</span>
            </div>

            {po?.relatedQuoteNo && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                送付済み見積 {po.relatedQuoteNo} と照合しました：✓ 金額一致 ✓ 品目一致
              </div>
            )}

            <div className="border-t border-surface-border pt-5">
              {alreadyDone ? (
                <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-300">
                  すでに基幹システムへ転記済みです
                </div>
              ) : (
                <Button variant="ai" size="lg" className="w-full" onClick={handleTranscribe} disabled={transcribing}>
                  {transcribing ? "転記準備中…" : "🤖 自動的に基幹システムに転記する"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
