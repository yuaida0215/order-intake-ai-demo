// ------------------------------------------------------------
// ダッシュボード用の過去12ヶ月ダミー実績 (デモ用・決定的)
//   トレンド系グラフ / CAGR / 前月比 / 要因分析の元データ。
//   当月(2026/07)までの推移を表す想定値。
// ------------------------------------------------------------

export type MonthlyStat = {
  /** 表示用ラベル (例 "26/07") */
  label: string;
  /** 受注件数 */
  orders: number;
  /** 受注金額 (円) */
  amount: number;
  /** AI自動処理率 (%) */
  autoRate: number;
  /** AI削減時間 (分) */
  savedMinutes: number;
};

export const MONTHLY_HISTORY: MonthlyStat[] = [
  { label: "25/08", orders: 84, amount: 15_200_000, autoRate: 52, savedMinutes: 1010 },
  { label: "25/09", orders: 86, amount: 15_800_000, autoRate: 54, savedMinutes: 1060 },
  { label: "25/10", orders: 88, amount: 16_100_000, autoRate: 55, savedMinutes: 1120 },
  { label: "25/11", orders: 92, amount: 16_900_000, autoRate: 57, savedMinutes: 1210 },
  { label: "25/12", orders: 93, amount: 17_200_000, autoRate: 58, savedMinutes: 1260 },
  { label: "26/01", orders: 95, amount: 17_600_000, autoRate: 60, savedMinutes: 1330 },
  { label: "26/02", orders: 99, amount: 18_300_000, autoRate: 62, savedMinutes: 1440 },
  { label: "26/03", orders: 101, amount: 18_900_000, autoRate: 63, savedMinutes: 1520 },
  { label: "26/04", orders: 104, amount: 19_400_000, autoRate: 65, savedMinutes: 1620 },
  { label: "26/05", orders: 108, amount: 20_100_000, autoRate: 67, savedMinutes: 1740 },
  { label: "26/06", orders: 112, amount: 20_900_000, autoRate: 69, savedMinutes: 1870 },
  { label: "26/07", orders: 118, amount: 21_800_000, autoRate: 72, savedMinutes: 2010 },
];

/** 期首→期末のCAGR (年率)。months=期間の月数 */
export function cagr(first: number, last: number, months: number): number {
  if (first <= 0 || months <= 0) return 0;
  const years = months / 12;
  return Math.pow(last / first, 1 / years) - 1;
}

/** 前月比 (増減率) */
export function momRate(prev: number, cur: number): number {
  if (prev === 0) return 0;
  return (cur - prev) / prev;
}

export function pctSigned(r: number): string {
  const v = (r * 100).toFixed(1);
  return `${r >= 0 ? "+" : ""}${v}%`;
}
