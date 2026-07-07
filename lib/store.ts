"use client";

import { create } from "zustand";
import { SAMPLE_ORDERS } from "./data";
import { INITIAL_ALERTS, DRIP_QUEUE } from "./data-alerts";
import { buildCoreSystemInput, makeOrderNo, makeQuoteNo, makeInvoiceNo, DEFAULT_APPROVER_NAME } from "./core";
import { addBusinessDays, businessDaysBetween } from "./business-days";
import type {
  ApprovalRequest,
  ApprovalTarget,
  DemoOrder,
  Invoice,
  InvoiceLineItem,
  MissingField,
  Order,
  OrderAlert,
  OrderItem,
  OrderStatus,
  Quote,
  ReminderChannel,
  ReminderSettings,
} from "./types";

function lastDayOfMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(y, m, 0); // 翌月の0日目 = 当月末日
  const mm = String(last.getMonth() + 1).padStart(2, "0");
  const dd = String(last.getDate()).padStart(2, "0");
  return `${last.getFullYear()}-${mm}-${dd}`;
}

// ------------------------------------------------------------
// デモ用ストア (すべてクライアント側モック。実API連携なし §1.2)
//   起動時は全件 status='new' / isRead=false に伏せておき、
//   「AIで読み取る」で本来のステータス(resolvedStatus)へ確定させる。
// ------------------------------------------------------------

