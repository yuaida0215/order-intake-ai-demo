import type { ApprovalTarget, CoreSystemInput, Invoice, Order, Quote } from "./types";

// 取引先コードのモックマスタ (§6.3 取引先コード表示用)
export const CUSTOMER_CODE: Record<string, string> = {
  "株式会社東京ストア": "CUST-1001",
  "大阪リテール株式会社": "CUST-1002",
  "関東ドラッグ株式会社": "CUST-1003",
  "西日本小売株式会社": "CUST-1004",
  "九州スーパー株式会社": "CUST-1005",
  "北海道フーズ株式会社": "CUST-1006",
  "中部流通株式会社": "CUST-1007",
  "東北商事株式会社": "CUST-1008",
};

export function customerCodeOf(name: string | null): string | null {
  if (!name) return null;
  return CUSTOMER_CODE[name] ?? "CUST-NEW";
}

/** Order から基幹システム入力データを組み立てる (§4.7 / §6.3) */
export function buildCoreSystemInput(
  order: Order,
  registrationStatus: CoreSystemInput["registrationStatus"] = "not_started",
  generatedOrderNo: string | null = null,
): CoreSystemInput {
  return {
    customerCode: customerCodeOf(order.customerName),
    customerName: order.customerName,
    orderDate: order.orderDate,
    requestedDeliveryDate: order.requestedDeliveryDate,
    deliveryAddress: order.deliveryAddress,
    items: order.items,
    totalAmount: order.totalAmount,
    registrationStatus,
    generatedOrderNo,
  };
}

/** 受注番号を採番 (ORD-202607-0001) */
export function makeOrderNo(seq: number): string {
  return `ORD-202607-${String(seq).padStart(4, "0")}`;
}

/** 見積番号を採番 (Q-2026-0001) */
export function makeQuoteNo(seq: number): string {
  return `Q-2026-${String(seq).padStart(4, "0")}`;
}

/** 請求書番号を採番 */
export function makeInvoiceNo(seq: number): string {
  return String(seq);
}

// 見積書自動生成演出のステップ文言
export const QUOTE_GENERATE_STEPS: string[] = [
  "受注内容を確認しています…",
  "見積項目を計算しています…",
  "消費税・合計金額を計算しています…",
  "見積書を組み立てています…",
];

// 請求書自動生成演出のステップ文言
export const INVOICE_GENERATE_STEPS: string[] = [
  "受注内容を確認しています…",
  "請求項目を計算しています…",
  "消費税・振込先情報を設定しています…",
  "請求書を組み立てています…",
];

// ------------------------------------------------------------
// 上長への確認依頼メッセージ (AIドラフト)
//   顧客への確認依頼(カテゴリC・§9)と同様に、上長への確認依頼も
//   必ずAIが文面を自動生成し、人が送信前に編集できるようにする。
// ------------------------------------------------------------

/** デモ上の承認者名 (store.ts の requestApproval と揃える) */
export const DEFAULT_APPROVER_NAME = "山田部長";

export type ApprovalDraftContext = {
  approverName: string;
  customerName: string | null;
  summary: string;
  amountText: string;
};

const APPROVAL_DRAFT_BUILDERS: Record<ApprovalTarget, (ctx: ApprovalDraftContext) => string[]> = {
  order: (ctx) => [
    `${ctx.approverName}\n\nお疲れ様です。${ctx.customerName ?? "取引先"}様より受注した案件（${ctx.summary}）について、基幹システムへの登録前にご確認をお願いいたします。\n金額：${ctx.amountText}`,
    `${ctx.approverName}\n\n${ctx.customerName ?? "取引先"}様の受注内容（${ctx.summary} / ${ctx.amountText}）をご確認いただけますでしょうか。問題なければそのまま登録を進めます。`,
  ],
  quote: (ctx) => [
    `${ctx.approverName}\n\nお疲れ様です。${ctx.customerName ?? "取引先"}様宛の見積書（${ctx.summary} / ${ctx.amountText}）を作成しました。送付前にご確認をお願いいたします。`,
    `${ctx.approverName}\n\n${ctx.customerName ?? "取引先"}様への見積内容（${ctx.amountText}）について、ご確認・ご承認をお願いします。`,
  ],
  po: (ctx) => [
    `${ctx.approverName}\n\nお疲れ様です。${ctx.customerName ?? "取引先"}様より発注書を受領しました（${ctx.summary} / ${ctx.amountText}）。基幹システムへの転記前にご確認をお願いいたします。`,
  ],
  invoice: (ctx) => [
    `${ctx.approverName}\n\nお疲れ様です。${ctx.customerName ?? "取引先"}様宛の請求書（${ctx.summary} / ${ctx.amountText}）を作成しました。送付前にご確認をお願いいたします。`,
    `${ctx.approverName}\n\n${ctx.customerName ?? "取引先"}様への請求内容（${ctx.amountText}）について、ご確認・ご承認をお願いします。`,
  ],
};

