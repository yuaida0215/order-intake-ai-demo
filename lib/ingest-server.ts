import Anthropic from "@anthropic-ai/sdk";
import type { AlertClassification, OrderAlert, OrderChannel, OrderItem, ThreadMessage } from "./types";

// ------------------------------------------------------------
// チャネル共通の取り込みエンジン (サーバー専用)
//   受信メッセージ一覧 → 会話スレッドへグルーピング →
//   Claudeでスレッド単位の受注検出・構造化抽出 → OrderAlert[] を返す。
//   Chatwork / Slack / メール の各ルートから利用する。
//   (§1 常時監視 / §2 会話3〜4ラリーを元データにする要望への対応)
// ------------------------------------------------------------

/** チャネル非依存の受信メッセージ */
export type SourceMessage = {
  /** 一意ID (チャネル接頭辞付き推奨) */
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
  /** 会話のグルーピング単位となるルーム/チャンネルのID (Chatworkルーム, Slackチャンネル等) */
  roomId: string;
  /** アラート画面に表示するルーム名。省略時は sourceName を使う */
  roomLabel?: string;
};

type ExtractedItem = {
  productCode: string | null;
  productName: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
};

type ThreadResult = {
  threadKey: string;
  classification: AlertClassification | "not_order";
  confidence: number;
  reasonJa: string;
  customerName: string | null;
  contactName: string | null;
  messageSenderRoles: { messageId: string; role: "customer" | "self" }[];
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  items: ExtractedItem[];
};

const THREAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "threadKey",
          "classification",
          "confidence",
          "reasonJa",
          "customerName",
          "contactName",
          "messageSenderRoles",
          "requestedDeliveryDate",
          "deliveryAddress",
          "items",
        ],
        properties: {
          threadKey: { type: "string" },
          classification: { type: "string", enum: ["confirmed_order", "probable_order", "not_order"] },
          confidence: { type: "number" },
          reasonJa: { type: "string", description: "80字以内の判定理由" },
          customerName: { anyOf: [{ type: "string" }, { type: "null" }] },
          contactName: { anyOf: [{ type: "string" }, { type: "null" }] },
          messageSenderRoles: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["messageId", "role"],
              properties: {
                messageId: { type: "string" },
                role: { type: "string", enum: ["customer", "self"] },
              },
            },
          },
          requestedDeliveryDate: { anyOf: [{ type: "string" }, { type: "null" }], description: "YYYY-MM-DD" },
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
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `あなたは商品販売会社の「受注監視AI」です。社内担当者(self)と顧客(customer)が入り混じった会話スレッドをいくつか受け取ります。
各スレッドについて、顧客から受注依頼が来ているかどうかを会話の流れ全体から判定し、構造化して返してください。

判定は3値のいずれか:
- confirmed_order: 顧客側の発言に発注意思の確定表現がある（「発注します」「注文お願いします」「この内容で進めてください」等）。品目・数量がある程度特定できる。
- probable_order: 見積依頼・在庫確認・「前回と同じものを」等、受注に発展する可能性が高いが確定発言がない。
- not_order: 雑談・請求/納期問い合わせへの返信・社内連絡・広告/通知など、受注に関係ない会話。

重要なルール:
- 判定は必ず会話全体の流れで行うこと。単独のメッセージだけでは受注に見えても、直後のやり取りで覆っていれば最新の状況を優先する（例: 自社側が「在庫切れです」と返し、顧客が「では結構です」と答えていれば not_order）。
- 各メッセージについて、話者が顧客(customer)か自社側(self)かを、送信者名・文体・立場から判定し messageSenderRoles に含める。判断できない場合は customer とする。
- customerName(取引先名)は本文中の会社名を最優先。なければ送信者名や署名から推定する（個人名だけの場合は null）。
- 日付は必ず YYYY-MM-DD 形式。「来週金曜」等の相対表現は送信日時を基準に確実に解釈できる場合のみ変換し、曖昧なら null。
- 数量(quantity)・単価(unitPrice)は半角数値。書かれていなければ null。
- confidence は判定の確信度 (0〜1)。
- reasonJa は日本語で80字以内の判定理由。
- classification が not_order の場合、items は空配列でよい。
- 画像が添付されている場合は、画像内の文字（LINE等のトーク画面のスクリーンショット、注文書・FAXの写真など）も読み取って抽出する。`;

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

// ------------------------------------------------------------
// 会話スレッドへのグルーピング (§4-2)
//   同一ルーム内で送信間隔が30分以内のメッセージを1つの会話とみなす。
//   1スレッドは最大10メッセージ、48時間を超えたら別スレッドにする。
// ------------------------------------------------------------

const THREAD_GAP_SEC = 30 * 60;
const THREAD_MAX_SPAN_SEC = 48 * 60 * 60;
const THREAD_MAX_MESSAGES = 10;

type ThreadCandidate = { threadKey: string; messages: SourceMessage[] };

