import Countdown from "./Countdown";
import HealthBadge from "./HealthBadge";
import type { DerivedStats } from "@/lib/types";
import type { ProbabilityResult } from "@/lib/probability";
import { fmtRelative } from "@/lib/format";

const SAMPLE_MIN = 5; // probability.ts 的样本门槛，用于统计行展示口径

export default function RadarStatus({
  stats, prob, healthy, lastSuccessAt, now, totalIntervals,
}: {
  stats: DerivedStats;
  prob: ProbabilityResult;
  healthy: boolean;
  lastSuccessAt: string;
  now: Date;
  totalIntervals: number;
}) {
  const gaugeDeg = prob.kind === "ok" ? Math.round((prob.percent! / 100) * 360) : 0;
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <HealthBadge initialHealthy={healthy} lastSuccessAt={lastSuccessAt} />
        <span className="muted">已等 <b className="mono-num">{stats.daysSinceLastReset.toFixed(1)}</b> 天</span>
      </div>

      <p className="eyebrow" style={{ marginTop: 18 }}>距离下一次信号扫描</p>
      <div className="count-hero">
        <Countdown />
        <div className="radar-dial" aria-hidden="true">
          <span className="blip" style={{ top: "26%", left: "62%" }} />
          <span className="blip" style={{ top: "58%", left: "34%", opacity: 0.6 }} />
          <span className="blip" style={{ top: "70%", left: "66%", opacity: 0.35 }} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--card-border)", margin: "18px 0 16px" }} />

      <p className="eyebrow">未来 24 小时重置可能性</p>
      {prob.kind === "ok" && (
        <div className="gauge-wrap">
          <div className="gauge" role="img"
            aria-label={`重置可能性 ${prob.percent}%，${prob.label}`}
            style={{ background: `conic-gradient(var(--accent) ${gaugeDeg}deg, rgba(201, 242, 75, 0.12) 0deg)` }}>
            <div className="gauge-val">
              <b>{prob.percent}%</b>
              <small>{prob.label}</small>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)" }}>
            {prob.percent! < 30 ? "偏低" : prob.percent! <= 60 ? "中性" : "偏高"}，
            样本 {prob.sampleSize} 组（等待 {Math.floor(prob.waitedDays)} 天后 24h 内发生重置的历史比例）。
          </p>
        </div>
      )}
      {prob.kind === "insufficient" && (
        <p style={{ margin: 0, fontSize: 15 }}>
          样本不足（{totalIntervals} 组间隔，需 ≥{SAMPLE_MIN}），暂不给百分比，请看下方间隔分布与历史。
        </p>
      )}
      {prob.kind === "beyond" && (
        <div className="gauge-wrap">
          <div className="gauge" role="img" aria-label="已超历史最长等待"
            style={{ background: "conic-gradient(var(--warn) 340deg, rgba(255, 184, 77, 0.12) 0deg)" }}>
            <div className="gauge-val"><b style={{ fontSize: 22 }}>&gt;90%</b><small>高位</small></div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)" }}>
            已超历史最长等待（{stats.longestIntervalDays.toFixed(0)} 天），进入罕见区间。
          </p>
        </div>
      )}
      <p className="muted" style={{ marginTop: 10 }}>
        基于已核验的公开重置记录，这是趋势参考，不是 OpenAI 承诺。
      </p>

      <div className="stat-row">
        <div className="cell"><span className="label">距上次确认</span>
          <span className="value mono-num">{Math.floor(stats.daysSinceLastReset)} 天</span></div>
        <div className="cell"><span className="label">历史样本</span>
          <span className="value mono-num">{totalIntervals} 组</span></div>
        <div className="cell"><span className="label">累计记录</span>
          <span className="value mono-num">{stats.totalResets} 次</span></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <a className="btn primary" href="#subscribe">🔍 免费进群接收提醒</a>
        <a className="btn" href="#history">📍 查看历史</a>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        无需登录 · 不读取你的账户 · 上次确认 {fmtRelative(stats.lastResetAt ?? new Date().toISOString(), now)}
      </p>
    </section>
  );
}
