"use client";
import { useState } from "react";
import type { ResetEvent } from "@/lib/types";
import { fmtBJ, fmtRelative } from "@/lib/format";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "reset", label: "确认重置" },
  { key: "banked", label: "重置卡" },
  { key: "capacity", label: "容量信号" },
] as const;

const TYPE_NAME: Record<string, string> = { reset: "重置", banked: "重置卡", capacity: "容量", normal: "动态" };

export default function FeedList({ events, nowIso }: { events: ResetEvent[]; nowIso: string }) {
  const [filter, setFilter] = useState<string>("all");
  const now = new Date(nowIso);
  const list = [...events]
    .filter((e) => (filter === "all" ? e.type !== "normal" : e.type === filter))
    .sort((a, b) => b.announcedAt.localeCompare(a.announcedAt))
    .slice(0, 20);
  return (
    <section className="card">
      <p className="eyebrow">TIBO / RECENT SIGNALS</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button key={f.key} className="btn" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
            style={filter === f.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="muted">该分类暂无记录。</p>}
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {list.map((e, i) => (
          <li key={e.id} style={{ borderTop: i ? "1px solid var(--card-border)" : "none", padding: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <span className="badge" style={{
                borderColor: e.type === "reset" ? "var(--accent-dim)" : e.type === "banked" ? "var(--warn)" : "var(--card-border)",
                color: e.type === "reset" ? "var(--accent)" : e.type === "banked" ? "var(--warn)" : "var(--text-dim)",
              }}>{TYPE_NAME[e.type]}</span>
              <span className="muted mono-num">{fmtRelative(e.announcedAt, now)} · {fmtBJ(e.announcedAt)}</span>
            </div>
            <p style={{ margin: "6px 0 2px", fontWeight: 600 }}>{e.title}</p>
            <p className="muted" style={{ margin: 0 }}>{e.summary}</p>
            <a href={e.tweetUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>查看原帖 ↗</a>
          </li>
        ))}
      </ol>
    </section>
  );
}