function groupIntoThreads(messages: SourceMessage[], cfg: ChannelConfig): ThreadCandidate[] {
  const ordered = [...messages].sort((a, b) => a.sendTime - b.sendTime);
  const groups: SourceMessage[][] = [];
  let current: SourceMessage[] = [];

  for (const m of ordered) {
    if (current.length === 0) {
      current.push(m);
      continue;
    }
    const prev = current[current.length - 1];
    const first = current[0];
    const withinGap = m.sendTime - prev.sendTime <= THREAD_GAP_SEC;
    const withinSpan = m.sendTime - first.sendTime <= THREAD_MAX_SPAN_SEC;
    if (withinGap && withinSpan && current.length < THREAD_MAX_MESSAGES) {
      current.push(m);
    } else {
      groups.push(current);
      current = [m];
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((msgs) => ({
    threadKey: `${cfg.channel}:${cfg.roomId}:${msgs[msgs.length - 1].id}`,
    messages: msgs,
  }));
}

function toThreadMessages(msgs: SourceMessage[], roles: Map<string, "customer" | "self">): ThreadMessage[] {
  return msgs.map((m) => ({
    messageId: m.id,
    senderName: m.sender,
    role: roles.get(m.id) ?? "customer",
    sentAt: toJstIso(m.sendTime),
    text: m.text,
  }));
}

/**
 * メッセージ一覧を会話スレッドへグルーピングし、Claudeへ一括で渡して
 * 受注らしさを判定する。knownThreadKeys に含まれるスレッドはスキップする
 * (アーカイブ済み・既に取り込み済みのスレッドの重複検知防止)。
 * ANTHROPIC_API_KEY はこの関数内でチェックする。
 */
export async function ingestMessages(
  messages: SourceMessage[],
  cfg: ChannelConfig,
  knownThreadKeys: string[] = [],
): Promise<{ alerts: OrderAlert[]; scanned: number }> {
  if (messages.length === 0) return { alerts: [], scanned: 0 };

  const knownSet = new Set(knownThreadKeys);
  const threads = groupIntoThreads(messages, cfg).filter((t) => !knownSet.has(t.threadKey));
  if (threads.length === 0) return { alerts: [], scanned: messages.length };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const MAX_TOTAL_IMAGES = 8;
  let imageBudget = MAX_TOTAL_IMAGES;
  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  for (const thread of threads) {
    contentBlocks.push({ type: "text", text: `\n===== スレッド threadKey: ${thread.threadKey} =====` });
    for (const m of thread.messages) {
      const subjectLine = m.subject ? ` / 件名: ${m.subject}` : "";
      const imgNote = m.images?.length ? ` / 添付画像: ${m.images.length}枚(直後に続く)` : "";
      contentBlocks.push({
        type: "text",
        text: `---\nmessageId: ${m.id} / 送信者: ${m.sender}${subjectLine} / 送信日時: ${jstDate(m.sendTime)} ${jstHm(m.sendTime)}${imgNote} / 本文:\n${m.text || "（本文なし・画像のみ）"}`,
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
  }

  const response = (await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
    output_config: { format: { type: "json_schema", schema: THREAD_SCHEMA } },
  } as Parameters<typeof client.messages.create>[0])) as Anthropic.Message;

  if (response.stop_reason === "refusal") {
    throw new Error("AIがリクエストを処理できませんでした。");
  }
  const textBlock = response.content.find(
    (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text",
  );
  if (!textBlock) throw new Error("AIの応答が空でした。");
  const parsed = JSON.parse(textBlock.text) as { results: ThreadResult[] };

  const threadByKey = new Map(threads.map((t) => [t.threadKey, t]));
  const alerts: OrderAlert[] = [];

  for (const r of parsed.results) {
    if (r.classification === "not_order") continue;
    const thread = threadByKey.get(r.threadKey);
    if (!thread) continue; // 幻覚対策: 実在しないthreadKeyは捨てる

    const roles = new Map(r.messageSenderRoles.map((x) => [x.messageId, x.role]));
    const threadMessages = toThreadMessages(thread.messages, roles);
    const lastMsg = thread.messages[thread.messages.length - 1];

    const items: OrderItem[] = r.items.map((it, idx) => ({
      lineNo: idx + 1,
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.quantity !== null && it.unitPrice !== null ? it.quantity * it.unitPrice : null,
    }));

    alerts.push({
      id: `ALERT-${thread.threadKey}`,
      detectedAt: toJstIso(lastMsg.sendTime),
      channel: cfg.channel,
      kind: "order_conversation",
      thread: {
        threadKey: thread.threadKey,
        channel: cfg.channel,
        roomName: cfg.roomLabel ?? cfg.sourceName,
        participants: [...new Set(thread.messages.map((m) => m.sender))],
        messages: threadMessages,
        lastMessageAt: toJstIso(lastMsg.sendTime),
      },
      aiClassification: r.classification,
      aiConfidence: r.confidence,
      aiReason: r.reasonJa,
      suggestedCustomerName: r.customerName,
      status: "pending",
      orderId: null,
      archivedAt: null,
      archivedReason: null,
      poDocument: null,
      prefilledOrder: {
        customerName: r.customerName,
        customerContactName: r.contactName,
        requestedDeliveryDate: r.requestedDeliveryDate,
        deliveryAddress: r.deliveryAddress,
        items,
        aiConfidenceScore: r.confidence,
        aiSummary: r.reasonJa,
      },
    });
  }

  return { alerts, scanned: messages.length };
}

/** 必須envの存在チェック。欠けている名前を返す */
export function missingEnv(names: string[]): string | null {
  for (const n of names) {
    if (!process.env[n]) return n;
  }
  return null;
}
