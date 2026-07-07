import type { OrderAlert } from "./types";

// ============================================================
// 受注アラート・会話監視 モックデータ
//   INITIAL_ALERTS : デモ開始直後から /alerts に表示される (2件)
//   DRIP_QUEUE      : 「自動監視」ONで一定間隔で追加投入される (3件)
// ============================================================

export const INITIAL_ALERTS: OrderAlert[] = [
  // ---------------------------------------------------- ① Chatwork 確定受注
  {
    id: "ALERT-001",
    detectedAt: "2026-07-06T09:20:00+09:00",
    channel: "chatwork",
    kind: "order_conversation",
    aiClassification: "confirmed_order",
    aiConfidence: 0.94,
    aiReason:
      "3通目で「正式に発注します」という確定的な発注意思表示があり、品目・数量・納期が特定できるため。",
    suggestedCustomerName: "山田製作所",
    status: "pending",
    orderId: null,
    archivedAt: null,
    archivedReason: null,
    poDocument: null,
    thread: {
      threadKey: "chatwork:room-4821:msg-30291",
      channel: "chatwork",
      roomName: "山田製作所様グループ",
      participants: ["山田様", "自社担当"],
      lastMessageAt: "2026-07-06T09:18:00+09:00",
      messages: [
        {
          messageId: "msg-30289",
          senderName: "山田様",
          role: "customer",
          sentAt: "2026-07-06T09:10:00+09:00",
          text: "先日ご相談した健康ドリンクの件、A-102番の商品を200ケースお願いしたいのですが、納期はいつ頃になりますか？",
        },
        {
          messageId: "msg-30290",
          senderName: "自社担当",
          role: "self",
          sentAt: "2026-07-06T09:14:00+09:00",
          text: "お問い合わせありがとうございます。A-102は在庫がございますので、7/15納品でご案内可能です。",
        },
        {
          messageId: "msg-30291",
          senderName: "山田様",
          role: "customer",
          sentAt: "2026-07-06T09:18:00+09:00",
          text: "承知しました。では7/15納品で、この内容で正式に発注します。よろしくお願いいたします。",
        },
      ],
    },
    prefilledOrder: {
      customerName: "山田製作所",
      customerContactName: "山田様",
      requestedDeliveryDate: "2026-07-15",
      deliveryAddress: null,
      items: [
        {
          lineNo: 1,
          productCode: "A-102",
          productName: "プレミアム健康ドリンク 24本入",
          quantity: 200,
          unit: "ケース",
          unitPrice: 3200,
          amount: 640000,
        },
      ],
      aiConfidenceScore: 0.94,
      aiSummary:
        "A-102を200ケース、7/15納品で正式発注する会話を検知しました。納品先住所は会話内に記載がありません。",
    },
  },

  // ---------------------------------------------------- ② Slack 受注可能性(要確認)
  {
    id: "ALERT-002",
    detectedAt: "2026-07-06T10:05:00+09:00",
    channel: "slack",
    kind: "order_conversation",
    aiClassification: "probable_order",
    aiConfidence: 0.58,
    aiReason: "見積依頼はあるが、確定的な発注意思表示がないため。",
    suggestedCustomerName: "鈴木商店",
    status: "pending",
    orderId: null,
    archivedAt: null,
    archivedReason: null,
    poDocument: null,
    thread: {
      threadKey: "slack:C0192-suzuki:1720227900",
      channel: "slack",
      roomName: "#鈴木商店様連絡",
      participants: ["鈴木様", "自社担当"],
      lastMessageAt: "2026-07-06T10:03:00+09:00",
      messages: [
        {
          messageId: "1720227700",
          senderName: "鈴木様",
          role: "customer",
          sentAt: "2026-07-06T09:55:00+09:00",
          text: "いつもお世話になっております。冷凍うどんセットの価格表をいただけますか？",
        },
        {
          messageId: "1720227800",
          senderName: "自社担当",
          role: "self",
          sentAt: "2026-07-06T09:59:00+09:00",
          text: "承知しました。最新の価格表をお送りします。数量によって割引もございます。",
        },
        {
          messageId: "1720227850",
          senderName: "鈴木様",
          role: "customer",
          sentAt: "2026-07-06T10:01:00+09:00",
          text: "ありがとうございます。確認して検討します。",
        },
        {
          messageId: "1720227900",
          senderName: "鈴木様",
          role: "customer",
          sentAt: "2026-07-06T10:03:00+09:00",
          text: "もし可能であれば、100ケースの場合の見積もりをいただけますか？",
        },
      ],
    },
    prefilledOrder: {
      customerName: "鈴木商店",
      customerContactName: "鈴木様",
      requestedDeliveryDate: null,
      deliveryAddress: null,
      items: [
        {
          lineNo: 1,
          productCode: "FZ-030",
          productName: "冷凍うどんセット",
          quantity: 100,
          unit: "ケース",
          unitPrice: 1500,
          amount: 150000,
        },
      ],
      aiConfidenceScore: 0.58,
      aiSummary: "見積を依頼されていますが、正式な発注意思はまだ示されていません。",
    },
  },
];

