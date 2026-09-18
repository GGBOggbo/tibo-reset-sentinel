"use client";

import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ResetEvent } from "@/lib/types";
import { fmtBJ } from "@/lib/format";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const LEGEND_NAME: Record<string, string> = { reset: "额度重置", banked: "重置卡", capacity: "容量信号" };

export default function TimelineGrid({
  cells, monthLabels,
}: {
  cells: (ResetEvent | null)[][];
  monthLabels: { col: number; label: string }[];
}) {
  const [hover, setHover] = useState<{ event: ResetEvent; left: number; top: number } | null>(null);

  const showHover = (event: ResetEvent, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const tooltipHeight = 150;
    const below = rect.bottom + tooltipHeight + 12 < window.innerHeight;
    const left = Math.min(Math.max(rect.left + rect.width / 2, 140), window.innerWidth - 140);
    const top = below ? rect.bottom + 12 : Math.max(12, rect.top - tooltipHeight - 12);
    setHover({ event, left, top });
  };

  const onPointerEnter = (event: ResetEvent, e: ReactMouseEvent<HTMLAnchorElement>) => showHover(event, e.currentTarget);

  return (
    <>
      <div className="timeline-help">悬停亮点查看摘要，点击直接打开原帖</div>
      <div className="timeline-grid" aria-label="过去 26 周重置历史网格">
        <span />
        {Array.from({ length: 26 }, (_, w) => {
          const hit = monthLabels.find((x) => x.col === w);
          return <span key={w} className="month">{hit?.label ?? ""}</span>;
        })}
        {WEEKDAYS.map((wd, row) => (
          <div key={wd} style={{ display: "contents" }}>
            <span className="weekday">{wd}</span>
            {Array.from({ length: 26 }, (_, w) => {
              const event = cells[w][row];
              if (!event) return <span key={w} className="cell-dot" aria-hidden="true" />;
              const tooltip = `${fmtBJ(event.announcedAt)} GMT+8\n${LEGEND_NAME[event.type]} · ${event.title}\n${event.summary || "点击查看原帖"}`;
              return (
                <a
                  key={w}
                  className={`cell-dot timeline-cell has-event type-${event.type}`}
                  href={event.tweetUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${fmtBJ(event.announcedAt)}：${LEGEND_NAME[event.type]}，${event.title}，点击打开原帖`}
                  title={`${LEGEND_NAME[event.type]} · ${event.title}`}
                  data-tooltip={tooltip}
                  onMouseEnter={(e) => onPointerEnter(event, e)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={(e) => showHover(event, e.currentTarget)}
                  onBlur={() => setHover(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
      {hover && (
        <div className="timeline-hovercard" role="tooltip" style={{ left: hover.left, top: hover.top }}>
          <p className="timeline-hover-date">{fmtBJ(hover.event.announcedAt)} GMT+8</p>
          <strong>{LEGEND_NAME[hover.event.type]} · {hover.event.title}</strong>
          <p>{hover.event.summary || "点击打开原帖查看详情"}</p>
        </div>
      )}
    </>
  );
}
