"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BILLING_GROUPS,
  CUSTOMERS,
  DEMO_TODAY,
  INITIAL_DEPOSITS,
  INITIAL_INVOICES,
  INTAKE_DOCS,
  MONTH_BASE,
  customerById,
  factoryById,
  initialLots,
  itemByPartNo,
  type BillingGroupId,
  type CustomerId,
  type FactoryId,
  type Invoice,
  type Lot,
  type LotStatus,
} from "./data";
import { judgeH3, lotAmount } from "./calc";

// ------------------------------------------------------------
// 役割と拠点（拠点ごとの権限）
// ------------------------------------------------------------
export type RoleId = "admin" | "jimu" | "seizo" | "somu";
export const ROLES: { id: RoleId; label: string; desc: string; factory: FactoryId | "ALL"; menus: string[] }[] = [
  { id: "admin", label: "管理者（全拠点）", desc: "すべてのメニュー・全拠点", factory: "ALL", menus: ["*"] },
  {
    id: "jimu", label: "製造事務（蟹江工場）", desc: "受注入力・完成数量の入力", factory: "F03",
    menus: ["/mc", "/mc/intake", "/mc/orders", "/mc/completion", "/mc/shipping", "/mc/matching", "/mc/masters", "/mc/rfi"],
  },
  {
    id: "seizo", label: "製造部（蟹江工場）", desc: "処理・照合", factory: "F03",
    menus: ["/mc", "/mc/orders", "/mc/completion", "/mc/matching", "/mc/outsourcing", "/mc/masters", "/mc/rfi"],
  },
  {
    id: "somu", label: "総務（全拠点）", desc: "マスタ登録・照合・請求・入金", factory: "ALL",
    menus: ["/mc", "/mc/orders", "/mc/matching", "/mc/billing", "/mc/payments", "/mc/accounting", "/mc/intercompany", "/mc/masters", "/mc/materials", "/mc/goods", "/mc/rfi", "/mc/settings"],
  },
];

export type NewItemRequest = { partNo: string; name: string; customerId: CustomerId; factoryId: FactoryId; at: string; step: number };
export type FaChange = { id: string; partNo: string; change: string; status: "未配信" | "配信済み"; at: string };

const NEXT: Record<LotStatus, LotStatus | null> = {
  ticketed: "processing",
  processing: "completed",
  completed: "delivered",
  delivered: "sold",
  sold: "billed",
  billed: "paid",
  paid: null,
};

