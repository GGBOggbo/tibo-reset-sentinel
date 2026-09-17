import type { ResetEvent, DerivedStats } from "@/lib/types";

const COLOR: Record<string, string> = {
  reset: "var(--accent)",
  banked: "var(--warn)",
  capacity: "#5b8def",
};

const LEGEND_NAME: Record<string, string> = { reset: "额度重置", banked: "重置卡", capacity: "容量信号" };

/** 26 周 × 7 天网格；只统计 reset/banked/capacity */
export default function ResetTimeline({ events, stats }: { events: ResetEvent[]; stats: DerivedStats }) {
  const now = Date.now();
  const start = now - 26 * 7 * 86_400_000;
  const cells: (ResetEvent | null)[] = new Array(26 * 7).fill(null);
  for (const e of events) {
    const t = Date.parse(e.announcedAt);
    if (t < start || COLOR[e.type] === undefined) continue;
    cells[Math.floor((t - start) / 86_400_000)] = e; // 同日多条保留最后一条
  }
  return (
    <section className="card" id="history">
      <p className="eyebrow">RESET MAP / 26 WEEKS</p>
      <b>Codex 重置历史</b>
      <div style={{ display: "flex", gap: 12, margin: "10px 0", flexWrap: "wrap", fontSize: 12 }}>
        {Object.entries(COLOR).map(([k, v]) => (
          <span key={k} className="muted">
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: v, marginRight: 4 }} />
            {LEGEND_NAME[k]}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(26, 1fr)", gap: 3 }}>
        {cells.map((e, i) => (
          <div key={i} title={e ? `${e.title}` : ""}
            style={{ aspectRatio: "1", borderRadius: 2,
              background: e ? COLOR[e.type] : "var(--card-border)" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 13 }} className="mono-num">
        <span><b>{stats.totalResets}</b> <span className="muted">次公开记录</span></span>
        <span><b>{stats.avgIntervalDays.toFixed(1)}</b> <span className="muted">天/次平均</span></span>
        <span><b>{stats.longestIntervalDays.toFixed(0)}</b> <span className="muted">天最长</span></span>
      </div>
    </section>
  );
}
