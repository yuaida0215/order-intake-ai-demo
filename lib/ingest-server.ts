import Anthropic from "@anthropic-ai/sdk";
import type { MissingField, Order, OrderChannel, OrderItem } from "./types";

// ------------------------------------------------------------
// チャネル共通の取り込みエンジン (サーバー専用)
//   受信メッセージ一覧 → Claudeで受注検出・構造化抽出 →
//   §5の分類ルール(決定論的)で Order を組み立てる。
//   Chatwork / Slack / メール の各ルートから利用する。
// ------------------------------------------------------------

/** チャネル非依存の受信メッセージ */
export type SourceMessage = {
  /** sourceMessageId として使う一意ID (チャネル接頭辞付き推奨) */
  id: string;
  /** 送信者表示名 */
  sender: string;
  /** unix秒 */
  sendTime: number;
  /** プレーンテキスト本文 */
  text: string;
  /** メールのみ: 件名 */
  subject?: string | null;
  /** 返信ドラフトの宛先 (メールアドレス/ハンドル等) */
  replyTo?: string | null;
  /** 添付画像 (LINEスクショ・注文書写真等)。AIが画像内の文字も読む */
  images?: { mediaType: string; base64: string }[];
};

/** チャネルごとの表示・組み立て設定 */
export type ChannelConfig = {
  channel: OrderChannel;
  sourceName: string;
  contactAddress: (msg: SourceMessage) => string;
  previewKind: "chat" | "email";
  previewHeader: (msg: SourceMessage) => string;
  previewBody: (msg: SourceMessage) => string;
  /** C案件の返信ドラフト件名 (メールは Re: を付ける等)。省略時 null */
  replySubject?: (msg: SourceMessage) => string | null;
};

type ExtractedItem = {
  productCode: string | null;
  productName: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
};

type ExtractedOrder = {
  sourceMessageId: string;
  customerName: string | null;
  contactName: string | null;
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  items: ExtractedItem[];
  confidence: number;
  summary: string;
};

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["orders"],
  properties: {
    orders: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceMessageId",
          "customerName",
          "contactName",
          "requestedDeliveryDate",
          "deliveryAddress",
          "items",
          "confidence",
          "summary",
        ],
        properties: {
          sourceMessageId: { type: "string" },
          customerName: { anyOf: [{ type: "string" }, { type: "null" }] },
          contactName: { anyOf: [{ type: "string" }, { type: "null" }] },
          requestedDeliveryDate: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "YYYY-MM-DD",
          },
          deliveryAddress: { anyOf: [{ type: "string" }, { type: "null" }] },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["productCode", "productName", "quantity", "unit", "unitPrice"],
              properties: {
                productCode: { anyOf: [{ type: "string" }, { type: "null" }] },
                productName: { anyOf: [{ type: "string" }, { type: "null" }] },
                quantity: { anyOf: [{ type: "number" }, { type: "null" }] },
                unit: { anyOf: [{ type: "string" }, { type: "null" }] },
                unitPrice: { anyOf: [{ type: "number" }, { type: "null" }] },
              },
            },
          },
          confidence: { type: "number" },
          summary: { type: "string" },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `あなたは「受注取り込みAI」の抽出エンジンです。
与えられるメッセージ/メール一覧から、「商品の注文・発注依頼」であるものだけを検出し、構造化して返してください。

ルール:
- 挨拶・雑談・質問・納期確認への返信・社内連絡・広告/通知メールなどは受注ではないので除外する
- 1つの注文メッセージ = 1つの order。複数商品が書かれていれば items を複数にする
- customerName(取引先名)は本文中の会社名を最優先。なければ送信者名や署名から推定(個人名だけなら null)
- 日付は必ず YYYY-MM-DD 形式。「来週金曜」等の相対表現は送信日時を基準に確実に解釈できる場合のみ変換し、曖昧なら null
- 数量(quantity)・単価(unitPrice)は半角数値。書かれていなければ null
- confidence はそのメッセージが受注であり抽出が正確である確信度 (0〜1)
- summary は抽出内容の1文サマリ(日本語)

画像が添付されている場合:
- 画像内の文字(LINE等のトーク画面のスクリーンショット、注文書・FAXの写真など)も読み取って抽出する
- トーク画面のスクショの場合、投稿者はスクショを転送した社内担当者であることが多い。取引先(customerName)や注文者(contactName)は「スクショ画像の中の会話相手」(画面上部の名前や相手側の発言)から推定する
- 注文書の写真の場合、書面内の発注元・品目・数量を読み取る
- 画像が不鮮明で判読できない項目は無理に埋めず null にし、confidence を下げる`;