const nowLabel = () => {
  const d = new Date();
  return `12/01 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

type State = {
  role: RoleId;
  scope: FactoryId | "ALL";
  lots: Lot[];
  docsDone: Record<string, { imported: string[]; rejected: string[] }>;
  invoices: Invoice[];
  closedGroups: BillingGroupId[];
  deposits: Record<string, "matched" | "fee" | "acceptance">;
  newItems: NewItemRequest[];
  fa: FaChange[];
  seq: number;
  lastCreatedTicket?: string;
};

type Actions = {
  setRole: (r: RoleId) => void;
  setScope: (s: FactoryId | "ALL") => void;
  importDoc: (docId: string) => { imported: Lot[]; rejected: string[] };
  createLot: (p: { customerId: CustomerId; partNo: string; boxes: number; qty: number; lotNo: string; dueDate: string }) => Lot;
  advance: (ids: string[], by?: string) => void;
  completeLot: (id: string, completedQty: number) => void;
  deliver: (ids: string[]) => string;
  matchLots: (ids: string[]) => void;
  closeGroup: (g: BillingGroupId) => Invoice[];
  applyDeposit: (depositId: string) => void;
  advanceNewItem: (partNo: string) => void;
  sendFa: (id: string) => void;
  reset: () => void;
};

function initial(): State {
  return {
    role: "admin",
    scope: "ALL",
    lots: initialLots(),
    docsDone: {},
    invoices: INITIAL_INVOICES.map((i) => ({ ...i })),
    closedGroups: [],
    deposits: {},
    newItems: [],
    fa: [{ id: "FA-0001", partNo: "90119-12C07", change: "上塗りの焼時間 25分→30分（DS-5号機 パターンP-08）", status: "未配信", at: "11/27 15:20" }],
    seq: 100,
  };
}

const EVENT_LABEL: Record<LotStatus, string> = {
  ticketed: "受入実行・作業票発行",
  processing: "製造部で処理開始",
  completed: "完成入力（現品票・完了票を発行）",
  delivered: "納品書発行・出荷",
  sold: "照合OK → 売上計上",
  billed: "請求書発行",
  paid: "入金消込",
};

export const useMc = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),

      setRole: (r) => {
        const role = ROLES.find((x) => x.id === r)!;
        set({ role: r, scope: role.factory });
      },
      setScope: (s) => set({ scope: s }),

      importDoc: (docId) => {
        const doc = INTAKE_DOCS.find((d) => d.id === docId)!;
        const imported: Lot[] = [];
        const rejected: string[] = [];
        let seq = get().seq;
        const f = factoryById(doc.factoryId);
        for (const r of doc.rows) {
          const item = itemByPartNo(r.partNo);
          if (!item) {
            rejected.push(r.partNo);
            continue;
          }
          seq += 1;
          const { h3 } = judgeH3(r.partNo);
          imported.push({
            id: `${f.code}-2612-${String(seq).padStart(4, "0")}`,
            ticketNo: `${f.code}261201-${String(seq).padStart(3, "0")}`,
            factoryId: doc.factoryId,
            customerId: doc.customerId,
            partNo: r.partNo,
            lotNo: r.lotNo,
            boxes: r.boxes,
            qty: r.qty,
            receivedAt: DEMO_TODAY,
            dueDate: r.due,
            source: doc.channel === "EDI" ? "EDI" : doc.channel === "FAX" ? "AI読取（FAX）" : "AI読取（紙）",
            docId,
            h3,
            status: "ticketed",
            events: [{ at: nowLabel(), label: `AI読み取り（${doc.kind}・${doc.channel}）→受入実行・作業票発行`, by: "製造事務" }],
          });
        }
        const newItems = [...get().newItems];
        for (const p of rejected) {
          const row = doc.rows.find((r) => r.partNo === p)!;
          if (!newItems.some((n) => n.partNo === p))
            newItems.push({ partNo: p, name: row.name, customerId: doc.customerId, factoryId: doc.factoryId, at: nowLabel(), step: 0 });
        }
        set({
          lots: [...imported, ...get().lots],
          seq,
          newItems,
          docsDone: { ...get().docsDone, [docId]: { imported: imported.map((l) => l.id), rejected } },
        });
        return { imported, rejected };
      },

      createLot: (p) => {
        const item = itemByPartNo(p.partNo)!;
        const seq = get().seq + 1;
        const f = factoryById(item.factoryId);
        const { h3 } = judgeH3(p.partNo);
        const lot: Lot = {
          id: `${f.code}-2612-${String(seq).padStart(4, "0")}`,
          ticketNo: `${f.code}261201-${String(seq).padStart(3, "0")}`,
          factoryId: item.factoryId,
          customerId: p.customerId,
          partNo: p.partNo,
          lotNo: p.lotNo,
          boxes: p.boxes,
          qty: p.qty,
          receivedAt: DEMO_TODAY,
          dueDate: p.dueDate,
          source: "手入力",
          h3,
          status: "ticketed",
          events: [{ at: nowLabel(), label: "受注入力（4項目）→作業票発行", by: "製造事務" }],
        };
        set({ lots: [lot, ...get().lots], seq, lastCreatedTicket: lot.ticketNo });
        return lot;
      },

      advance: (ids, by = "デモ操作") =>
        set({
          lots: get().lots.map((l) => {
            if (!ids.includes(l.id)) return l;
            const next = NEXT[l.status];
            if (!next) return l;
            const patch: Partial<Lot> = { status: next };
            if (next === "completed" && l.completedQty == null) {
              patch.completedQty = l.qty;
              patch.defectQty = 0;
            }
            if (next === "delivered" && !l.deliveryNo) patch.deliveryNo = `DN-${l.id.slice(-4)}`;
            return { ...l, ...patch, events: [...l.events, { at: nowLabel(), label: EVENT_LABEL[next], by }] };
          }),
        }),

      completeLot: (id, completedQty) =>
        set({
          lots: get().lots.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: "completed",
                  completedQty,
                  defectQty: Math.max(0, l.qty - completedQty),
                  events: [
                    ...l.events,
                    ...(l.status === "ticketed" ? [{ at: nowLabel(), label: EVENT_LABEL.processing, by: "製造部" }] : []),
                    { at: nowLabel(), label: `完成入力 ${completedQty.toLocaleString()}個（現品票・完了票を発行）`, by: "製造事務" },
                  ],
                }
              : l,
          ),
        }),

      deliver: (ids) => {
        const no = `DN-1201-${String(get().seq + 1).padStart(3, "0")}`;
        set({
          seq: get().seq + 1,
          lots: get().lots.map((l) =>
            ids.includes(l.id) && l.status === "completed"
              ? { ...l, status: "delivered", deliveryNo: no, events: [...l.events, { at: nowLabel(), label: `納品書 ${no} 発行・出荷`, by: "工場" }] }
              : l,
          ),
        });
        return no;
      },

      matchLots: (ids) =>
        set({
          lots: get().lots.map((l) =>
            ids.includes(l.id) && l.status === "delivered"
              ? { ...l, status: "sold", events: [...l.events, { at: nowLabel(), label: "照合OK（注文書×完了票・納品書控×完了票）→売上計上", by: "総務" }] }
              : l,
          ),
        }),

      closeGroup: (g) => {
        const customers = CUSTOMERS.filter((c) => c.group === g);
        const group = BILLING_GROUPS.find((x) => x.id === g)!;
        const made: Invoice[] = [];
        let seq = get().seq;
        const lots = [...get().lots];
        for (const c of customers) {
          const live = lots.filter((l) => l.customerId === c.id && l.status === "sold");
          const liveAmount = live.reduce((s, l) => s + lotAmount(l), 0);
          const base = MONTH_BASE[c.id];
          seq += 1;
          const inv: Invoice = {
            id: `INV-2611-${String(seq).padStart(4, "0")}`,
            customerId: c.id,
            group: g,
            period: g === "G1" ? "11月度（11/1〜11/30）" : `11月度（${group.cutoff}締め）`,
            issuedAt: DEMO_TODAY,
            dueAt: g === "G1" ? "2026-12-31" : "2027-01-20",
            lots: base.lots + live.length,
            amount: base.amount + liveAmount,
            tax: Math.round((base.amount + liveAmount) * 0.1),
            status: "issued",
          };
          made.push(inv);
          for (const l of live) {
            const i = lots.findIndex((x) => x.id === l.id);
            lots[i] = { ...l, status: "billed", invoiceId: inv.id, events: [...l.events, { at: nowLabel(), label: `請求書 ${inv.id} に計上（${group.name}）`, by: "総務" }] };
          }
        }
        set({ lots, seq, invoices: [...made, ...get().invoices], closedGroups: [...get().closedGroups, g] });
        return made;
      },

      applyDeposit: (depositId) => {
        const dep = INITIAL_DEPOSITS.find((d) => d.id === depositId)!;
        const kind = dep.suggestion.kind === "exact" ? "matched" : dep.suggestion.kind;
        set({
          deposits: { ...get().deposits, [depositId]: kind },
          invoices: get().invoices.map((i) =>
            i.id === dep.suggestion.invoiceId
              ? {
                  ...i,
                  status: "paid",
                  paidAmount: dep.amount,
                  diffNote: kind === "fee" ? "振込手数料 660円を支払手数料で処理" : kind === "acceptance" ? "検収差額 22,000円を売上値引で処理（差額調整書を送付）" : undefined,
                }
              : i,
          ),
          lots: get().lots.map((l) =>
            l.invoiceId === dep.suggestion.invoiceId ? { ...l, status: "paid", events: [...l.events, { at: nowLabel(), label: "入金消込", by: "総務" }] } : l,
          ),
        });
      },

      advanceNewItem: (partNo) =>
        set({ newItems: get().newItems.map((n) => (n.partNo === partNo ? { ...n, step: Math.min(n.step + 1, 4) } : n)) }),

      sendFa: (id) => set({ fa: get().fa.map((f) => (f.id === id ? { ...f, status: "配信済み" } : f)) }),

      reset: () => set(initial()),
    }),
    { name: "mc-demo-v1", version: 1 },
  ),
);

/** 役割で見られるメニューか */
export function canSee(role: RoleId, href: string): boolean {
  const r = ROLES.find((x) => x.id === role)!;
  return r.menus.includes("*") || r.menus.includes(href);
}

/** 拠点の絞り込み */
export function inScope<T extends { factoryId: FactoryId }>(rows: T[], scope: FactoryId | "ALL"): T[] {
  return scope === "ALL" ? rows : rows.filter((r) => r.factoryId === scope);
}

export const customerName = (id: CustomerId) => customerById(id).short;
