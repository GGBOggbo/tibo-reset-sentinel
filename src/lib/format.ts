const bjFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", month: "numeric", day: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

/** ISO → "9/12 16:09"（北京时间） */
export function fmtBJ(iso: string): string {
  return bjFmt.format(new Date(iso));
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 */
export function fmtRelative(iso: string, now: Date = new Date()): string {
  const s = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}
