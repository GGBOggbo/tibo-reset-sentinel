"use client";
import { useMemo, useState } from "react";
import type { ResetEvent } from "@/lib/types";
import { fmtBJ, fmtRelative } from "@/lib/format";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "reset", label: "确认重置" },
  { key: "banked", label: "重置卡" },
  { key: "capacity", label: "容量信号" },
] as const;

const TYPE_NAME: Record<string, string> = { reset: "重置", banked: "重置卡", capacity: "容量", normal: "动态" };

function typeClass(type: ResetEvent["type"]): string {
  return type === "reset" ? "badge" : type === "banked" ? "badge warn" : "badge";
}

export default function FeedList({ events, nowIso }: { events: ResetEvent[]; nowIso: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const now = new Date(nowIso);
  const filtered = useMemo(() => [...events]
    .filter((e) => filter === "all" || e.type === filter)
    .sort((a, b) => b.announcedAt.localeCompare(a.announcedAt)), [events, filter]);
  const list = filtered.slice(0, visibleCount);
  const verifiedCount = events.filter((e) => e.verified).length;

  const chooseFilter = (next: typeof filter) => {
    setFilter(next);
    setVisibleCount(6);
  };

  return (
    <section className="card feed-card reveal reveal-6" id="feed" aria-labelledby="feed-title">
      <div className="feed-header">
        <div className="feed-profile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thsottiaux-avatar.jpg" alt="Tibo 头像" width={46} height={46} />
          <div>
            <p className="eyebrow">TIBO / ALL RECENT POSTS</p>
            <h2 id="feed-title" className="section-heading">Tibo 最近动态</h2>
            <p className="muted">Thibault “Tibo” Sottiaux · OpenAI Codex 负责人</p>
          </div>
        </div>
        <p className="feed-meta">已核验 {verifiedCount} 条<br />更新于 {fmtBJ(nowIso)}</p>
      </div>

      <div className="filter-row" role="group" aria-label="动态分类筛选">
        {FILTERS.map((f) => (
          <button key={f.key} className="btn" onClick={() => chooseFilter(f.key)} aria-pressed={filter === f.key}>
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="muted">该分类暂无记录。</p>}
      <ol className="feed-list">
        {list.map((e, i) => (
          <li key={e.id} className="feed-item" style={{ animationDelay: `${i * 45}ms` }}>
            <span className="feed-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="feed-item-top">
                <span className={typeClass(e.type)}>{TYPE_NAME[e.type]}</span>
                <span className="feed-time">{fmtRelative(e.announcedAt, now)} · {fmtBJ(e.announcedAt)}</span>
              </div>
              <p className="feed-title">{e.title}</p>
              <p className="feed-summary">{e.summary}</p>
              <a className="feed-link" href={e.tweetUrl} target="_blank" rel="noreferrer">查看原帖 ↗</a>
            </div>
          </li>
        ))}
      </ol>
      {filtered.length > visibleCount && (
        <div className="feed-more">
          <button className="btn" aria-expanded="true" onClick={() => setVisibleCount((count) => count + 6)}>显示更多（还剩 {filtered.length - visibleCount} 条）</button>
        </div>
      )}
    </section>
  );
}
