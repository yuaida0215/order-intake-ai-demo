import { DEMO_TODAY, itemByPartNo, type H3, type Item, type Lot } from "./data";

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

/** 売上金額（完成数量ベース。kg単価は小数第1位で四捨五入した重量×単価） */
export function lotAmount(lot: Pick<Lot, "partNo" | "qty" | "completedQty">, item?: Item): number {
  const it = item ?? itemByPartNo(lot.partNo);
  if (!it) return 0;
  const q = lot.completedQty ?? lot.qty;
  if (it.priceUnit === "kg") return Math.round(Math.round(totalKg(q, it.unitWeightG) * 10) / 10 * it.price);
  return Math.round(q * it.price);
}

/** ロット原価（材料費＝処理液、加工費＝ラインのチャージ、外注費） */
export function lotCost(lot: Pick<Lot, "partNo" | "qty" | "completedQty">) {
  const it = itemByPartNo(lot.partNo);
  if (!it) return { material: 0, process: 0, outsource: 0, total: 0, sales: 0, margin: 0, rate: 0 };
  const q = lot.completedQty ?? lot.qty;
  const kg = totalKg(q, it.unitWeightG);
  const coats = it.steps.length;
  const material = Math.round(kg * 4.2 * coats); // 処理液の使用量（kgあたり・塗り回数分）
  const process = Math.round(kg * 19 * coats + 1200); // ライン時間のチャージ＋段取り
  const outsource = it.outsource ? Math.round(q * 15) : 0;
  const total = material + process + outsource;
  const sales = lotAmount(lot, it);
  return { material, process, outsource, total, sales, margin: sales - total, rate: sales ? (sales - total) / sales : 0 };
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
