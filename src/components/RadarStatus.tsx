import Countdown from "./Countdown";
import HealthBadge from "./HealthBadge";
import LiveProbability from "./LiveProbability";
import type { DerivedStats } from "@/lib/types";
import type { ProbabilityResult } from "@/lib/probability";
import { fmtBJ, fmtRelative } from "@/lib/format";

export default function RadarStatus({
  stats, prob, intervalsDays, healthy, lastSuccessAt, lastFailureAt, lastError, now, totalIntervals,
}: {
  stats: DerivedStats;
  prob: ProbabilityResult;
  intervalsDays: number[];
  healthy: boolean;
  lastSuccessAt: string;
  lastFailureAt: string | null;
  lastError: string | null;
  now: Date;
  totalIntervals: number;
}) {
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

        <LiveProbability intervalsDays={intervalsDays} lastResetAt={stats.lastResetAt} initial={prob}
          totalIntervals={totalIntervals} longestIntervalDays={stats.longestIntervalDays} />
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
