import type { CoreSystemInput, Order } from "./types";

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
