import Countdown from "./Countdown";
import HealthBadge from "./HealthBadge";
import type { DerivedStats } from "@/lib/types";
import type { ProbabilityResult } from "@/lib/probability";
import { fmtBJ, fmtRelative } from "@/lib/format";

const SAMPLE_MIN = 5;

export default function RadarStatus({
  stats, prob, healthy, lastSuccessAt, lastFailureAt, lastError, now, totalIntervals,
}: {
  stats: DerivedStats;
  prob: ProbabilityResult;
  healthy: boolean;
  lastSuccessAt: string;
  lastFailureAt: string | null;
  lastError: string | null;
  now: Date;
  totalIntervals: number;
}) {
  const gaugeDeg = prob.kind === "ok" ? Math.round((prob.percent! / 100) * 360) : 0;
  const probabilityCopy = prob.kind === "ok"
    ? `${prob.percent! < 30 ? "偏低" : prob.percent! <= 60 ? "中性" : "偏高"}，样本 ${prob.sampleSize} 组。`
    : prob.kind === "beyond"
      ? `已超历史最长等待 ${stats.longestIntervalDays.toFixed(0)} 天，进入罕见区间。`
      : `样本不足（${totalIntervals} 组间隔，需 ≥${SAMPLE_MIN}），暂不给百分比。`;

  return (
    <section className="card radar-card" aria-labelledby="radar-title">
      <div className="radar-top">
        <HealthBadge initialHealthy={healthy} lastSuccessAt={lastSuccessAt} />
        <span className="muted">已等 <b className="mono-num">{stats.daysSinceLastReset.toFixed(1)}</b> 天</span>
      </div>
      {!healthy && lastFailureAt && (
        <p className="muted" style={{ margin: "12px 0 0", color: "var(--warn)" }}>
          最近失败于 {fmtBJ(lastFailureAt)} · {lastError || "等待下一轮自动恢复"}
        </p>
      )}

      <div className="hero-grid">
        <div className="hero-count">
          <div>
            <div className="hero-heading">
              <p className="eyebrow">LIVE RADAR / NEXT SCAN</p>
              <h2 id="radar-title">距离下一次信号扫描</h2>
              <p className="muted">固定每 30 分钟扫描一次，状态实时显示在这里。</p>
            </div>
            <Countdown />
          </div>
          <div className="radar-dial" aria-hidden="true">
            <span className="blip" style={{ top: "26%", left: "62%" }} />
            <span className="blip" style={{ top: "58%", left: "34%", opacity: 0.6 }} />
            <span className="blip" style={{ top: "70%", left: "66%", opacity: 0.35 }} />
          </div>
        </div>

        <div className="probability-panel" aria-labelledby="probability-title">
          <p className="eyebrow">TREND MODEL / LAST 24H</p>
          <h2 id="probability-title">未来 24 小时重置可能性</h2>
          {prob.kind === "ok" && (
            <div className="gauge-wrap">
              <div className="gauge" role="img" aria-label={`重置可能性 ${prob.percent}%，${prob.label}`}
                style={{ background: `conic-gradient(var(--accent) ${gaugeDeg}deg, rgba(202, 255, 61, 0.12) 0deg)` }}>
                <div className="gauge-val"><b>{prob.percent}%</b><small>{prob.label}</small></div>
              </div>
              <p className="probability-copy">{probabilityCopy}<br />等待 {Math.floor(prob.waitedDays)} 天后 24h 内发生重置的历史比例。</p>
            </div>
          )}
          {prob.kind === "insufficient" && <p className="probability-copy" style={{ marginTop: 18 }}>{probabilityCopy} 请结合下方历史记录判断。</p>}
          {prob.kind === "beyond" && (
            <div className="gauge-wrap">
              <div className="gauge" role="img" aria-label="已超历史最长等待，高位"
                style={{ background: "conic-gradient(var(--warn) 340deg, rgba(255, 191, 87, 0.12) 0deg)" }}>
                <div className="gauge-val"><b style={{ fontSize: 24 }}>&gt;90%</b><small>高位</small></div>
              </div>
              <p className="probability-copy">{probabilityCopy}</p>
            </div>
          )}
        </div>
      </div>

      <div className="hero-divider" />
      <p className="muted">基于已核验的公开重置记录，这是趋势参考，不是 OpenAI 承诺。</p>

      <div className="stat-row" aria-label="实时统计">
        <div className="cell"><span className="label">距上次确认</span><span className="value mono-num">{Math.floor(stats.daysSinceLastReset)} 天</span></div>
        <div className="cell"><span className="label">历史样本</span><span className="value mono-num">{totalIntervals} 组</span></div>
        <div className="cell"><span className="label">累计记录</span><span className="value mono-num">{stats.totalResets} 次</span></div>
      </div>

      <div className="hero-actions">
        <a className="btn" href="#history">📍 查看历史</a>
      </div>
      <p className="muted" style={{ margin: "12px 0 0" }}>无需登录 · 不读取你的账户 · 上次确认 {fmtRelative(stats.lastResetAt ?? new Date().toISOString(), now)}</p>
    </section>
  );
}
