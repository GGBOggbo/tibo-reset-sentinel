import type { DerivedStats } from "@/lib/types";

/** 竞品式大数字统计卡：累计 / 平均 / 最长 */
export default function StatCards({ stats }: { stats: DerivedStats }) {
  return (
    <section className="big-stats" aria-label="重置统计">
      <div className="cell primary">
        <p className="eyebrow" style={{ margin: 0 }}>累计重置公告</p>
        <div className="num">{stats.totalResets}<small>次公开记录</small></div>
      </div>
      <div className="cell">
        <p className="eyebrow" style={{ margin: 0 }}>平均间隔</p>
        <div className="num">{stats.avgIntervalDays.toFixed(1)}<small>天/次</small></div>
      </div>
      <div className="cell">
        <p className="eyebrow" style={{ margin: 0 }}>最长间隔</p>
        <div className="num">{stats.longestIntervalDays.toFixed(0)}<small>天</small></div>
      </div>
    </section>
  );
}