function cloneInitial(): DemoOrder[] {
  return SAMPLE_ORDERS.map((o) => {
    const clone = JSON.parse(JSON.stringify(o)) as DemoOrder;
    clone.isRead = false;
    clone.resolvedStatus = o.status;
    clone.status = "new";
    return clone;
  });
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function nowLabel(): string {
  try {
    return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "--:--:--";
  }
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { channel: "chatwork", thresholdBusinessDays: 2 };

const REMINDER_CHANNEL_LABEL: Record<ReminderChannel, string> = {
  email: "メール",
  slack: "Slack",
  chatwork: "Chatwork",
};

type State = {
  orders: DemoOrder[];
  orderSeq: number;
  quoteSeq: number;
  invoiceSeq: number;
  alerts: OrderAlert[];
  watchQueue: OrderAlert[];
  watchEnabled: boolean;
  lastScanAt: string | null;
  demoDate: string;
  reminderSettings: ReminderSettings;
};

type Actions = {
  getOrder: (id: string) => DemoOrder | undefined;
  patch: (id: string, updater: (o: DemoOrder) => void) => void;
  addLog: (id: string, actor: "ai" | "internal_user" | "system" | "manager", action: string, message: string) => void;

  /** 読み取り演出の開始 (status → ai_reading) */
  markReading: (id: string) => void;
  /** 読み取り確定 (isRead=true / status=resolvedStatus / ログ付与) */
  revealOrder: (id: string) => void;

  /** 基幹システムへ登録完了 (受注番号採番) */
  registerToCore: (id: string) => string;

  /** 例外 B/D を補完・修正して正常化 (→ read_completed) */
  resolveException: (id: string, fieldPatch?: Partial<DemoOrder>) => void;
  /** 明細の任意フィールドを編集 (手入力/修正) */
  updateItem: (id: string, lineNo: number, patch: Partial<OrderItem>) => void;

  /** C 返信ドラフト操作 */
  updateDraftBody: (id: string, body: string) => void;
  regenerateDraft: (id: string) => void;
  saveDraft: (id: string) => void;
  sendReply: (id: string) => void;

  /** デモをリセット (全件 new に戻す) */
  resetDemo: () => void;

  /** 外部取り込み(Chatwork等)で得た DemoOrder を先頭に追加 (sourceMessageId で重複排除)。戻り値は追加件数 */
  addOrders: (orders: DemoOrder[]) => number;

  // ---- 受注アラート ----
  addAlerts: (alerts: OrderAlert[]) => number;
  acceptAlert: (alertId: string) => string | null;
  archiveAlert: (alertId: string, reason?: string) => void;
  toggleWatchMode: (on?: boolean) => void;
  dripNextAlert: () => void;

  // ---- 見積書 ----
  generateQuote: (orderId: string) => void;
  updateQuoteField: (orderId: string, patch: Partial<Quote>) => void;
  updateQuoteItem: (orderId: string, lineNo: number, patch: Partial<OrderItem>) => void;
  sendQuote: (orderId: string) => void;

  // ---- 請求書 (モック) ----
  generateInvoice: (orderId: string) => void;
  updateInvoiceField: (orderId: string, patch: Partial<Invoice>) => void;
  updateInvoiceItem: (orderId: string, lineNo: number, patch: Partial<InvoiceLineItem>) => void;
  sendInvoice: (orderId: string) => void;

  // ---- 上長承認 ----
  requestApproval: (orderId: string, target: ApprovalTarget, note?: string) => void;
  approveRequest: (orderId: string, comment?: string) => void;
  remandRequest: (orderId: string, comment?: string) => void;
  setReminderChannel: (channel: ReminderChannel) => void;
  setReminderThreshold: (days: ReminderSettings["thresholdBusinessDays"]) => void;
  advanceBusinessDays: (n?: number) => void;

  // ---- 発注書 ----
  acceptPoAlert: (alertId: string) => string | null;
  transcribePoToCore: (orderId: string) => string;
};

// C案件の返信文面バリエーション (再生成デモ用)
const DRAFT_VARIANTS = [
  "ご注文内容を確認したところ、希望納品日と納品先住所が未記載でした。お手数ですが、上記2点を追記のうえ再送いただけますでしょうか。",
  "いつもお世話になっております。ご注文を承りましたが、希望納品日と納品先住所の記載が見当たりませんでした。恐れ入りますが、下記2点をご共有いただけますと幸いです。\n・希望納品日\n・納品先住所\nご確認のほど、よろしくお願いいたします。",
  "ご発注ありがとうございます。手配を進めるにあたり、希望納品日・納品先住所の2点が未記載となっておりました。ご多忙のところ恐縮ですが、ご返信いただけますようお願い申し上げます。",
];

/** アラートの会話/prefilledOrderから、伏せ状態(new/isRead=false)のDemoOrderを組み立てる */
function buildOrderFromAlert(alert: OrderAlert, seqLabel: string): DemoOrder {
  const pre = alert.prefilledOrder;
  const items: OrderItem[] = pre?.items?.length
    ? pre.items
    : [{ lineNo: 1, productCode: null, productName: null, quantity: null, unit: null, unitPrice: null, amount: null }];
  const amounts = items.map((i) => i.amount);
  const subtotal = amounts.every((a): a is number => a !== null) ? amounts.reduce((a, b) => a + b, 0) : null;
  const tax = subtotal !== null ? Math.round(subtotal * 0.1) : null;
  const total = subtotal !== null && tax !== null ? subtotal + tax : null;

  const missingFields: MissingField[] = [];
  const miss = (fieldKey: string, fieldLabel: string) =>
    missingFields.push({
      fieldKey,
      fieldLabel,
      reason: `会話内に${fieldLabel}の記載がありません。`,
      requiredBy: "customer",
    });
  const customerName = pre?.customerName ?? alert.suggestedCustomerName;
  if (!customerName) miss("customerName", "取引先名");
  if (!pre?.requestedDeliveryDate) miss("requestedDeliveryDate", "希望納品日");
  if (!pre?.deliveryAddress) miss("deliveryAddress", "納品先住所");
  if (!items[0]?.productName && !items[0]?.productCode) miss("items.productName", "商品名");
  if (items[0]?.quantity === null || items[0]?.quantity === undefined) miss("items.quantity", "数量");

  const confidence = pre?.aiConfidenceScore ?? alert.aiConfidence;

  let status: OrderStatus;
  let exceptionType: Order["exceptionType"];
  let assignedTo: Order["assignedTo"];
  let recommendedAction: string;
  let draftReply: Order["draftReply"] = null;

  if (confidence < 0.5 || !pre) {
    exceptionType = "partial_missing";
    status = "internal_review_required";
    assignedTo = "internal_user";
    recommendedAction = "抽出の確信度が低いため、会話内容を確認してください。";
  } else if (missingFields.length > 0) {
    exceptionType = "customer_missing_info";
    status = "customer_action_required";
    assignedTo = "customer";
    recommendedAction = "取引先に不足情報の追記を依頼してください。";
    const lastCustomerMsg = [...alert.thread.messages].reverse().find((m) => m.role === "customer");
    draftReply = {
      channel: alert.channel,
      to: lastCustomerMsg?.senderName ?? null,
      subject: null,
      body:
        "ご注文ありがとうございます。手配を進めるにあたり、以下の情報が不足しておりました。お手数ですが、ご返信いただけますでしょうか。\n" +
        missingFields.map((m) => `・${m.fieldLabel}`).join("\n"),
      editable: true,
      status: "draft",
    };
  } else {
    exceptionType = null;
    status = "read_completed";
    assignedTo = "ai";
    recommendedAction = "基幹システムへ自動入力するか、見積書を作成してください。";
  }

  const lastMsg = alert.thread.messages[alert.thread.messages.length - 1];

  const order: Order = {
    id: `ALT-${seqLabel}`,
    receivedAt: alert.thread.lastMessageAt,
    channel: alert.channel,
    sourceName: `${alert.thread.roomName} (会話)`,
    customerName: customerName ?? null,
    customerContactName: pre?.customerContactName ?? null,
    customerContactAddress: lastMsg?.senderName ?? null,
    orderDate: alert.thread.lastMessageAt.slice(0, 10),
    requestedDeliveryDate: pre?.requestedDeliveryDate ?? null,
    deliveryAddress: pre?.deliveryAddress ?? null,
    items,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
    status,
    exceptionType,
    assignedTo,
    missingFields,
    validationErrors: [],
    aiConfidenceScore: confidence,
    aiSummary: pre?.aiSummary ?? alert.aiReason,
    recommendedAction,
    draftReply,
    coreSystemInput: null,
    logs: [],
    sourcePreview: {
      kind: "conversation",
      header: `${alert.thread.roomName}`,
      messages: alert.thread.messages,
    },
    sourceMessageId: alert.thread.threadKey,
    threadKey: alert.thread.threadKey,
    alertId: alert.id,
  };

  return { ...order, isRead: false, resolvedStatus: status, status: "new" };
}

/** 発注書アラートから、読み取り済み状態のDemoOrderを組み立てる (§3-6) */
function buildOrderFromPoAlert(alert: OrderAlert, seqLabel: string): DemoOrder {
  const po = alert.poDocument!;
  const ex = po.extracted;
  const items = ex.items.length > 0 ? ex.items : [];
  const subtotal = ex.totalAmount !== null ? Math.round(ex.totalAmount / 1.1) : null;
  const tax = ex.totalAmount !== null && subtotal !== null ? ex.totalAmount - subtotal : null;

  const order: Order = {
    id: `PO-${seqLabel}`,
    receivedAt: po.receivedAt,
    channel: alert.channel,
    sourceName: "発注書 (メール添付PDF)",
    customerName: ex.customerName,
    customerContactName: null,
    customerContactAddress: null,
    orderDate: ex.orderDate,
    requestedDeliveryDate: ex.requestedDeliveryDate,
    deliveryAddress: ex.deliveryAddress,
    items,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: ex.totalAmount,
    status: "po_received",
    exceptionType: null,
    assignedTo: "internal_user",
    missingFields: [],
    validationErrors: [],
    aiConfidenceScore: alert.aiConfidence,
    aiSummary: "発注書を検知し、内容を読み取りました。基幹システムへの転記が必要です。",
    recommendedAction: "内容を確認し、基幹システムへ転記してください。",
    draftReply: null,
    coreSystemInput: null,
    logs: [
      { timestamp: nowLabel(), actor: "ai", action: "po_detected", message: `発注書 ${po.poNo} を検知し、内容を読み取りました。` },
    ],
    sourcePreview: po.imageUrl
      ? { kind: "scanned_image", header: `発注書 ${po.poNo}`, imageDataUrl: po.imageUrl }
      : { kind: "fax_image", header: `発注書 ${po.poNo}`, faxLines: po.previewLines },
    sourceMessageId: alert.thread.threadKey,
    threadKey: alert.thread.threadKey,
    alertId: alert.id,
    poDocument: po,
  };

  return { ...order, isRead: true, resolvedStatus: "po_received" };
}

export const useOrderStore = create<State & Actions>((set, get) => ({
  orders: cloneInitial(),
  orderSeq: 1,
  quoteSeq: 1,
  invoiceSeq: 100,
  alerts: INITIAL_ALERTS.map((a) => ({ ...a })),
  watchQueue: DRIP_QUEUE.map((a) => ({ ...a })),
  watchEnabled: false,
  lastScanAt: null,
  demoDate: todayIso(),
  reminderSettings: { ...DEFAULT_REMINDER_SETTINGS },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  patch: (id, updater) =>
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== id) return o;
        const next = JSON.parse(JSON.stringify(o)) as DemoOrder;
        updater(next);
        return next;
      }),
    })),

  addLog: (id, actor, action, message) =>
    get().patch(id, (o) => {
      o.logs = [...(o.logs ?? []), { timestamp: nowLabel(), actor, action, message }];
    }),

  markReading: (id) => get().patch(id, (o) => { o.status = "ai_reading"; }),

  revealOrder: (id) =>
    get().patch(id, (o) => {
      o.isRead = true;
      o.status = o.resolvedStatus;
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "ai", action: "read", message: `AIが${o.sourceName}を読み取りました (信頼度 ${Math.round(o.aiConfidenceScore * 100)}%)` },
        { timestamp: nowLabel(), actor: "ai", action: "classify", message: o.aiSummary },
      ];
    }),

  registerToCore: (id) => {
    const seq = get().orderSeq;
    const orderNo = makeOrderNo(seq);
    get().patch(id, (o) => {
      o.coreSystemInput = buildCoreSystemInput(o, "completed", orderNo);
      o.status = "auto_input_completed";
      o.assignedTo = "none";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "ai", action: "core_input", message: `基幹システムへ自動入力し、受注番号 ${orderNo} を採番しました` },
      ];
    });
    set((s) => ({ orderSeq: s.orderSeq + 1 }));
    return orderNo;
  },

  resolveException: (id, fieldPatch) =>
    get().patch(id, (o) => {
      if (fieldPatch) Object.assign(o, fieldPatch);
      o.exceptionType = null;
      o.missingFields = [];
      o.validationErrors = [];
      o.status = "read_completed";
      o.assignedTo = "ai";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "internal_user", action: "resolve", message: "担当者が不足項目を補完し、正常案件として確定しました" },
      ];
    }),

  updateItem: (id, lineNo, patch) =>
    get().patch(id, (o) => {
      o.items = o.items.map((it) => (it.lineNo === lineNo ? { ...it, ...patch } : it));
    }),

  updateDraftBody: (id, body) =>
    get().patch(id, (o) => {
      if (o.draftReply) o.draftReply.body = body;
    }),

  regenerateDraft: (id) =>
    get().patch(id, (o) => {
      if (!o.draftReply) return;
      const idx = DRAFT_VARIANTS.indexOf(o.draftReply.body);
      const next = DRAFT_VARIANTS[(idx + 1) % DRAFT_VARIANTS.length];
      o.draftReply.body = next;
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "ai", action: "regenerate", message: "AIが確認依頼文面を再生成しました" },
      ];
    }),

  saveDraft: (id) =>
    get().patch(id, (o) => {
      o.status = "reply_drafted";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "internal_user", action: "save_draft", message: "返信ドラフトを下書き保存しました" },
      ];
    }),

  sendReply: (id) =>
    get().patch(id, (o) => {
      if (o.draftReply) o.draftReply.status = "sent_mock";
      o.status = "waiting_customer_reply";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "internal_user", action: "send", message: "相手先へ確認依頼を送信しました (モック)。相手先返信待ちに移行しました" },
      ];
    }),

  resetDemo: () =>
    set({
      orders: cloneInitial(),
      orderSeq: 1,
      quoteSeq: 1,
      invoiceSeq: 100,
      alerts: INITIAL_ALERTS.map((a) => ({ ...a })),
      watchQueue: DRIP_QUEUE.map((a) => ({ ...a })),
      watchEnabled: false,
      lastScanAt: null,
      demoDate: todayIso(),
      reminderSettings: { ...DEFAULT_REMINDER_SETTINGS },
    }),

  addOrders: (orders) => {
    const existing = get().orders;
    const existingIds = new Set(existing.map((o) => o.sourceMessageId).filter(Boolean));
    const toAdd = orders.filter((o) => !o.sourceMessageId || !existingIds.has(o.sourceMessageId));
    if (toAdd.length === 0) return 0;
    set((s) => ({ orders: [...toAdd, ...s.orders] }));
    return toAdd.length;
  },

  // ------------------------------------------------------------
  // 受注アラート
  // ------------------------------------------------------------

  addAlerts: (newAlerts) => {
    const s = get();
    const knownKeys = new Set([
      ...s.alerts.map((a) => a.thread.threadKey),
      ...s.orders.map((o) => o.threadKey).filter(Boolean),
    ]);
    const toAdd = newAlerts.filter((a) => !knownKeys.has(a.thread.threadKey));
    if (toAdd.length === 0) return 0;
    set((st) => ({ alerts: [...toAdd, ...st.alerts] }));
    return toAdd.length;
  },

  acceptAlert: (alertId) => {
    const alert = get().alerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== "pending") return null;
    if (alert.kind === "purchase_order_received") return get().acceptPoAlert(alertId);

    const seq = get().orderSeq;
    const newOrder = buildOrderFromAlert(alert, String(seq).padStart(3, "0"));
    set((s) => ({
      orders: [newOrder, ...s.orders],
      orderSeq: s.orderSeq + 1,
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, status: "accepted" as const, orderId: newOrder.id } : a)),
    }));
    return newOrder.id;
  },

  archiveAlert: (alertId, reason) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === alertId
          ? { ...a, status: "archived" as const, archivedAt: nowLabel(), archivedReason: reason ?? "まだ受注ではないと判断されました" }
          : a,
      ),
    })),

  toggleWatchMode: (on) =>
    set((s) => ({ watchEnabled: on ?? !s.watchEnabled, lastScanAt: nowLabel() })),

  dripNextAlert: () => {
    const s = get();
    if (s.watchQueue.length === 0) {
      set({ watchEnabled: false });
      return;
    }
    const [next, ...rest] = s.watchQueue;
    const added = get().addAlerts([next]);
    set({ watchQueue: rest, lastScanAt: nowLabel() });
    if (added === 0 && rest.length === 0) set({ watchEnabled: false });
  },

  // ------------------------------------------------------------
  // 見積書
  // ------------------------------------------------------------

  generateQuote: (orderId) => {
    const order = get().getOrder(orderId);
    if (!order) return;
    const seq = get().quoteSeq;
    const quoteNo = makeQuoteNo(seq);
    const items = JSON.parse(JSON.stringify(order.items)) as OrderItem[];
    const quote: Quote = {
      quoteNo,
      createdAt: get().demoDate,
      validUntil: addBusinessDays(get().demoDate, 20),
      customerName: order.customerName,
      items,
      subtotal: order.subtotalAmount,
      tax: order.taxAmount,
      total: order.totalAmount,
      notes: "",
      status: "draft",
      sentAt: null,
    };
    get().patch(orderId, (o) => {
      o.quote = quote;
      o.status = "quote_drafted";
      o.logs = [...(o.logs ?? []), { timestamp: nowLabel(), actor: "ai", action: "quote_generate", message: `見積書 ${quoteNo} を自動生成しました` }];
    });
    set((s) => ({ quoteSeq: s.quoteSeq + 1 }));
  },

  updateQuoteField: (orderId, patch) =>
    get().patch(orderId, (o) => {
      if (!o.quote) return;
      Object.assign(o.quote, patch);
    }),

  updateQuoteItem: (orderId, lineNo, patch) =>
    get().patch(orderId, (o) => {
      if (!o.quote) return;
      o.quote.items = o.quote.items.map((it) => (it.lineNo === lineNo ? { ...it, ...patch } : it));
      const amounts = o.quote.items.map((i) => i.amount);
      const subtotal = amounts.every((a): a is number => a !== null) ? amounts.reduce((a, b) => a + b, 0) : null;
      const tax = subtotal !== null ? Math.round(subtotal * 0.1) : null;
      o.quote.subtotal = subtotal;
      o.quote.tax = tax;
      o.quote.total = subtotal !== null && tax !== null ? subtotal + tax : null;
    }),

  sendQuote: (orderId) =>
    get().patch(orderId, (o) => {
      if (!o.quote) return;
      o.quote.status = "sent_mock";
      o.quote.sentAt = get().demoDate;
      o.status = "quote_sent";
      o.logs = [...(o.logs ?? []), { timestamp: nowLabel(), actor: "internal_user", action: "quote_send", message: `見積書 ${o.quote.quoteNo} を先方へ送付しました (モック)` }];
    }),

  // ------------------------------------------------------------
  // 請求書
  // ------------------------------------------------------------

  generateInvoice: (orderId) => {
    const order = get().getOrder(orderId);
    if (!order) return;
    const seq = get().invoiceSeq;
    const invoiceNo = makeInvoiceNo(seq);
    const items: InvoiceLineItem[] = order.items.map((it) => ({
      lineNo: it.lineNo,
      deliveryDate: order.requestedDeliveryDate,
      description: it.productName,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      unit: it.unit,
      amount: it.amount,
    }));
    const invoice: Invoice = {
      invoiceNo,
      issuedAt: get().demoDate,
      dueDate: lastDayOfMonth(get().demoDate),
      customerName: order.customerName,
      items,
      subtotal: order.subtotalAmount,
      tax: order.taxAmount,
      total: order.totalAmount,
      notes: "",
      status: "draft",
      sentAt: null,
    };
    get().patch(orderId, (o) => {
      o.invoice = invoice;
      o.logs = [...(o.logs ?? []), { timestamp: nowLabel(), actor: "ai", action: "invoice_generate", message: `請求書 ${invoiceNo} を自動生成しました` }];
    });
    set((s) => ({ invoiceSeq: s.invoiceSeq + 1 }));
  },

  updateInvoiceField: (orderId, patch) =>
    get().patch(orderId, (o) => {
      if (!o.invoice) return;
      Object.assign(o.invoice, patch);
    }),

  updateInvoiceItem: (orderId, lineNo, patch) =>
    get().patch(orderId, (o) => {
      if (!o.invoice) return;
      o.invoice.items = o.invoice.items.map((it) => (it.lineNo === lineNo ? { ...it, ...patch } : it));
      const amounts = o.invoice.items.map((i) => i.amount);
      const subtotal = amounts.every((a): a is number => a !== null) ? amounts.reduce((a, b) => a + b, 0) : null;
      const tax = subtotal !== null ? Math.round(subtotal * 0.1) : null;
      o.invoice.subtotal = subtotal;
      o.invoice.tax = tax;
      o.invoice.total = subtotal !== null && tax !== null ? subtotal + tax : null;
    }),

  sendInvoice: (orderId) =>
    get().patch(orderId, (o) => {
      if (!o.invoice) return;
      o.invoice.status = "sent_mock";
      o.invoice.sentAt = get().demoDate;
      o.logs = [...(o.logs ?? []), { timestamp: nowLabel(), actor: "internal_user", action: "invoice_send", message: `請求書 ${o.invoice.invoiceNo} を先方へ送付しました (モック)` }];
    }),

  // ------------------------------------------------------------
  // 上長承認・リマインド
  // ------------------------------------------------------------

  requestApproval: (orderId, target, note) => {
    const order = get().getOrder(orderId);
    if (!order) return;
    const approval: ApprovalRequest = {
      id: `APR-${orderId}`,
      target,
      approverName: DEFAULT_APPROVER_NAME,
      requestedOnDemoDate: get().demoDate,
      requesterNote: note ?? "",
      status: "waiting",
      remindersSent: 0,
      lastReminderOnDemoDate: null,
      decisionComment: null,
      returnStatus: order.status,
    };
    get().patch(orderId, (o) => {
      o.approval = approval;
      o.status = "waiting_manager_approval";
      if (target === "quote" && o.quote) o.quote.status = "approval_requested";
      if (target === "invoice" && o.invoice) o.invoice.status = "approval_requested";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "internal_user", action: "approval_request", message: `${approval.approverName}に確認依頼を送信しました` },
      ];
    });
  },

  approveRequest: (orderId, comment) =>
    get().patch(orderId, (o) => {
      if (!o.approval) return;
      o.approval.status = "approved";
      o.approval.decisionComment = comment ?? null;
      o.status = o.approval.returnStatus;
      if (o.approval.target === "quote" && o.quote) o.quote.status = "draft";
      if (o.approval.target === "invoice" && o.invoice) o.invoice.status = "draft";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "manager", action: "approve", message: `${o.approval.approverName}が承認しました${comment ? `（コメント: ${comment}）` : ""}` },
      ];
    }),

  remandRequest: (orderId, comment) =>
    get().patch(orderId, (o) => {
      if (!o.approval) return;
      o.approval.status = "remanded";
      o.approval.decisionComment = comment ?? null;
      o.status = o.approval.returnStatus;
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "manager", action: "remand", message: `${o.approval.approverName}が差し戻しました${comment ? `（コメント: ${comment}）` : ""}` },
      ];
    }),

  setReminderChannel: (channel) => set((s) => ({ reminderSettings: { ...s.reminderSettings, channel } })),
  setReminderThreshold: (days) => set((s) => ({ reminderSettings: { ...s.reminderSettings, thresholdBusinessDays: days } })),

  advanceBusinessDays: (n = 1) => {
    const newDate = addBusinessDays(get().demoDate, n);
    set({ demoDate: newDate });

    // checkAndFireReminders
    const { orders, reminderSettings } = get();
    const channelLabel = REMINDER_CHANNEL_LABEL[reminderSettings.channel];
    orders
      .filter((o) => o.approval?.status === "waiting")
      .forEach((o) => {
        const approval = o.approval!;
        const from = approval.lastReminderOnDemoDate ?? approval.requestedOnDemoDate;
        const elapsed = businessDaysBetween(from, newDate);
        if (elapsed >= reminderSettings.thresholdBusinessDays) {
          get().patch(o.id, (draft) => {
            if (!draft.approval) return;
            draft.approval.remindersSent += 1;
            draft.approval.lastReminderOnDemoDate = newDate;
            draft.logs = [
              ...(draft.logs ?? []),
              {
                timestamp: nowLabel(),
                actor: "system",
                action: "reminder",
                message: `${channelLabel}で${approval.approverName}にリマインドを送信しました（依頼から${elapsed}営業日経過）`,
              },
            ];
          });
        }
      });
  },

  // ------------------------------------------------------------
  // 発注書
  // ------------------------------------------------------------

  acceptPoAlert: (alertId) => {
    const alert = get().alerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== "pending" || !alert.poDocument) return null;
    const seq = get().orderSeq;
    const newOrder = buildOrderFromPoAlert(alert, String(seq).padStart(3, "0"));
    set((s) => ({
      orders: [newOrder, ...s.orders],
      orderSeq: s.orderSeq + 1,
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, status: "accepted" as const, orderId: newOrder.id } : a)),
    }));
    return newOrder.id;
  },

  transcribePoToCore: (orderId) => {
    // 実際の登録(受注番号採番)は既存の基幹入力画面のアニメーション完了時に行う。
    // ここでは発注書側のステータスのみ更新し、画面遷移先で既存フローに合流させる。
    get().patch(orderId, (o) => {
      if (o.poDocument) o.poDocument.transcriptionStatus = "completed";
      o.logs = [
        ...(o.logs ?? []),
        { timestamp: nowLabel(), actor: "internal_user", action: "po_transcribe", message: "発注書の内容を基幹システムへ転記する準備をしました" },
      ];
    });
    return orderId;
  },
}));
