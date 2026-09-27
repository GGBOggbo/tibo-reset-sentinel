import Countdown from "./Countdown";
import HealthBadge from "./HealthBadge";
import LiveProbability from "./LiveProbability";
import type { DerivedStats } from "@/lib/types";
import type { ProbabilityResult } from "@/lib/probability";
import { fmtBJ, fmtRelative } from "@/lib/format";
import type { HealthFile } from "@/lib/types";

export default function RadarStatus({
  stats, prob, intervalsDays, healthy, lastSuccessAt, lastFailureAt, lastError, sourceWarning, lastSource, sourceFetchedAt, now, totalIntervals,
}: {
  stats: DerivedStats;
  prob: ProbabilityResult;
  intervalsDays: number[];
  healthy: boolean;
  lastSuccessAt: string;
  lastFailureAt: string | null;
  lastError: string | null;
  sourceWarning?: string | null;
  lastSource?: HealthFile["lastSource"];
  sourceFetchedAt?: string;
  now: Date;
  totalIntervals: number;
}) {
  return (
    <section className="card radar-card" aria-labelledby="radar-title">
      <div className="radar-top">
        <HealthBadge initialHealthy={healthy} lastSuccessAt={lastSuccessAt} lastFailureAt={lastFailureAt} sourceWarning={sourceWarning} />
        <span className="muted">已等 <b className="mono-num">{stats.daysSinceLastReset.toFixed(1)}</b> 天</span>
      </div>
      {sourceWarning && <p className="muted" style={{ color: "var(--warn)", marginTop: 12 }}>暂时无法核对最新公告，当前记录可能不完整。页面会自动重试。</p>}
      {!healthy && lastFailureAt && (
        <p className="muted" style={{ margin: "12px 0 0", color: "var(--warn)" }}>
          最近失败于 {fmtBJ(lastFailureAt)} · {lastError || "等待下一轮自动恢复"}
        </p>
      )}

      <div className="hero-grid">
        <div className="hero-count">
          <div>
            <div className="hero-heading">
              <p className="eyebrow">LIVE RADAR / AUTO REFRESH</p>
              <h2 id="radar-title">距离本页自动刷新</h2>
              <p className="muted">本页每 5 分钟重新核对公开公告，重新回到本页也会刷新。</p>
            </div>
            <Countdown lastSuccessAt={lastSuccessAt} lastFailureAt={lastFailureAt} sourceWarning={sourceWarning} />
            <p className="muted" style={{ marginTop: 12 }}>最近来源读取：{lastSuccessAt ? `${fmtBJ(lastSuccessAt)}（北京时间）` : "暂无成功记录"} · 读取时间不代表公告完整</p>
            <p className="muted">当前来源：{lastSource === "tibo-public-api" ? "TIBO 公开 API · Codex Resets 数据" : lastSource === "resetrelay-rss" ? "Reset Relay RSS" : "Codex Resets"}{sourceFetchedAt ? ` · 来源抓取于 ${fmtBJ(sourceFetchedAt)}` : ""}</p>
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