// unix秒 → JST(+09:00)のISO文字列
export function toJstIso(unixSec: number): string {
  const jst = new Date((unixSec + 9 * 3600) * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${jst.getUTCFullYear()}-${p(jst.getUTCMonth() + 1)}-${p(jst.getUTCDate())}` +
    `T${p(jst.getUTCHours())}:${p(jst.getUTCMinutes())}:${p(jst.getUTCSeconds())}+09:00`
  );
}

export function jstDate(unixSec: number): string {
  return toJstIso(unixSec).slice(0, 10);
}

export function jstHm(unixSec: number): string {
  return toJstIso(unixSec).slice(11, 16);
}

function emptyItem(): ExtractedItem {
  return { productCode: null, productName: null, quantity: null, unit: null, unitPrice: null };
}

// 抽出結果 + 元メッセージ → Order (§5の分類ルールを決定論的に適用)
function buildOrder(ex: ExtractedOrder, msg: SourceMessage, cfg: ChannelConfig): Order {
  const items: OrderItem[] = (ex.items.length > 0 ? ex.items : [emptyItem()]).map(
    (it, idx) => ({
      lineNo: idx + 1,
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.quantity !== null && it.unitPrice !== null ? it.quantity * it.unitPrice : null,
    }),
  );

  const amounts = items.map((i) => i.amount);
  const subtotal = amounts.every((a): a is number => a !== null)
    ? amounts.reduce((a, b) => a + b, 0)
    : null;
  const tax = subtotal !== null ? Math.round(subtotal * 0.1) : null;
  const total = subtotal !== null && tax !== null ? subtotal + tax : null;

  // 必須項目チェック (§5.2)。チャット/メール注文の不足は相手先由来 → requiredBy: customer
  const missingFields: MissingField[] = [];
  const miss = (fieldKey: string, fieldLabel: string) =>
    missingFields.push({
      fieldKey,
      fieldLabel,
      reason: `メッセージ内に${fieldLabel}の記載がありません。`,
      requiredBy: "customer",
    });
  if (!ex.customerName) miss("customerName", "取引先名");
  if (!ex.requestedDeliveryDate) miss("requestedDeliveryDate", "希望納品日");
  if (!ex.deliveryAddress) miss("deliveryAddress", "納品先住所");
  if (!items[0]?.productName && !items[0]?.productCode) miss("items.productName", "商品名");
  if (items[0]?.quantity === null) miss("items.quantity", "数量");

  // 分類 (§5.4)
  let status: Order["status"];
  let exceptionType: Order["exceptionType"];
  let assignedTo: Order["assignedTo"];
  let recommendedAction: string;
  let draftReply: Order["draftReply"] = null;

  if (ex.confidence < 0.5) {
    exceptionType = "partial_missing";
    status = "internal_review_required";
    assignedTo = "internal_user";
    recommendedAction = "抽出の確信度が低いため、メッセージ内容を確認してください。";
  } else if (missingFields.length > 0) {
    exceptionType = "customer_missing_info";
    status = "customer_action_required";
    assignedTo = "customer";
    recommendedAction = "取引先に不足情報の追記を依頼してください。";
    draftReply = {
      channel: cfg.channel,
      to: msg.replyTo ?? msg.sender,
      subject: cfg.replySubject ? cfg.replySubject(msg) : null,
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
    recommendedAction = "基幹システムへ自動入力してください。";
  }

  return {
    id: `${cfg.channel.toUpperCase().replace("_", "-")}-${ex.sourceMessageId}`,
    receivedAt: toJstIso(msg.sendTime),
    channel: cfg.channel,
    sourceName: cfg.sourceName,
    customerName: ex.customerName,
    customerContactName: ex.contactName,
    customerContactAddress: cfg.contactAddress(msg),
    orderDate: jstDate(msg.sendTime),
    requestedDeliveryDate: ex.requestedDeliveryDate,
    deliveryAddress: ex.deliveryAddress,
    items,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
    status,
    exceptionType,
    assignedTo,
    missingFields,
    validationErrors: [],
    aiConfidenceScore: ex.confidence,
    aiSummary: ex.summary,
    recommendedAction,
    draftReply,
    coreSystemInput: null,
    logs: [],
    sourcePreview: {
      kind: cfg.previewKind,
      header: cfg.previewHeader(msg),
      body: cfg.previewBody(msg),
      imageDataUrl: msg.images?.[0]
        ? `data:${msg.images[0].mediaType};base64,${msg.images[0].base64}`
        : undefined,
    },
    sourceMessageId: ex.sourceMessageId,
  };
}

/**
 * メッセージ一覧をClaudeにかけて受注を抽出し、Order[]を返す。
 * ANTHROPIC_API_KEY はこの関数内でチェックする。
 */
export async function ingestMessages(
  messages: SourceMessage[],
  cfg: ChannelConfig,
): Promise<{ orders: Order[]; scanned: number }> {
  if (messages.length === 0) return { orders: [], scanned: 0 };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // テキスト+画像のマルチモーダルcontentを組み立てる (画像は全体で最大8枚に制限)
  const MAX_TOTAL_IMAGES = 8;
  let imageBudget = MAX_TOTAL_IMAGES;
  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  for (const m of messages) {
    const subjectLine = m.subject ? ` / 件名: ${m.subject}` : "";
    const imgNote = m.images?.length ? ` / 添付画像: ${m.images.length}枚(直後に続く)` : "";
    contentBlocks.push({
      type: "text",
      text: `---\nID: ${m.id} / 送信者: ${m.sender}${subjectLine} / 送信日時: ${jstDate(m.sendTime)} ${jstHm(m.sendTime)}${imgNote} / 本文:\n${m.text || "（本文なし・画像のみ）"}`,
    });
    for (const img of m.images ?? []) {
      if (imageBudget <= 0) break;
      imageBudget--;
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: img.base64,
        },
      });
    }
  }

  const response = (await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
    output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA } },
  } as Parameters<typeof client.messages.create>[0])) as Anthropic.Message;

  if (response.stop_reason === "refusal") {
    throw new Error("AIがリクエストを処理できませんでした。");
  }
  const textBlock = response.content.find(
    (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text",
  );
  if (!textBlock) throw new Error("AIの応答が空でした。");
  const parsed = JSON.parse(textBlock.text) as { orders: ExtractedOrder[] };

  const byId = new Map(messages.map((m) => [m.id, m]));
  const orders: Order[] = [];
  for (const ex of parsed.orders) {
    const msg = byId.get(String(ex.sourceMessageId));
    if (!msg) continue; // 幻覚ID対策: 実在メッセージ以外は捨てる
    orders.push(buildOrder(ex, msg, cfg));
  }
  return { orders, scanned: messages.length };
}

/** 必須envの存在チェック。欠けている名前を返す */
export function missingEnv(names: string[]): string | null {
  for (const n of names) {
    if (!process.env[n]) return n;
  }
  return null;
}
