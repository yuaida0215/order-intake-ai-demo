import { DEMO_TODAY, ROUND_RULES, customerById, itemByPartNo, type H3, type Item, type Lot } from "./data";

export const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;
export const num = (n: number, digits = 0) =>
  n.toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

/** 総重量(kg) = 数量 × 単重(g) ÷ 1000（小数第2位）— 先方画面: 4,080 × 58.55g = 238.88kg */
export const totalKg = (qty: number, unitWeightG: number) => Math.round(qty * unitWeightG / 10) / 100;

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

/** 製造業の3H判定（初めて・久しぶり・変更）。久しぶり＝前回受注から60日以上 */
export function judgeH3(partNo: string, today = DEMO_TODAY): { h3?: H3; reason: string } {
  const item = itemByPartNo(partNo);
  if (!item || !item.lastOrder) return { h3: "初めて", reason: "品番マスタ・受注履歴に該当なし（新規品登録表が必要）" };
  if (item.revisedAt && item.revisedAt > item.lastOrder)
    return { h3: "変更", reason: `前回受注（${md(item.lastOrder)}）の後に処理条件を改訂: ${item.revisionNote}` };
  const d = daysBetween(item.lastOrder, today);
  if (d >= 60) return { h3: "久しぶり", reason: `前回受注は ${md(item.lastOrder)}（${d}日前）。2か月以上空いたので作業条件の再確認が必要` };
  return { reason: `前回受注 ${md(item.lastOrder)}（${d}日前）・条件変更なし` };
}

/** 売上重量(kg)：得意先ごとの丸め単位で四捨五入（先方画面: 238.88kg → 239kg） */
export function salesKg(lot: Pick<Lot, "partNo" | "qty" | "completedQty" | "customerId">, item?: Item): number {
  const it = item ?? itemByPartNo(lot.partNo);
  if (!it) return 0;
  const kg = totalKg(lot.completedQty ?? lot.qty, it.unitWeightG);
  return customerById(lot.customerId).weightRound === 1 ? Math.round(kg) : Math.round(kg * 10) / 10;
}

/** 売上金額 = 売上重量 × kg単価（円未満切り捨て）— 先方画面: 239kg × 35.81円 = 8,558円 */
export function lotAmount(lot: Pick<Lot, "partNo" | "qty" | "completedQty" | "customerId">, item?: Item): number {
  const it = item ?? itemByPartNo(lot.partNo);
  if (!it) return 0;
  if (it.priceUnit === "個") return Math.floor((lot.completedQty ?? lot.qty) * it.price);
  return Math.floor(salesKg(lot, it) * it.price + 1e-6);
}

/** ロット原価（材料費＝処理液、労務費＝作業時間、設備費＝ライン・炉、外注費） */
export function lotCost(lot: Pick<Lot, "partNo" | "qty" | "completedQty" | "customerId">) {
  const it = itemByPartNo(lot.partNo);
  if (!it) return { material: 0, labor: 0, equipment: 0, outsource: 0, total: 0, sales: 0, margin: 0, rate: 0 };
  const q = lot.completedQty ?? lot.qty;
  const kg = totalKg(q, it.unitWeightG);
  const coats = it.steps.length;
  const material = Math.round(kg * 1.8 * coats); // 処理液の使用量
  const labor = Math.round(kg * 2.9 * coats + 180); // 段取り・投入・検査の作業時間
  const equipment = Math.round(kg * 2.3 * coats + 120); // ライン・焼付炉の稼働
  const outsource = it.outsource ? Math.round(kg * 25) : 0;
  const total = material + labor + equipment + outsource;
  const sales = lotAmount(lot, it);
  return { material, labor, equipment, outsource, total, sales, margin: sales - total, rate: sales ? (sales - total) / sales : 0 };
}

/** 完成数量の丸め（11/19提案資料の想定3つ）。needsHuman=true なら人が確定 */
export function applyRule(lot: Pick<Lot, "customerId" | "qty">, read: number): { value: number; note: string; needsHuman: boolean; ruleLabel: string } {
  const c = customerById(lot.customerId);
  const ruleLabel = ROUND_RULES[c.rule];
  if (c.rule === "hundred") {
    const v = Math.floor(read / 100) * 100;
    return { value: v, note: `${num(read)} → ${num(v)}`, needsHuman: false, ruleLabel };
  }
  if (c.rule === "order_if_close") {
    const diff = (read - lot.qty) / lot.qty;
    const d = `${diff >= 0 ? "+" : "−"}${Math.abs(diff * 100).toFixed(2)}%`;
    if (Math.abs(diff) <= 0.005) return { value: lot.qty, note: `注文数との差 ${d}（±0.5%以内）→ 注文数 ${num(lot.qty)} で計上`, needsHuman: false, ruleLabel };
    return { value: read, note: `注文数との差 ${d}。決まりの幅（±0.5%）を超えているため、計上する数量は人が確定します`, needsHuman: true, ruleLabel };
  }
  return { value: read, note: `${num(read)} をそのまま計上`, needsHuman: false, ruleLabel };
}

/** 作業票などに印字するバーコードの縞（見た目用） */
export function barcodeBars(text: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    bars.push((c % 3) + 1, ((c >> 2) % 2) + 1, ((c >> 3) % 3) + 1, ((c >> 1) % 2) + 1);
  }
  return bars;
}
