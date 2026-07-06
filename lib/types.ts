// ============================================================
// 受注取り込みAI Agent デモ — 共通データモデル (要件定義書 §4)
// ============================================================

export type OrderChannel =
  | "fax_image"
  | "email_pdf"
  | "email_body"
  | "slack"
  | "teams"
  | "edi"
  | "chatwork";

export type OrderStatus =
  | "new"
  | "ai_reading"
  | "read_completed"
  | "auto_input_completed"
  | "internal_review_required"
  | "customer_action_required"
  | "reply_drafted"
  | "waiting_customer_reply"
  | "completed";

export type ExceptionType =
  | "ocr_failed"
  | "partial_missing"
  | "customer_missing_info"
  | "validation_error"
  | null;

export type AssigneeType = "ai" | "internal_user" | "customer" | "none";

export type OrderItem = {
  lineNo: number;
  productCode: string | null;
  productName: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  amount: number | null;
};

export type MissingField = {
  fieldKey: string;
  fieldLabel: string;
  reason: string;
  requiredBy: "internal_user" | "customer";
};

export type ValidationError = {
  fieldKey: string;
  fieldLabel: string;
  errorType: "unreadable" | "missing" | "invalid_value" | "mismatch" | "unknown_master";
  message: string;
  requiredBy: "internal_user" | "customer";
};

export type DraftReply = {
  channel: OrderChannel;
  to: string | null;
  subject: string | null;
  body: string;
  editable: boolean;
  status: "draft" | "sent_mock";
};

export type CoreSystemInput = {
  customerCode: string | null;
  customerName: string | null;
  orderDate: string | null;
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  items: OrderItem[];
  totalAmount: number | null;
  registrationStatus: "not_started" | "inputting" | "completed" | "blocked";
  generatedOrderNo: string | null;
};

export type OrderLog = {
  timestamp: string;
  actor: "ai" | "internal_user" | "system";
  action: string;
  message: string;
};

export type Order = {
  id: string;
  receivedAt: string;
  channel: OrderChannel;
  sourceName: string;
  customerName: string | null;
  customerContactName: string | null;
  customerContactAddress: string | null;
  orderDate: string | null;
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  items: OrderItem[];
  subtotalAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  status: OrderStatus;
  exceptionType: ExceptionType;
  assignedTo: AssigneeType;
  missingFields: MissingField[];
  validationErrors: ValidationError[];
  aiConfidenceScore: number;
  aiSummary: string;
  recommendedAction: string;
  draftReply: DraftReply | null;
  coreSystemInput: CoreSystemInput | null;
  logs: OrderLog[];
  /** 元データプレビュー用モックテキスト (§8) */
  sourcePreview?: SourcePreview;
  /** 取り込み元メッセージID (Chatwork等) — 再取り込み時の重複排除に使用 */
  sourceMessageId?: string;
};

/** 元データプレビュー (FAX画像/メール本文/Slack/EDI) */
export type SourcePreview = {
  kind: "fax_image" | "email" | "chat" | "edi";
  /** メール件名やチャット送信者など */
  header?: string;
  /** 本文テキスト (メール/チャット/EDI) */
  body?: string;
  /** FAX画像の擬似行 (読み取り可否付き) */
  faxLines?: { text: string; readable: boolean }[];
  /** 添付画像 (LINEスクショ等) の data URL — chat系プレビューで表示 */
  imageDataUrl?: string;
};

// ============================================================
// デモ実行時の拡張型 (UI ランタイム専用フィールド)
// ============================================================

export type DemoOrder = Order & {
  /** AI読み取り済みか。false のうちは抽出結果を伏せる (§1.2 の "受注書が届く → AIが読み取る") */
  isRead: boolean;
  /** 読み取り後に確定する本来のステータス (デモ開始時は new に伏せておく) */
  resolvedStatus: OrderStatus;
};

/** カテゴリ (§5.1) — 表示・集計用 */
export type OrderCategory = "normal" | "A" | "B" | "C" | "D";