export const DRIP_QUEUE: OrderAlert[] = [
  // ---------------------------------------------------- ③ メール 確定受注
  {
    id: "ALERT-003",
    detectedAt: "2026-07-06T11:30:00+09:00",
    channel: "email_body",
    kind: "order_conversation",
    aiClassification: "confirmed_order",
    aiConfidence: 0.91,
    aiReason: "3通目に「正式に発注します」との明言があり、品目・数量・納期が特定できるため。",
    suggestedCustomerName: "高崎フーズ株式会社",
    status: "pending",
    orderId: null,
    archivedAt: null,
    archivedReason: null,
    poDocument: null,
    thread: {
      threadKey: "email_body:thread-9931:m3",
      channel: "email_body",
      roomName: "発注のご相談",
      participants: ["高崎様 <takasaki@takasaki-foods.example.com>", "自社担当"],
      lastMessageAt: "2026-07-06T11:28:00+09:00",
      messages: [
        {
          messageId: "m1",
          senderName: "高崎様",
          role: "customer",
          sentAt: "2026-07-06T11:10:00+09:00",
          text: "件名：発注のご相談\nオーガニック青汁の追加発注を検討しています。前回と同様30包×80ケースでお願いできますか？",
        },
        {
          messageId: "m2",
          senderName: "自社担当",
          role: "self",
          sentAt: "2026-07-06T11:18:00+09:00",
          text: "件名：Re: 発注のご相談\nご連絡ありがとうございます。前回と同条件で承れます。納品希望日はいつ頃でしょうか？",
        },
        {
          messageId: "m3",
          senderName: "高崎様",
          role: "customer",
          sentAt: "2026-07-06T11:28:00+09:00",
          text: "件名：Re: Re: 発注のご相談\nでは7/20希望でお願いします。正式に発注しますので、よろしくお願いいたします。",
        },
      ],
    },
    prefilledOrder: {
      customerName: "高崎フーズ株式会社",
      customerContactName: "高崎様",
      requestedDeliveryDate: "2026-07-20",
      deliveryAddress: "群馬県高崎市栄町4-8",
      items: [
        {
          lineNo: 1,
          productCode: "DR-051",
          productName: "オーガニック青汁 30包",
          quantity: 80,
          unit: "ケース",
          unitPrice: 2800,
          amount: 224000,
        },
      ],
      aiConfidenceScore: 0.91,
      aiSummary: "DR-051を80ケース、7/20納品で正式発注するメールのやり取りを検知しました。",
    },
  },

  // ---------------------------------------------------- ④ Chatwork 受注可能性(低)
  {
    id: "ALERT-004",
    detectedAt: "2026-07-06T13:15:00+09:00",
    channel: "chatwork",
    kind: "order_conversation",
    aiClassification: "probable_order",
    aiConfidence: 0.4,
    aiReason: "発注意思はあるが数量未確定・確認中のため。",
    suggestedCustomerName: "中央物産",
    status: "pending",
    orderId: null,
    archivedAt: null,
    archivedReason: null,
    poDocument: null,
    thread: {
      threadKey: "chatwork:room-5502:msg-11042",
      channel: "chatwork",
      roomName: "中央物産様グループ",
      participants: ["中村様", "自社担当"],
      lastMessageAt: "2026-07-06T13:14:00+09:00",
      messages: [
        {
          messageId: "msg-11040",
          senderName: "中村様",
          role: "customer",
          sentAt: "2026-07-06T13:08:00+09:00",
          text: "来月の定期便、いつも通りの内容でお願いできますか？",
        },
        {
          messageId: "msg-11041",
          senderName: "自社担当",
          role: "self",
          sentAt: "2026-07-06T13:11:00+09:00",
          text: "承知しました。いつもと同じ内容で手配可能です。数量に変更はございますか？",
        },
        {
          messageId: "msg-11042",
          senderName: "中村様",
          role: "customer",
          sentAt: "2026-07-06T13:14:00+09:00",
          text: "少し確認してから連絡します。",
        },
      ],
    },
  },

  // ---------------------------------------------------- ⑤ 発注書受領
  {
    id: "ALERT-005",
    detectedAt: "2026-07-10T09:00:00+09:00",
    channel: "email_pdf",
    kind: "purchase_order_received",
    aiClassification: "confirmed_order",
    aiConfidence: 0.95,
    aiReason: "発注書PDFが添付されたメールを受信したため。",
    suggestedCustomerName: "南九州フーズ株式会社",
    status: "pending",
    orderId: null,
    archivedAt: null,
    archivedReason: null,
    thread: {
      threadKey: "email_pdf:po-mk-20260710-02",
      channel: "email_pdf",
      roomName: "発注書受信",
      participants: ["南九州フーズ株式会社"],
      lastMessageAt: "2026-07-10T09:00:00+09:00",
      messages: [
        {
          messageId: "po-mail-1",
          senderName: "南九州フーズ株式会社",
          role: "customer",
          sentAt: "2026-07-10T09:00:00+09:00",
          text: "件名：発注書送付の件\n発注書を送付いたします。ご確認をお願いいたします。（添付：発注書_MK-20260710-02.pdf）",
        },
      ],
    },
    poDocument: {
      poNo: "MK-20260710-02",
      receivedAt: "2026-07-10T09:00:00+09:00",
      // 実際の発注書PDFを画像として読み取らせるデモ用 (テキストのpreviewLinesはフォールバック用に残す)
      imageUrl: "/mock-documents/po-nankyushu-foods.svg",
      previewLines: [
        { text: "─────────────  発  注  書  ─────────────", readable: true },
        { text: "発注日：2026年7月10日      発注No：MK-20260710-02", readable: true },
        { text: "発注元：南九州フーズ株式会社  購買部", readable: true },
        { text: "納品先：鹿児島県鹿児島市山下町3-14", readable: true },
        { text: "希望納品日：2026年7月25日", readable: true },
        { text: "", readable: true },
        { text: " 商品コード   商品名                数量     単価      金額", readable: true },
        { text: " DR-051      オーガニック青汁 30包   60ケース ¥2,800  ¥168,000", readable: true },
        { text: "", readable: true },
        { text: "                       小計    ¥168,000", readable: true },
        { text: "                       消費税  ¥16,800", readable: true },
        { text: "                       合計    ¥184,800", readable: true },
        { text: "─────────────────────────────────────", readable: true },
      ],
      extracted: {
        customerName: "南九州フーズ株式会社",
        orderDate: "2026-07-10",
        requestedDeliveryDate: "2026-07-25",
        deliveryAddress: "鹿児島県鹿児島市山下町3-14",
        items: [
          {
            lineNo: 1,
            productCode: "DR-051",
            productName: "オーガニック青汁 30包",
            quantity: 60,
            unit: "ケース",
            unitPrice: 2800,
            amount: 168000,
          },
        ],
        totalAmount: 184800,
      },
      relatedQuoteNo: null,
      transcriptionStatus: "not_started",
    },
  },
];
