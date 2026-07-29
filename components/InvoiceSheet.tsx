import type { Invoice, InvoiceLineItem } from "@/lib/types";
import { formatDate, yen } from "@/lib/format";
import { ISSUER } from "@/lib/issuer";
import { Icon } from "@/components/icons";

/** AI が自動入力した値であることを示す小さなパープルのピル */
function AITag() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap rounded border border-brand-200 bg-brand-50 px-1 py-px align-middle text-[10px] font-medium leading-none text-brand-600">
      <Icon name="sparkles" className="h-2.5 w-2.5" strokeWidth={2} />
      AI入力
    </span>
  );
}

/** テーブルセル用のごく小さな AI マーク (ピルだと窮屈なため) */
function AiSpark() {
  return <Icon name="sparkles" className="ml-1 inline-block h-2.5 w-2.5 align-middle text-brand-500" strokeWidth={2} />;
}

const INPUT_CLASS =
  "rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40";

/** 請求書プレビュー (実フォーマット準拠)。ダークなアプリUIの中に置く「白い紙」の請求書。editable時は明細・備考を編集できる */
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
    <div className="mx-auto w-full max-w-[860px] rounded-lg border border-gray-200 bg-white p-8 text-gray-900 shadow-lg sm:p-10">
      <h2 className="text-center text-3xl font-bold tracking-[0.3em] text-gray-900">請求書</h2>

      <div className="mt-10 flex items-start justify-between gap-6">
        <div>
          <p className="border-b border-gray-300 pb-1 text-base font-semibold text-gray-900">
            {invoice.customerName ?? <span className="text-rose-500">取引先未確定</span>} 御中
            {invoice.customerName ? <AITag /> : null}
          </p>
        </div>
        <div className="text-right text-sm leading-relaxed text-gray-700">
          <p className="font-semibold text-gray-900">{ISSUER.companyName}</p>
          <p className="text-gray-500">登録番号：{ISSUER.registrationNo}</p>
          <p className="mt-1 text-gray-500">{ISSUER.postalCode}</p>
          {ISSUER.addressLines.map((line) => (
            <p key={line} className="text-gray-500">
              {line}
            </p>
          ))}
          <p className="text-gray-500">TEL: {ISSUER.tel}</p>
          <div className="mt-3 space-y-0.5 text-gray-700">
            <p>請求書番号：{invoice.invoiceNo}</p>
            <p>請求日：　　{formatDate(invoice.issuedAt)}</p>
            <p>お支払期限：{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-baseline gap-3 rounded-lg border-2 border-gray-800 px-4 py-3">
        <span className="text-sm font-medium text-gray-600">ご請求金額</span>
        <span className="text-2xl font-bold tabular-nums text-gray-900">{yen(invoice.total)}</span>
        <AiSpark />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left text-xs text-gray-500">
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
              <tr key={item.lineNo} className="border-b border-gray-200 align-top">
                <td className="py-3 pr-2 text-gray-700">
                  {editable ? (
                    <span className="inline-flex items-center">
                      <input
                        type="date"
                        className={`${INPUT_CLASS} w-full tabular-nums`}
                        value={item.deliveryDate ?? ""}
                        onChange={(e) => onUpdateItem?.(item.lineNo, { deliveryDate: e.target.value || null })}
                      />
                      <AiSpark />
                    </span>
                  ) : item.deliveryDate ? (
                    <>
                      {formatDate(item.deliveryDate)}
                      <AiSpark />
                    </>
                  ) : (
                    <span className="text-rose-500">未入力</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-gray-900">
                  {editable ? (
                    <span className="flex items-center">
                      <input
                        className={`${INPUT_CLASS} w-full`}
                        value={item.description ?? ""}
                        onChange={(e) => onUpdateItem?.(item.lineNo, { description: e.target.value || null })}
                      />
                      <AiSpark />
                    </span>
                  ) : item.description ? (
                    <>
                      {item.description}
                      <AiSpark />
                    </>
                  ) : (
                    <span className="text-rose-500">未入力</span>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums text-gray-700">{yen(item.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums text-gray-900">
                  {editable ? (
                    <span className="inline-flex items-center justify-end">
                      <input
                        type="number"
                        className={`${INPUT_CLASS} w-16 text-right tabular-nums`}
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
                      <AiSpark />
                    </span>
                  ) : item.quantity !== null ? (
                    <>
                      {item.quantity.toLocaleString()}
                      <AiSpark />
                    </>
                  ) : (
                    <span className="text-rose-500">未入力</span>
                  )}
                </td>
                <td className="py-3 text-right text-gray-600">{item.unit ?? "—"}</td>
                <td className="py-3 text-right tabular-nums text-gray-900">
                  {item.amount !== null ? (
                    <>
                      {yen(item.amount)}
                      <AiSpark />
                    </>
                  ) : (
                    <span className="text-rose-500">未確定</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1 text-xs font-semibold text-gray-500">税率別内訳</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-1 text-left font-medium"></th>
                <th className="py-1 text-right font-medium">税抜金額</th>
                <th className="py-1 text-right font-medium">消費税額</th>
                <th className="py-1 text-right font-medium">税込金額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 text-gray-700">10%</td>
                <td className="py-1 text-right tabular-nums text-gray-700">{yen(taxRate10)}</td>
                <td className="py-1 text-right tabular-nums text-gray-700">{yen(invoice.tax)}</td>
                <td className="py-1 text-right tabular-nums text-gray-700">{yen(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-full max-w-xs space-y-1 text-sm sm:w-auto">
          <div className="flex justify-between border-b border-gray-200 py-1 text-gray-700">
            <span>小計</span>
            <span className="tabular-nums">{yen(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-1 text-gray-700">
            <span>消費税額合計</span>
            <span className="tabular-nums">{yen(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-b-2 border-gray-800 py-1.5 text-base font-bold text-gray-900">
            <span>合計</span>
            <span className="tabular-nums">{yen(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-1 text-xs font-semibold text-gray-500">振込先</div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
          <p>{ISSUER.bank.bankBranch}</p>
          <p>
            {ISSUER.bank.accountType} {ISSUER.bank.accountNumber}
          </p>
          <p>{ISSUER.bank.accountHolder}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1 text-xs font-medium text-gray-500">備考</div>
        {editable ? (
          <textarea
            rows={3}
            className={`${INPUT_CLASS} w-full`}
            value={invoice.notes}
            onChange={(e) => onUpdateField?.({ notes: e.target.value })}
          />
        ) : (
          <div className="min-h-[4rem] rounded-md border border-gray-200 p-3 text-sm text-gray-700">
            {invoice.notes || "—"}
          </div>
        )}
      </div>
    </div>
  );
}
