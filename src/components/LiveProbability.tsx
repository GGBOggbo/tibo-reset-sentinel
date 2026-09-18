"use client";

import { useEffect, useState } from "react";
import { probability, type ProbabilityResult } from "@/lib/probability";

const DAY_MS = 86_400_000;
const SAMPLE_MIN = 5;

export default function LiveProbability({
  intervalsDays,
  lastResetAt,
  initial,
  totalIntervals,
  longestIntervalDays,
}: {
  intervalsDays: number[];
  lastResetAt: string | null;
  initial: ProbabilityResult;
  totalIntervals: number;
  longestIntervalDays: number;
}) {
  const [current, setCurrent] = useState(initial);

  useEffect(() => {
    if (!lastResetAt) return;
    const recalculate = () => {
      const last = Date.parse(lastResetAt);
      if (Number.isNaN(last)) return;
      setCurrent(probability(intervalsDays, (Date.now() - last) / DAY_MS));
    };
    recalculate();
    const timer = window.setInterval(recalculate, 60_000);
    return () => window.clearInterval(timer);
  }, [intervalsDays, lastResetAt]);

  const gaugeDeg = current.kind === "ok" ? Math.round((current.percent! / 100) * 360) : 0;
  const waitedLabel = current.waitedDays.toFixed(1);
  const probabilityCopy = current.kind === "ok"
    ? `${current.percent! < 30 ? "偏低" : current.percent! <= 60 ? "中性" : "偏高"}，样本 ${current.sampleSize} 组。`
    : current.kind === "beyond"
      ? `已超历史最长等待 ${longestIntervalDays.toFixed(0)} 天，进入罕见区间。`
      : `样本不足（${totalIntervals} 组间隔，需 ≥${SAMPLE_MIN}），暂不给百分比。`;

  return (
    <div className="probability-panel" aria-labelledby="probability-title">
      <p className="eyebrow">TREND MODEL / LAST 24H</p>
      <h2 id="probability-title">未来 24 小时重置可能性</h2>
      {current.kind === "ok" && (
        <div className="gauge-wrap">
          <div className="gauge" role="img" aria-label={`重置可能性 ${current.percent}%，${current.label}`}
            style={{ background: `conic-gradient(var(--accent) ${gaugeDeg}deg, rgba(202, 255, 61, 0.12) 0deg)` }}>
            <div className="gauge-val"><b>{current.percent}%</b><small>{current.label}</small></div>
          </div>
          <p className="probability-copy">{probabilityCopy}<br />等待 {waitedLabel} 天后 24h 内发生重置的历史比例。</p>
        </div>
      )}
      {current.kind === "insufficient" && <p className="probability-copy" style={{ marginTop: 18 }}>{probabilityCopy} 请结合下方历史记录判断。</p>}
      {current.kind === "beyond" && (
        <div className="gauge-wrap">
          <div className="gauge" role="img" aria-label="已超历史最长等待，高位"
            style={{ background: "conic-gradient(var(--warn) 340deg, rgba(255, 191, 87, 0.12) 0deg)" }}>
            <div className="gauge-val"><b style={{ fontSize: 24 }}>&gt;90%</b><small>高位</small></div>
          </div>
          <p className="probability-copy">{probabilityCopy}</p>
        </div>
      )}
    </div>
  );
}
