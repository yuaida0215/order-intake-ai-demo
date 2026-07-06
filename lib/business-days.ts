// ------------------------------------------------------------
// 営業日計算 (デモ内時計・上長リマインド用)
//   土日 + 2026年の日本の祝日をスキップして営業日を計算する。
// ------------------------------------------------------------

/** 2026年の祝日 (YYYY-MM-DD)。振替休日込みの概算値 */
export const JP_HOLIDAYS_2026: string[] = [
  "2026-01-01", // 元日
  "2026-01-12", // 成人の日
  "2026-02-11", // 建国記念の日
  "2026-02-23", // 天皇誕生日
  "2026-03-20", // 春分の日
  "2026-04-29", // 昭和の日
  "2026-05-03", // 憲法記念日
  "2026-05-04", // みどりの日
  "2026-05-05", // こどもの日
  "2026-05-06", // 振替休日
  "2026-07-20", // 海の日
  "2026-08-11", // 山の日
  "2026-09-21", // 敬老の日
  "2026-09-22", // 国民の休日
  "2026-09-23", // 秋分の日
  "2026-10-12", // スポーツの日
  "2026-11-03", // 文化の日
  "2026-11-23", // 勤労感謝の日
];

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isBusinessDay(iso: string): boolean {
  const d = parseIso(iso);
  const dow = d.getDay(); // 0=日, 6=土
  if (dow === 0 || dow === 6) return false;
  if (JP_HOLIDAYS_2026.includes(iso)) return false;
  return true;
}

/** iso から n 営業日後の日付を返す (n=0ならiso自身が営業日でなければ次の営業日) */
export function addBusinessDays(iso: string, n: number): string {
  let d = parseIso(iso);
  let remaining = n;
  while (remaining > 0) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (isBusinessDay(toIso(d))) remaining--;
  }
  return toIso(d);
}

/** from から to までの経過営業日数 (from自身は含めない) */
export function businessDaysBetween(from: string, to: string): number {
  if (from >= to) return 0;
  let d = parseIso(from);
  const end = parseIso(to);
  let count = 0;
  while (d.getTime() < end.getTime()) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (isBusinessDay(toIso(d))) count++;
  }
  return count;
}

export function formatIsoJp(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dow = "日月火水木金土"[parseIso(iso).getDay()];
  return `${Number(m)}/${Number(d)}(${dow})`;
}
