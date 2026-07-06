import type { DemoOrder, Order } from "./types";

// 外部取り込み(Chatwork等)で得たOrderを、デモの「未読」状態に伏せて追加できる形へ変換する。
// cloneInitial と同じ流儀: 本来のステータスは resolvedStatus に退避し、status='new' で開始。
export function toDemoOrders(orders: Order[]): DemoOrder[] {
  return orders.map((o) => {
    const clone = JSON.parse(JSON.stringify(o)) as DemoOrder;
    clone.isRead = false;
    clone.resolvedStatus = o.status;
    clone.status = "new";
    return clone;
  });
}
