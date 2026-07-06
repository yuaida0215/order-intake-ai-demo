import type {
  AssigneeType,
  DemoOrder,
  Order,
  OrderCategory,
  OrderChannel,
  OrderStatus,
} from "./types";

// ------------------------------------------------------------
// 表示ラベル (要件定義書 §10)
// ------------------------------------------------------------

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "新規受信",
  ai_reading: "AI読み取り中",
  read_completed: "読み取り完了",
  auto_input_completed: "自動入力完了",
  internal_review_required: "自社確認待ち",
  customer_action_required: "相手先確認待ち",
  reply_drafted: "返信ドラフト作成済み",
  waiting_customer_reply: "相手先返信待ち",
  completed: "完了",
  quote_drafted: "見積書作成済み",
  quote_sent: "見積送付済み",
  waiting_manager_approval: "上長確認待ち",
  po_received: "発注書受領・転記待ち",
};

/** ステータスの配色クラス (bg / text / border / dot) */
export const STATUS_STYLE: Record<OrderStatus, { chip: string; dot: string }> = {
  new: { chip: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
  ai_reading: { chip: "bg-brand-50 text-brand-700 border-brand-200", dot: "bg-brand-500" },
  read_completed: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  auto_input_completed: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  internal_review_required: { chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  customer_action_required: { chip: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  reply_drafted: { chip: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  waiting_customer_reply: { chip: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  completed: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  quote_drafted: { chip: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  quote_sent: { chip: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  waiting_manager_approval: { chip: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  po_received: { chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

export const ASSIGNEE_LABEL: Record<AssigneeType, string> = {
  ai: "AI対応中",
  internal_user: "自社対応",
  customer: "相手先対応",
  none: "対応不要",
};

export const ASSIGNEE_STYLE: Record<AssigneeType, string> = {
  ai: "bg-brand-50 text-brand-700 border-brand-200",
  internal_user: "bg-amber-50 text-amber-700 border-amber-200",
  customer: "bg-red-50 text-red-700 border-red-200",
  none: "bg-gray-100 text-gray-600 border-gray-200",
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  fax_image: "FAX画像",
  email_pdf: "メールPDF",
  email_body: "メール本文",
  slack: "Slack",
  teams: "Teams",
  edi: "EDI",
  chatwork: "Chatwork",
};

/** チャネルアイコン (絵文字で軽量に) */
export const CHANNEL_ICON: Record<OrderChannel, string> = {
  fax_image: "📠",
  email_pdf: "📎",
  email_body: "✉️",
  slack: "💬",
  teams: "👥",
  edi: "🔗",
  chatwork: "🗨️",
};

// ------------------------------------------------------------
// カテゴリ判定 (§5.1)
// ------------------------------------------------------------

export function orderCategory(o: Pick<Order, "exceptionType">): OrderCategory {
  switch (o.exceptionType) {
    case "ocr_failed":
      return "A";
    case "partial_missing":
      return "B";
    case "customer_missing_info":
      return "C";
    case "validation_error":
      return "D";
    default:
      return "normal";
  }
}

export const CATEGORY_LABEL: Record<OrderCategory, string> = {
  normal: "正常案件",
  A: "A: 読み取り失敗",
  B: "B: 一部虫食い",
  C: "C: 相手先不備",
  D: "D: バリデーションエラー",
};

// ------------------------------------------------------------
// フォーマッタ
// ------------------------------------------------------------

export function yen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return "¥" + n.toLocaleString("ja-JP");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${mm}/${dd}`;
}

export function totalQuantity(o: Pick<Order, "items">): number | null {
  const qs = o.items.map((i) => i.quantity).filter((q): q is number => q !== null);
  if (qs.length === 0) return null;
  return qs.reduce((a, b) => a + b, 0);
}

/** 信頼度スコアを % 表記に */
export function confidencePct(score: number): string {
  return Math.round(score * 100) + "%";
}

/** 信頼度に応じた配色 */
export function confidenceStyle(score: number): string {
  if (score >= 0.85) return "text-emerald-600";
  if (score >= 0.5) return "text-amber-600";
  return "text-red-600";
}

/** 対応待ちが自社側か相手先側か (視覚区別用) */
export function waitingSide(o: Pick<Order, "assignedTo">): "internal" | "customer" | null {
  if (o.assignedTo === "internal_user") return "internal";
  if (o.assignedTo === "customer") return "customer";
  return null;
}

/** 案件が「例外(要確認)」かどうか */
export function isException(o: Pick<Order, "exceptionType">): boolean {
  return o.exceptionType !== null;
}

/** 読み取り後、案件詳細で遷移すべき画面を決める */
export function detailRoute(o: DemoOrder): string {
  if (!o.isRead || o.status === "new") return `/orders/${o.id}/read`;
  if (isException({ exceptionType: o.exceptionType })) return `/orders/${o.id}/exception`;
  if (o.status === "auto_input_completed" || o.status === "completed") {
    return `/orders/${o.id}/core-system-input`;
  }
  return `/orders/${o.id}/read`;
}
