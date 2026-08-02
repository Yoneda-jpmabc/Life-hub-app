/**
 * 日付は「その日」を指す文字列 (YYYY-MM-DD) として扱う。
 * Date に変換すると時差で前後の日にずれるので、文字列のまま比較する。
 */
export type DayKey = string;

export function toDayKey(date: Date): DayKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/**
 * その月の1日から末日までを、週の頭(日曜)で揃えた升目にする。
 * 週数はその月に必要な分だけ(5または6)。常に6週にすると、
 * 中身が他月だけの行ができて画面の高さを無駄に使う。
 */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);
  const start = new Date(year, month, 1 - first.getDay());

  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function formatMonth(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

/** 8月2日(日) のような表示。カレンダー外で日付を添えるときに使う。 */
export function formatDay(key: DayKey): string {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}(${weekday})`;
}

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
