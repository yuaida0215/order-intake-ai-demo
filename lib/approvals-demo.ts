// ============================================================
// 上長確認待ち画面 — 部門別シート & デモ承認案件のダミーデータ
//   すべて決定論的 (Date.now / Math.random は使わない)。
//   実ストアの承認フローとは独立した「デモ用」行を提供する。
// ============================================================

import type { ApprovalTarget } from "./types";

export type Department = {
  key: string;
  name: string;
  approver: string;
};

/** 部門マスタ (シートタブ用)。approver = その部門の既定の承認者 */
export const DEPARTMENTS: Department[] = [
  { key: "sales", name: "営業部", approver: "山田 太郎 部長" },
  { key: "purchasing", name: "購買部", approver: "佐藤 花子 課長" },
  { key: "finance", name: "経理部", approver: "鈴木 一郎 マネージャー" },
];

export function departmentByKey(key: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.key === key);
}

/** 部門名を返す (見つからなければキーをそのまま) */
export function departmentName(key: string): string {
  return departmentByKey(key)?.name ?? key;
}

/** 部門の既定承認者名を返す */
export function approverForDepartment(key: string): string {
  return departmentByKey(key)?.approver ?? DEPARTMENTS[0].approver;
}

/**
 * 実ストアの受注ID → 部門キー を決定論的にマッピングする。
 * ID の文字コード和を部門数で割った剰余で割り当てるため、同じIDは常に同じ部門になる。
 */
export function departmentForOrderId(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return DEPARTMENTS[sum % DEPARTMENTS.length].key;
}

export type DemoApproval = {
  id: string;
  departmentKey: string;
  customerName: string;
  target: ApprovalTarget;
  amount: number;
  requester: string;
  approverName: string;
  /** 依頼からの経過を表す表示ラベル (例: "2時間前" / "1営業日前") */
  requestedLabel: string;
  elapsedBusinessDays: number;
  /** AIの前向きな判定コメント */
  aiVerdict: string;
  itemSummary: string;
};

/** デモ用の確認待ち案件 (部門をまたいで分散配置)。決定論的な固定値 */
export const DEMO_APPROVALS: DemoApproval[] = [
  {
    id: "DEMO-A1",
    departmentKey: "sales",
    customerName: "株式会社ミナト商会",
    target: "quote",
    amount: 480000,
    requester: "営業部 田中",
    approverName: "山田 太郎 部長",
    requestedLabel: "2時間前",
    elapsedBusinessDays: 0,
    aiVerdict: "問題なし — 見積単価は商品マスタと一致し、金額・納期に不整合はありません。",
    itemSummary: "業務用冷蔵庫 他2点",
  },
  {
    id: "DEMO-A2",
    departmentKey: "sales",
    customerName: "東海テクノ株式会社",
    target: "order",
    amount: 1260000,
    requester: "営業部 小林",
    approverName: "山田 太郎 部長",
    requestedLabel: "1営業日前",
    elapsedBusinessDays: 1,
    aiVerdict: "問題なし — 金額・数量・納期は過去取引の範囲内で、商品マスタとも整合しています。",
    itemSummary: "制御ユニット 他4点",
  },
  {
    id: "DEMO-B1",
    departmentKey: "purchasing",
    customerName: "株式会社大和資材",
    target: "po",
    amount: 3480000,
    requester: "購買部 井上",
    approverName: "佐藤 花子 課長",
    requestedLabel: "3時間前",
    elapsedBusinessDays: 0,
    aiVerdict: "問題なし — 発注内容は見積と一致し、単価は直近実績と同水準です。",
    itemSummary: "鋼材A 他1点",
  },
  {
    id: "DEMO-B2",
    departmentKey: "purchasing",
    customerName: "富士パーツ工業株式会社",
    target: "po",
    amount: 720000,
    requester: "購買部 中村",
    approverName: "佐藤 花子 課長",
    requestedLabel: "2営業日前",
    elapsedBusinessDays: 2,
    aiVerdict: "問題なし — 品目・数量は発注書と一致し、納期も通常範囲内です。",
    itemSummary: "ベアリング 他6点",
  },
  {
    id: "DEMO-C1",
    departmentKey: "finance",
    customerName: "株式会社浪速リテール",
    target: "invoice",
    amount: 990000,
    requester: "経理部 渡辺",
    approverName: "鈴木 一郎 マネージャー",
    requestedLabel: "1営業日前",
    elapsedBusinessDays: 1,
    aiVerdict: "問題なし — 請求金額は受注・納品実績と一致し、消費税計算も正確です。",
    itemSummary: "月次請求（6月分）",
  },
  {
    id: "DEMO-C2",
    departmentKey: "finance",
    customerName: "九州フードサービス株式会社",
    target: "invoice",
    amount: 264000,
    requester: "経理部 佐々木",
    approverName: "鈴木 一郎 マネージャー",
    requestedLabel: "4時間前",
    elapsedBusinessDays: 0,
    aiVerdict: "問題なし — 請求内訳は納品書と一致し、過去の取引条件とも整合しています。",
    itemSummary: "月次請求（6月分）",
  },
];
