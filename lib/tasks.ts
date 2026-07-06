import type { DemoOrder, OrderAlert, ReminderSettings } from "./types";
import { businessDaysBetween } from "./business-days";

export type TaskOwner = "internal_user" | "manager" | "customer" | "ai";

export type TaskItem = {
  key: string;
  orderId?: string;
  alertId?: string;
  customerName: string;
  owner: TaskOwner;
  title: string;
  priority: "high" | "normal";
  href: string;
  waitingDays?: number;
};

const APPROVAL_TARGET_LABEL: Record<string, string> = { quote: "見積書", order: "受注内容", po: "発注書", invoice: "請求書" };

function approvalHref(order: DemoOrder): string {
  if (order.approval?.target === "quote") return `/orders/${order.id}/quote`;
  if (order.approval?.target === "po") return `/orders/${order.id}/po`;
  if (order.approval?.target === "invoice") return `/orders/${order.id}/invoice`;
  return `/orders/${order.id}/read`;
}

/**
 * 全案件・全アラートを横断して「誰が何をすべきか」を導出する純関数。
 * どこにも保存せず、呼び出しの都度計算する (§6)。
 */
export function deriveTasks(
  orders: DemoOrder[],
  alerts: OrderAlert[],
  demoDate: string,
  reminderSettings: ReminderSettings,
): TaskItem[] {
  const tasks: TaskItem[] = [];

  for (const alert of alerts) {
    if (alert.status !== "pending") continue;
    const customerName = alert.suggestedCustomerName ?? "取引先不明";
    if (alert.kind === "purchase_order_received") {
      tasks.push({
        key: `alert-${alert.id}`,
        alertId: alert.id,
        customerName,
        owner: "internal_user",
        title: "届いた発注書を確認する",
        priority: "normal",
        href: "/alerts",
      });
    } else {
      tasks.push({
        key: `alert-${alert.id}`,
        alertId: alert.id,
        customerName,
        owner: "internal_user",
        title: "受注か確認する",
        priority: alert.aiClassification === "confirmed_order" ? "high" : "normal",
        href: "/alerts",
      });
    }
  }

  for (const o of orders) {
    const customerName = o.customerName ?? "取引先不明";
    const highValue = (o.totalAmount ?? 0) >= 1000000;

    if (o.approval?.status === "waiting") {
      const elapsed = businessDaysBetween(o.approval.requestedOnDemoDate, demoDate);
      tasks.push({
        key: `order-${o.id}`,
        orderId: o.id,
        customerName,
        owner: "manager",
        title: `${APPROVAL_TARGET_LABEL[o.approval.target]}を承認する（経過${elapsed}営業日）`,
        priority: elapsed >= reminderSettings.thresholdBusinessDays || highValue ? "high" : "normal",
        href: "/approvals",
        waitingDays: elapsed,
      });
      continue;
    }

    if (o.approval?.status === "remanded") {
      tasks.push({
        key: `order-${o.id}`,
        orderId: o.id,
        customerName,
        owner: "internal_user",
        title: `差し戻し内容を修正する${o.approval.decisionComment ? `（${o.approval.decisionComment}）` : ""}`,
        priority: "high",
        href: approvalHref(o),
      });
      continue;
    }

    if (o.status === "new") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "AIで読み取りを実行する", priority: "normal", href: `/orders/${o.id}/read` });
      continue;
    }
    if (o.status === "ai_reading") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "ai", title: "AI読み取り処理中", priority: "normal", href: `/orders/${o.id}/read` });
      continue;
    }
    if (o.exceptionType === "ocr_failed") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "読み取り失敗：手入力で登録する", priority: "high", href: `/orders/${o.id}/exception` });
      continue;
    }
    if (o.exceptionType === "partial_missing") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "不足項目を補完する", priority: "normal", href: `/orders/${o.id}/exception` });
      continue;
    }
    if (o.exceptionType === "customer_missing_info") {
      if (o.status === "waiting_customer_reply") {
        tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "customer", title: "相手先からの回答待ち", priority: "normal", href: `/orders/${o.id}/exception` });
      } else {
        tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "確認依頼の返信文面を確認・送信する", priority: "normal", href: `/orders/${o.id}/exception` });
      }
      continue;
    }
    if (o.exceptionType === "validation_error") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "商品コードを修正する", priority: "normal", href: `/orders/${o.id}/exception` });
      continue;
    }
    if (o.status === "po_received") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "発注書を確認し基幹へ転記する", priority: "normal", href: `/orders/${o.id}/po` });
      continue;
    }
    if (o.status === "quote_drafted") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "internal_user", title: "見積書を送付 or 承認依頼する", priority: "normal", href: `/orders/${o.id}/quote` });
      continue;
    }
    if (o.status === "quote_sent") {
      tasks.push({ key: `order-${o.id}`, orderId: o.id, customerName, owner: "customer", title: "見積への先方回答待ち", priority: "normal", href: `/orders/${o.id}/quote` });
      continue;
    }
    if (o.status === "read_completed" && o.exceptionType === null) {
      tasks.push({
        key: `order-${o.id}`,
        orderId: o.id,
        customerName,
        owner: "internal_user",
        title: "次のアクションを選択する（見積書作成・基幹入力・上長確認依頼）",
        priority: highValue ? "high" : "normal",
        href: `/orders/${o.id}/read`,
      });
      continue;
    }
    // auto_input_completed / completed はタスクなし
  }

  return tasks;
}
