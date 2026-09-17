import type { ResetEvent } from "@/lib/types";
import { fmtBJ, fmtRelative } from "@/lib/format";

const TYPE_NAME: Record<string, string> = { reset: "额度重置", banked: "重置卡", capacity: "容量信号", normal: "普通动态" };

export default function LastResetCard({ event, now }: { event: ResetEvent; now: Date }) {
  return (
    <section className="card">
      <p className="eyebrow">最近一次 Codex 重置</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <b>{TYPE_NAME[event.type]} · {event.title}</b>
        <span className="muted">{fmtRelative(event.announcedAt, now)}</span>
      </div>
      <p className="muted mono-num" style={{ margin: "4px 0 12px" }}>
        {fmtBJ(event.announcedAt)} GMT+8
      </p>
      <a className="btn" href={event.tweetUrl} target="_blank" rel="noreferrer">查看原帖</a>
    </section>
  );
}
