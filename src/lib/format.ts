// サーバーとクライアントで同じ文字列になるよう、時間帯を固定しておく
const stamp = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function formatStamp(iso: string): string {
  return stamp.format(new Date(iso));
}
