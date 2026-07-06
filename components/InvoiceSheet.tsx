import type { Invoice, InvoiceLineItem } from "@/lib/types";
import { formatDate, yen } from "@/lib/format";
import { ISSUER } from "@/lib/issuer";

/** 請求書プレビュー (実フォーマット準拠)。editable時は明細・備考を編集できる */
export function InvoiceSheet({
  invoice,
  editable,
  onUpdateItem,
  onUpdateField,
}: {
  invoice: Invoice;
  editable: boolean;
  onUpdateItem?: (lineNo: number, patch: Partial<InvoiceLineItem>) => void;
  onUpdateField?: (patch: Partial<Invoice>) => void;
}) {
  const taxRate10 = invoice.subtotal ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white p-8 shadow-card">
      <h2 className="text-center text-3xl font-bold tracking-wide text-ink">請求書</h2>

      <div className="mt-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-base font-semibold text-ink">{invoice.customerName ?? "取引先未確定"} 御中</p>
        </div>
        <div className="text-right text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">{ISSUER.companyName}</p>
          <p>登録番号：{ISSUER.registrationNo}</p>
          <p className="mt-1">{ISSUER.postalCode}</p>
          {ISSUER.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>TEL: {ISSUER.tel}</p>
          <div className="mt-3 space-y-0.5">
            <p>請求書番号：{invoice.invoiceNo}</p>
            <p>請求日：　　{formatDate(invoice.issuedAt)}</p>
            <p>お支払期限：{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-baseline gap-3 rounded-lg border border-ink px-4 py-3">
        <span className="text-sm font-medium text-ink-soft">ご請求金額</span>
        <span className="text-2xl font-bold text-ink">{yen(invoice.total)}</span>
      </div>

      <div className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs text-ink-soft">
              <th className="py-2 font-medium">納品日</th>
              <th className="py-2 font-medium">品目・納品書番号</th>
              <th className="py-2 text-right font-medium">単価</th>
              <th className="py-2 text-right font-medium">数量</th>
              <th className="py-2 text-right font-medium">単位</th>
              <th className="py-2 text-right font-medium">価格</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.lineNo} className="border-b border-surface-border align-top">
                <td className="py-3 pr-2 text-ink-soft">
                  {editable ? (
                    <input
                      type="date"
                      className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink tabular-nums focus:border-brand-600 focus:outline-none"
                      value={item.deliveryDate ?? ""}
                      onChange={(e) => onUpdateItem?.(item.lineNo, { deliveryDate: e.target.value || null })}
                    />
                  ) : item.deliveryDate ? (
                    formatDate(item.deliveryDate)
                  ) : (
                    <span className="text-red-500">未入力</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-ink">
                  {editable ? (
                    <input
                      className="w-full rounded-md border border-surface-border bg-white px-2 py-1 text-sm text-ink focus:border-brand-600 focus:outline-none"
                      value={item.description ?? ""}
                      onChange={(e) => onUpdateItem?.(item.lineNo, { description: e.target.value || null })}
                    />
                  ) : (
                    item.description ?? <span className="text-red-500">未入力</span>
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

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1 text-xs font-semibold text-ink-muted">税率別内訳</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border text-ink-muted">
                <th className="py-1 text-left font-medium"></th>
                <th className="py-1 text-right font-medium">税抜金額</th>
                <th className="py-1 text-right font-medium">消費税額</th>
                <th className="py-1 text-right font-medium">税込金額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 text-ink-soft">10%</td>
                <td className="py-1 text-right tabular-nums text-ink-soft">{yen(taxRate10)}</td>
                <td className="py-1 text-right tabular-nums text-ink-soft">{yen(invoice.tax)}</td>
                <td className="py-1 text-right tabular-nums text-ink-soft">{yen(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-full max-w-xs space-y-1 text-sm sm:w-auto">
          <div className="flex justify-between border-b border-surface-border py-1 text-ink-soft">
            <span>小計</span>
            <span className="tabular-nums">{yen(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-surface-border py-1 text-ink-soft">
            <span>消費税額合計</span>
            <span className="tabular-nums">{yen(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-b-2 border-ink py-1.5 text-base font-bold text-ink">
            <span>合計</span>
            <span className="tabular-nums">{yen(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-1 text-xs font-semibold text-ink-muted">振込先</div>
        <div className="rounded-md border border-surface-border p-3 text-sm leading-relaxed text-ink-soft">
          <p>{ISSUER.bank.bankBranch}</p>
          <p>
            {ISSUER.bank.accountType} {ISSUER.bank.accountNumber}
          </p>
          <p>{ISSUER.bank.accountHolder}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1 text-xs font-medium text-ink-muted">備考</div>
        {editable ? (
          <textarea
            rows={3}
            className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            value={invoice.notes}
            onChange={(e) => onUpdateField?.({ notes: e.target.value })}
          />
        ) : (
          <div className="min-h-[4rem] rounded-md border border-surface-border p-3 text-sm text-ink-soft">{invoice.notes || "—"}</div>
        )}
      </div>
    </div>
  );
}
