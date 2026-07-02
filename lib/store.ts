"use client";

import { create } from "zustand";
import { SAMPLE_ORDERS } from "./data";
import { buildCoreSystemInput, makeOrderNo } from "./core";
import type { DemoOrder, OrderItem, OrderStatus } from "./types";

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

function nowLabel(): string {
  try {
    return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "--:--:--";
  }
}

type State = {
  orders: DemoOrder[];
  orderSeq: number;
};

type Actions = {
  getOrder: (id: string) => DemoOrder | undefined;
  patch: (id: string, updater: (o: DemoOrder) => void) => void;
  addLog: (id: string, actor: "ai" | "internal_user" | "system", action: string, message: string) => void;

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
};

// C案件の返信文面バリエーション (再生成デモ用)
const DRAFT_VARIANTS = [
  "ご注文内容を確認したところ、希望納品日と納品先住所が未記載でした。お手数ですが、上記2点を追記のうえ再送いただけますでしょうか。",
  "いつもお世話になっております。ご注文を承りましたが、希望納品日と納品先住所の記載が見当たりませんでした。恐れ入りますが、下記2点をご共有いただけますと幸いです。\n・希望納品日\n・納品先住所\nご確認のほど、よろしくお願いいたします。",
  "ご発注ありがとうございます。手配を進めるにあたり、希望納品日・納品先住所の2点が未記載となっておりました。ご多忙のところ恐縮ですが、ご返信いただけますようお願い申し上げます。",
];

export const useOrderStore = create<State & Actions>((set, get) => ({
  orders: cloneInitial(),
  orderSeq: 1,

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

  resetDemo: () => set({ orders: cloneInitial(), orderSeq: 1 }),
}));
