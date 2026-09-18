import type { ResetEvent } from "@/lib/types";
import { fmtBJ, fmtRelative } from "@/lib/format";

const TYPE_NAME: Record<string, string> = { reset: "额度重置", banked: "重置卡", capacity: "容量信号", normal: "普通动态" };

export default function LastResetCard({ event, now }: { event: ResetEvent; now: Date }) {
  return (
    <section className="card last-reset-card" aria-labelledby="last-reset-title">
      <p className="eyebrow">LATEST VERIFIED SIGNAL</p>
      <div className="last-reset-meta">
        <h2 id="last-reset-title">最近一次 Codex 重置</h2>
        <span className="muted">{fmtRelative(event.announcedAt, now)}</span>
      </div>
      <p style={{ margin: "13px 0 4px", fontWeight: 650 }}>{TYPE_NAME[event.type]} · {event.title}</p>
      <p className="muted mono-num" style={{ margin: 0 }}>
        {fmtBJ(event.announcedAt)} GMT+8
      </p>
      <a className="btn" style={{ marginTop: 16 }} href={event.tweetUrl} target="_blank" rel="noreferrer">查看原帖 ↗</a>
    </section>
  );
}
