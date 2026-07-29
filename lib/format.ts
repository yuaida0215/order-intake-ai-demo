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

/** ステータスの配色クラス (bg / text / border / dot) — §13 の意味・色に統一 */
export const STATUS_STYLE: Record<OrderStatus, { chip: string; dot: string }> = {
  // 未処理: グレー
  new: { chip: "bg-white/[0.04] text-ink-soft border-line", dot: "bg-ink-faint" },
  // AI処理中: 紫
  ai_reading: { chip: "bg-brand-500/12 text-brand-300 border-brand-500/30", dot: "bg-brand-400" },
  // 完了: 緑
  read_completed: { chip: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  auto_input_completed: { chip: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { chip: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  // 自社確認待ち: 黄色
  internal_review_required: { chip: "bg-amber-500/12 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  // 相手先確認待ち / 返信待ち: オレンジ
  customer_action_required: { chip: "bg-orange-500/12 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  waiting_customer_reply: { chip: "bg-orange-500/12 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  // 返信ドラフト作成済み: 青
  reply_drafted: { chip: "bg-info-500/12 text-info-300 border-info-500/30", dot: "bg-info-400" },
  // 見積・上長確認待ち: 青
  quote_drafted: { chip: "bg-info-500/12 text-info-300 border-info-500/30", dot: "bg-info-400" },
  quote_sent: { chip: "bg-info-500/12 text-info-300 border-info-500/30", dot: "bg-info-400" },
  waiting_manager_approval: { chip: "bg-info-500/12 text-info-300 border-info-500/30", dot: "bg-info-400" },
  // 発注書受領・転記待ち: 黄色
  po_received: { chip: "bg-amber-500/12 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
};

export const ASSIGNEE_LABEL: Record<AssigneeType, string> = {
  ai: "AI対応中",
  internal_user: "自社対応",
  customer: "相手先対応",
  none: "対応不要",
};

export const ASSIGNEE_STYLE: Record<AssigneeType, string> = {
  ai: "bg-brand-500/12 text-brand-300 border-brand-500/30",
  internal_user: "bg-amber-500/12 text-amber-300 border-amber-500/30",
  customer: "bg-orange-500/12 text-orange-300 border-orange-500/30",
  none: "bg-white/[0.04] text-ink-muted border-line",
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

/** 信頼度に応じた配色 (§8-4: 95%以上=成功 / 85-94%=注意 / 84%以下=要確認) */
export function confidenceStyle(score: number): string {
  if (score >= 0.95) return "text-emerald-300";
  if (score >= 0.85) return "text-amber-300";
  return "text-rose-300";
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
