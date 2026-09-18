import type { ResetEvent } from "@/lib/types";
import TimelineGrid from "./TimelineGrid";

const COLOR: Record<string, string> = {
  reset: "var(--accent)",
  banked: "var(--warn)",
  capacity: "var(--info)",
};

const LEGEND_NAME: Record<string, string> = { reset: "额度重置", banked: "重置卡", capacity: "容量信号" };

const WEEKS = 26;
const DAY_MS = 86_400_000;
const BJ_OFFSET = 8 * 3_600_000;

/**
 * 26 列（周）× 7 行（周一→周日）热力网格。
 * 全部换算到"北京日"空间（时间戳 +8h 后按 UTC 取日），任何时区的访客看到同一张图。
 */
export default function ResetTimeline({ events }: { events: ResetEvent[] }) {
  const todayBJ = Math.floor((Date.now() + BJ_OFFSET) / DAY_MS) * DAY_MS; // 伪 UTC 午夜对齐
  const dow = new Date(todayBJ).getUTCDay();
  const mondayBJ = todayBJ - ((dow + 6) % 7) * DAY_MS; // 当前周的周一
  const startBJ = mondayBJ - (WEEKS - 1) * 7 * DAY_MS; // 首列周一

  const cells: (ResetEvent | null)[][] = Array.from({ length: WEEKS }, () => Array(7).fill(null));
  let latest: ResetEvent | null = null;
  for (const e of events) {
    if (COLOR[e.type] === undefined) continue;
    const tBJ = Date.parse(e.announcedAt) + BJ_OFFSET;
    const dayDiff = Math.floor((tBJ - startBJ) / DAY_MS);
    if (dayDiff < 0 || dayDiff >= WEEKS * 7) continue;
    const week = Math.floor(dayDiff / 7);
    const weekday = (new Date(tBJ).getUTCDay() + 6) % 7;
    cells[week][weekday] = e; // events 升序，后写覆盖 = 保留最新
    if (!latest || e.announcedAt > latest.announcedAt) latest = e;
  }

  // 月份标签：某列的周一进入新月份则标记
  const monthLabels: { col: number; label: string }[] = [];
  const seenMonths = new Set<number>();
  for (let w = 0; w < WEEKS; w++) {
    const m = new Date(startBJ + w * 7 * DAY_MS).getUTCMonth();
    if (!seenMonths.has(m)) {
      seenMonths.add(m);
      monthLabels.push({ col: w, label: `${m + 1}月` });
    }
  }

  const latestBJ = latest
    ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" })
        .format(new Date(latest.announcedAt))
    : null;

  return (
    <section className="card" id="history" aria-labelledby="history-title">
      <p className="eyebrow">RESET MAP / 26 WEEKS</p>
      <h2 id="history-title" className="section-heading">Codex 重置历史</h2>
      <div className="timeline-legend">
        {Object.entries(COLOR).map(([k, v]) => (
          <span key={k} style={{ color: v }}>
            <i aria-hidden="true" />
            {LEGEND_NAME[k]}
          </span>
        ))}
      </div>

      <TimelineGrid cells={cells} monthLabels={monthLabels} />

      {latest && latestBJ && (
        <div className="timeline-latest">
          <span className="dot pulse" style={{ background: COLOR[latest.type] }} aria-hidden="true" />
          <span>最近一次</span>
          <strong>{latestBJ}</strong>
          <span>· {LEGEND_NAME[latest.type]}</span>
        </div>
      )}
    </section>
  );
}
