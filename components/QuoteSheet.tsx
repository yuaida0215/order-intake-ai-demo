import type { OrderItem, Quote } from "@/lib/types";
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

/** 見積書プレビュー (実フォーマット準拠)。ダークなアプリUIの中に置く「白い紙」の見積書。editable時は明細・備考を編集できる */
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
    <div className="mx-auto w-full max-w-[860px] rounded-lg border border-gray-200 bg-white p-8 text-gray-900 shadow-lg sm:p-10">
      <h2 className="text-center text-3xl font-bold tracking-[0.3em] text-gray-900">見積書</h2>

      <div className="mt-10 flex items-start justify-between gap-6">
        <div>
          <p className="border-b border-gray-300 pb-1 text-base font-semibold text-gray-900">
            {quote.customerName ?? <span className="text-rose-500">取引先未確定</span>} 御中
            {quote.customerName ? <AITag /> : null}
          </p>
        </div>
        <div className="text-right text-sm leading-relaxed text-gray-700">
          <p className="font-semibold text-gray-900">{ISSUER.companyName}</p>
          <p className="mt-1 text-gray-500">{ISSUER.postalCode}</p>
          {ISSUER.addressLines.map((line) => (
            <p key={line} className="text-gray-500">
              {line}
            </p>
          ))}
          <p className="text-gray-500">TEL: {ISSUER.tel}</p>
          <div className="mt-3 space-y-0.5 text-gray-700">
            <p>見積書番号：{quote.quoteNo}</p>
            <p>発行日：　{formatDate(quote.createdAt)}</p>
            <p>有効期限：{formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-baseline gap-3 rounded-lg border-2 border-gray-800 px-4 py-3">
        <span className="text-sm font-medium text-gray-600">御見積金額</span>
        <span className="text-2xl font-bold tabular-nums text-gray-900">{yen(quote.total)}</span>
        <AiSpark />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left text-xs text-gray-500">
              <th className="py-2 font-medium">品目</th>
              <th className="py-2 text-right font-medium">単価</th>
              <th className="py-2 text-right font-medium">数量</th>
              <th className="py-2 text-right font-medium">単位</th>
              <th className="py-2 text-right font-medium">価格</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.lineNo} className="border-b border-gray-200 align-top">
                <td className="py-3 pr-3 text-gray-900">
                  {editable ? (
                    <span className="flex items-center">
                      <input
                        className={`${INPUT_CLASS} w-full`}
                        value={item.productName ?? ""}
                        onChange={(e) => onUpdateItem?.(item.lineNo, { productName: e.target.value || null })}
                      />
                      <AiSpark />
                    </span>
                  ) : item.productName ? (
                    <>
                      {item.productName}
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

      <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between border-b border-gray-200 py-1 text-gray-700">
          <span>小計</span>
          <span className="tabular-nums">{yen(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-1 text-gray-700">
          <span>消費税</span>
          <span className="tabular-nums">{yen(quote.tax)}</span>
        </div>
        <div className="flex justify-between border-b-2 border-gray-800 py-1.5 text-base font-bold text-gray-900">
          <span>合計</span>
          <span className="tabular-nums">{yen(quote.total)}</span>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-1 text-xs font-medium text-gray-500">備考</div>
        {editable ? (
          <textarea
            rows={3}
            className={`${INPUT_CLASS} w-full`}
            value={quote.notes}
            onChange={(e) => onUpdateField?.({ notes: e.target.value })}
          />
        ) : (
          <div className="min-h-[4rem] rounded-md border border-gray-200 p-3 text-sm text-gray-700">
            {quote.notes || "—"}
          </div>
        )}
      </div>
    </div>
  );
}
