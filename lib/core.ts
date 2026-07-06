import type { ApprovalTarget, CoreSystemInput, Order } from "./types";

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

// 見積書自動生成演出のステップ文言
export const QUOTE_GENERATE_STEPS: string[] = [
  "受注内容を確認しています…",
  "見積項目を計算しています…",
  "納期・支払条件を設定しています…",
  "見積書を組み立てています…",
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
