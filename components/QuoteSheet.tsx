import type { OrderItem, Quote } from "@/lib/types";
import { formatDate, yen } from "@/lib/format";
import { ISSUER } from "@/lib/issuer";

/** 見積書プレビュー (実フォーマット準拠)。editable時は明細・備考を編集できる */
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
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white p-8 shadow-card">
      <h2 className="text-center text-3xl font-bold tracking-wide text-ink">見積書</h2>

      <div className="mt-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-base font-semibold text-ink">{quote.customerName ?? "取引先未確定"} 御中</p>
        </div>
        <div className="text-right text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">{ISSUER.companyName}</p>
          <p>{ISSUER.postalCode}</p>
          {ISSUER.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>TEL: {ISSUER.tel}</p>
          <div className="mt-3 space-y-0.5">
            <p>見積書番号：{quote.quoteNo}</p>
            <p>発行日：　{formatDate(quote.createdAt)}</p>
            <p>有効期限：{formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <span className="text-sm font-medium text-ink-soft">御見積金額</span>
        <span className="text-2xl font-bold text-ink">{yen(quote.total)}</span>
      </div>

      <div className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs text-ink-soft">
              <th className="py-2 font-medium">品目</th>
              <th className="py-2 text-right font-medium">単価</th>
              <th className="py-2 text-right font-medium">数量</th>
              <th className="py-2 text-right font-medium">単位</th>
              <th className="py-2 text-right font-medium">価格</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.lineNo} className="border-b border-surface-border align-top">
                <td className="py-3 pr-3 text-ink">
                  {editable ? (
                    <input
                      className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink focus:border-brand-600 focus:outline-none"
                      value={item.productName ?? ""}
                      onChange={(e) => onUpdateItem?.(item.lineNo, { productName: e.target.value || null })}
                    />
                  ) : (
                    item.productName ?? <span className="text-red-500">未入力</span>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums text-ink-soft">{yen(item.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums text-ink">
                  {editable ? (
                    <input
                      type="number"
                      className="w-16 rounded-md border border-surface-border bg-white px-2 py-1 text-right text-sm tabular-nums text-ink focus:border-brand-600 focus:outline-none"
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
                  ) : item.quantity !== null ? (
                    item.quantity.toLocaleString()
                  ) : (
                    <span className="text-red-500">未入力</span>
                  )}
                </td>
                <td className="py-3 text-right text-ink-soft">{item.unit ?? "—"}</td>
                <td className="py-3 text-right tabular-nums text-ink">
                  {item.amount !== null ? yen(item.amount) : <span className="text-red-500">未確定</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between border-b border-surface-border py-1 text-ink-soft">
          <span>小計</span>
          <span className="tabular-nums">{yen(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-surface-border py-1 text-ink-soft">
          <span>消費税</span>
          <span className="tabular-nums">{yen(quote.tax)}</span>
        </div>
        <div className="flex justify-between border-b-2 border-ink py-1.5 text-base font-bold text-ink">
          <span>合計</span>
          <span className="tabular-nums">{yen(quote.total)}</span>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-1 text-xs font-medium text-ink-muted">備考</div>
        {editable ? (
          <textarea
            rows={3}
            className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            value={quote.notes}
            onChange={(e) => onUpdateField?.({ notes: e.target.value })}
          />
        ) : (
          <div className="min-h-[4rem] rounded-md border border-surface-border p-3 text-sm text-ink-soft">{quote.notes || "—"}</div>
        )}
      </div>
    </div>
  );
}
