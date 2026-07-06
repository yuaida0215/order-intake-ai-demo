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
  | "completed"
  | "quote_drafted"
  | "quote_sent"
  | "waiting_manager_approval"
  | "po_received";

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
  actor: "ai" | "internal_user" | "system" | "manager";
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
  /** 会話スレッドの重複排除キー (受注アラート経由の案件のみ) */
  threadKey?: string;
  /** 発生元アラートID (受注アラート経由の案件のみ) */
  alertId?: string;
  /** 見積書 (見積書作成ボタンで生成) */
  quote?: Quote;
  /** 請求書 (請求書作成ボタンで生成) */
  invoice?: Invoice;
  /** 上長への確認依頼 (上長に確認依頼ボタンで生成) */
  approval?: ApprovalRequest;
  /** 発注書 (発注書受領アラート経由の案件のみ) */
  poDocument?: PurchaseOrderDoc;
};

/** 元データプレビュー (FAX画像/メール本文/Slack/EDI/会話スレッド) */
export type SourcePreview = {
  kind: "fax_image" | "email" | "chat" | "edi" | "conversation";
  /** メール件名やチャット送信者など */
  header?: string;
  /** 本文テキスト (メール/チャット/EDI) */
  body?: string;
  /** FAX画像の擬似行 (読み取り可否付き) */
  faxLines?: { text: string; readable: boolean }[];
  /** 添付画像 (LINEスクショ等) の data URL — chat系プレビューで表示 */
  imageDataUrl?: string;
  /** 会話ラリー (kind="conversation" のとき使用) */
  messages?: ThreadMessage[];
};

// ============================================================
// 受注アラート・会話監視 (機能拡張)
// ============================================================

export type ThreadMessage = {
  messageId: string;
  senderName: string;
  role: "customer" | "self";
  sentAt: string;
  text: string;
};

export type ConversationThread = {
  /** 重複排除キー: `${channel}:${roomOrThreadId}:${lastMessageId}` */
  threadKey: string;
  channel: OrderChannel;
  roomName: string;
  participants: string[];
  messages: ThreadMessage[];
  lastMessageAt: string;
};

export type AlertClassification = "confirmed_order" | "probable_order";

/** AIが会話/書類から検知した、人の確認を待つアラート */
export type OrderAlert = {
  id: string;
  detectedAt: string;
  channel: OrderChannel;
  kind: "order_conversation" | "purchase_order_received";
  thread: ConversationThread;
  aiClassification: AlertClassification;
  aiConfidence: number;
  aiReason: string;
  suggestedCustomerName: string | null;
  status: "pending" | "accepted" | "archived";
  orderId: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  /** kind="purchase_order_received" のときの発注書本体 */
  poDocument: PurchaseOrderDoc | null;
  /** AIが会話から事前抽出した受注内容 (accept時にOrderへ転写する「隠し正解」) */
  prefilledOrder?: {
    customerName: string | null;
    customerContactName: string | null;
    requestedDeliveryDate: string | null;
    deliveryAddress: string | null;
    items: OrderItem[];
    aiConfidenceScore: number;
    aiSummary: string;
  };
};

export type Quote = {
  quoteNo: string;
  createdAt: string;
  validUntil: string;
  customerName: string | null;
  items: OrderItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string;
  status: "generating" | "draft" | "sent_mock" | "approval_requested";
  sentAt: string | null;
};

export type InvoiceLineItem = {
  lineNo: number;
  deliveryDate: string | null;
  /** 品目・納品書番号 */
  description: string | null;
  unitPrice: number | null;
  quantity: number | null;
  unit: string | null;
  amount: number | null;
};

export type Invoice = {
  invoiceNo: string;
  issuedAt: string;
  dueDate: string;
  customerName: string | null;
  items: InvoiceLineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string;
  status: "generating" | "draft" | "sent_mock" | "approval_requested";
  sentAt: string | null;
};

export type ApprovalTarget = "quote" | "order" | "po" | "invoice";

export type ApprovalRequest = {
  id: string;
  target: ApprovalTarget;
  approverName: string;
  requestedOnDemoDate: string;
  requesterNote: string;
  status: "waiting" | "approved" | "remanded";
  remindersSent: number;
  lastReminderOnDemoDate: string | null;
  decisionComment: string | null;
  /** 承認/差し戻し後にOrder.statusを戻す先 */
  returnStatus: OrderStatus;
};

export type ReminderChannel = "email" | "slack" | "chatwork";

export type ReminderSettings = {
  channel: ReminderChannel;
  thresholdBusinessDays: 1 | 2 | 3 | 5;
};

export type PurchaseOrderDoc = {
  poNo: string;
  receivedAt: string;
  previewLines: { text: string; readable: boolean }[];
  extracted: {
    customerName: string | null;
    orderDate: string | null;
    requestedDeliveryDate: string | null;
    deliveryAddress: string | null;
    items: OrderItem[];
    totalAmount: number | null;
  };
  relatedQuoteNo: string | null;
  transcriptionStatus: "not_started" | "transcribing" | "completed";
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
