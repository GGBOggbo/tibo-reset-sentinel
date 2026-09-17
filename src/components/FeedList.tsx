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
      <p className="eyebrow">TIBO / ALL RECENT POSTS</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thsottiaux-avatar.jpg" alt="Tibo 头像" width={44} height={44}
          style={{ borderRadius: "50%", border: "1px solid var(--card-border)" }} />
        <div>
          <b style={{ fontSize: 15 }}>Tibo 最近动态</b>
          <p className="muted" style={{ margin: 0 }}>Thibault "Tibo" Sottiaux · OpenAI Codex 负责人</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
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
          <li key={e.id} style={{ borderTop: i ? "1px solid var(--card-border)" : "none", padding: "14px 0", display: "flex", gap: 12 }}>
            <span className="mono-num muted" style={{ fontSize: 12, paddingTop: 2 }} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span className="badge" style={{
                  borderColor: e.type === "reset" ? "var(--accent-dim)" : e.type === "banked" ? "var(--warn)" : "var(--card-border)",
                  color: e.type === "reset" ? "var(--accent)" : e.type === "banked" ? "var(--warn)" : "var(--text-dim)",
                }}>{TYPE_NAME[e.type]}</span>
                <span className="muted mono-num" style={{ whiteSpace: "nowrap" }}>{fmtRelative(e.announcedAt, now)} · {fmtBJ(e.announcedAt)}</span>
              </div>
              <p style={{ margin: "6px 0 2px", fontWeight: 600 }}>{e.title}</p>
              <p className="muted" style={{ margin: 0 }}>{e.summary}</p>
              <a href={e.tweetUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>查看原帖 ↗</a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