export function approvalDraftVariantCount(target: ApprovalTarget): number {
  return APPROVAL_DRAFT_BUILDERS[target]({ approverName: "", customerName: null, summary: "", amountText: "" }).length;
}

/** 上長への確認依頼メッセージをAIドラフトとして生成する (variantIndexで文面のバリエーションを切替) */
export function buildApprovalDraftMessage(target: ApprovalTarget, ctx: ApprovalDraftContext, variantIndex = 0): string {
  const variants = APPROVAL_DRAFT_BUILDERS[target](ctx);
  return variants[variantIndex % variants.length];
}

/** Order から確認依頼メッセージ用の商品サマリを組み立てる */
export function orderItemSummary(order: Order): string {
  const first = order.items[0];
  if (!first?.productName) return "受注内容";
  return order.items.length > 1 ? `${first.productName} 他${order.items.length - 1}点` : first.productName;
}

// ------------------------------------------------------------
// 見積書・請求書の不足項目検知 + 顧客への確認依頼メッセージ (AIドラフト)
// ------------------------------------------------------------

export function detectQuoteMissingFields(quote: Quote): string[] {
  const missing: string[] = [];
  if (!quote.customerName) missing.push("取引先名");
  quote.items.forEach((it, i) => {
    const label = quote.items.length > 1 ? `(${i + 1}行目)` : "";
    if (!it.productName) missing.push(`品目${label}`);
    if (it.quantity === null) missing.push(`数量${label}`);
    if (it.unitPrice === null) missing.push(`単価${label}`);
  });
  return missing;
}

export function detectInvoiceMissingFields(invoice: Invoice): string[] {
  const missing: string[] = [];
  if (!invoice.customerName) missing.push("取引先名");
  invoice.items.forEach((it, i) => {
    const label = invoice.items.length > 1 ? `(${i + 1}行目)` : "";
    if (!it.description) missing.push(`品目${label}`);
    if (it.quantity === null) missing.push(`数量${label}`);
    if (it.unitPrice === null) missing.push(`単価${label}`);
    if (!it.deliveryDate) missing.push(`納品日${label}`);
  });
  return missing;
}

export type CustomerInquiryContext = {
  customerName: string | null;
  customerContactName: string | null;
  documentLabel: "見積書" | "請求書";
  missingFields: string[];
};

/** 敬称が既に付いている場合は重複させない ("佐藤様" → "佐藤様" のまま) */
function withHonorific(name: string): string {
  return name.endsWith("様") ? name : `${name}様`;
}

const CUSTOMER_INQUIRY_VARIANTS = (ctx: CustomerInquiryContext): string[] => {
  const to = `${ctx.customerName ?? "お客様"}\n${ctx.customerContactName ? withHonorific(ctx.customerContactName) : "ご担当者様"}`;
  const fieldList = ctx.missingFields.map((f) => `・${f}`).join("\n");
  return [
    `${to}\n\nいつもお世話になっております。\n${ctx.documentLabel}の作成にあたり、以下の項目についてご確認させてください。\n${fieldList}\n\nお手数をおかけいたしますが、ご確認のほどよろしくお願いいたします。`,
    `${to}\n\nお世話になっております。\n${ctx.documentLabel}のご準備を進めておりますが、下記の点が未確定のためご教示いただけますでしょうか。\n${fieldList}\n\n何卒よろしくお願いいたします。`,
  ];
};

export function customerInquiryDraftVariantCount(): number {
  return 2;
}

/** 見積書・請求書の不足項目について、AIが顧客への確認依頼メッセージをドラフトする */
export function buildCustomerInquiryDraft(ctx: CustomerInquiryContext, variantIndex = 0): string {
  const variants = CUSTOMER_INQUIRY_VARIANTS(ctx);
  return variants[variantIndex % variants.length];
}

// AI読み取り演出のステップ文言 (§1.2 / SCR-002)
export const AI_READING_STEPS: string[] = [
  "元データを取得しています…",
  "OCR / レイアウト解析を実行中…",
  "取引先・商品・数量を抽出中…",
  "商品マスタと照合中…",
  "必須項目の充足を判定中…",
  "案件を分類しています…",
];

// 基幹システム自動入力演出のステップ文言 (§6.3)
export const CORE_INPUT_STEPS: string[] = [
  "AI Agentが基幹システムにログイン中…",
  "取引先情報を入力中…",
  "商品明細を入力中…",
  "納品情報を入力中…",
  "金額を確認中…",
  "登録処理中…",
  "受注登録が完了しました",
];
