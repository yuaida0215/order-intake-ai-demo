import type { OrderItem, Quote } from "@/lib/types";
import { formatDate, yen } from "@/lib/format";

/** A4紙風の見積書プレビュー。editable時は明細・条件を編集できる (§3-4) */
export function QuoteSheet({
  quote,
  editable,
  onUpdateItem,
  onUpdateField,
}: {
  quote: Quote;
  editable: boolean;
  onUpdateItem?: (lineNo: number, patch: Partial<OrderItem>) => void;
  onUpdateField?: (patch: Partial<Quote>) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white shadow-card">
      <div className="border-b border-surface-border bg-surface-sunken px-6 py-3 text-center">
        <span className="text-lg font-bold tracking-widest text-ink">御 見 積 書</span>
      </div>

      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-ink">{quote.customerName ?? "取引先未確定"} 御中</p>
            <p className="mt-1 text-xs text-ink-muted">下記のとおりお見積り申し上げます。</p>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <p>見積No：{quote.quoteNo}</p>
            <p>発行日：{formatDate(quote.createdAt)}</p>
            <p>有効期限：{formatDate(quote.validUntil)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-[11px] text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">商品名</th>
                <th className="px-3 py-2 text-right font-medium">数量</th>
                <th className="px-3 py-2 text-right font-medium">単価</th>
                <th className="px-3 py-2 text-right font-medium">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {quote.items.map((item) => (
                <tr key={item.lineNo}>
                  <td className="px-3 py-2 text-ink">
                    {editable ? (
                      <input
                        className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink focus:border-brand-600 focus:outline-none"
                        value={item.productName ?? ""}
                        onChange={(e) => onUpdateItem?.(item.lineNo, { productName: e.target.value || null })}
                      />
                    ) : (
                      item.productName ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">
                    {editable ? (
                      <input
                        type="number"
                        className="w-20 rounded-md border border-surface-border bg-white px-2 py-1 text-right text-sm tabular-nums text-ink focus:border-brand-600 focus:outline-none"
                        value={item.quantity ?? ""}
                        onChange={(e) =>
                          onUpdateItem?.(item.lineNo, {
                            quantity: e.target.value === "" ? null : Number(e.target.value),
                            amount:
                              e.target.value !== "" && item.unitPrice !== null
                                ? Number(e.target.value) * item.unitPrice
                                : item.amount,
                          })
                        }
                      />
                    ) : (
                      `${item.quantity?.toLocaleString() ?? "—"}${item.unit ?? ""}`
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{yen(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">{yen(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>小計</span>
            <span className="tabular-nums">{yen(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>消費税</span>
            <span className="tabular-nums">{yen(quote.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-surface-border pt-1 text-base font-bold text-ink">
            <span>合計</span>
            <span className="tabular-nums">{yen(quote.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-surface-border pt-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] font-medium text-ink-muted">納期</div>
            {editable ? (
              <input
                className="w-full rounded-md border border-surface-border bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                value={quote.deliveryTerms}
                onChange={(e) => onUpdateField?.({ deliveryTerms: e.target.value })}
              />
            ) : (
              <p className="text-sm text-ink">{quote.deliveryTerms}</p>
            )}
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-ink-muted">お支払条件</div>
            {editable ? (
              <input
                className="w-full rounded-md border border-surface-border bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                value={quote.paymentTerms}
                onChange={(e) => onUpdateField?.({ paymentTerms: e.target.value })}
              />
            ) : (
              <p className="text-sm text-ink">{quote.paymentTerms}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 text-[11px] font-medium text-ink-muted">備考</div>
            {editable ? (
              <textarea
                rows={2}
                className="w-full rounded-md border border-surface-border bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                value={quote.notes}
                onChange={(e) => onUpdateField?.({ notes: e.target.value })}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-ink-soft">{quote.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
