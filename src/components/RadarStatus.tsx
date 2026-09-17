import Countdown from "./Countdown";
import type { DerivedStats } from "@/lib/types";
import type { ProbabilityResult } from "@/lib/probability";
import { fmtRelative } from "@/lib/format";

export default function RadarStatus({
  stats, prob, healthy, now,
}: {
  stats: DerivedStats;
  prob: ProbabilityResult;
  healthy: boolean;
  now: Date;
}) {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="badge">
          <span className="dot pulse" />{healthy ? "雷达在线" : "雷达降级 · 人工核验中"}
        </span>
        <span className="muted">已等 <b className="mono-num">{stats.daysSinceLastReset.toFixed(1)}</b> 天</span>
      </div>
      <p className="eyebrow" style={{ marginTop: 16 }}>未来 24 小时重置可能性</p>
      {prob.kind === "ok" && (
        <p style={{ margin: 0, fontSize: 40, fontWeight: 700 }} className="mono-num">
          {prob.percent}%<span style={{ fontSize: 14, color: "var(--text-dim)", marginLeft: 8 }}>
            {prob.label} · 样本 {prob.sampleSize} 组</span>
        </p>
      )}
      {prob.kind === "insufficient" && (
        <p style={{ margin: 0, fontSize: 18 }}>样本不足，仅展示间隔分布</p>
      )}
      {prob.kind === "beyond" && (
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700 }} className="mono-num">
          &gt;90%<span style={{ fontSize: 14, color: "var(--text-dim)", marginLeft: 8 }}>已超历史最长等待，高位</span>
        </p>
      )}
      <p className="muted" style={{ marginTop: 8 }}>
        基于已核验的公开重置记录，这是趋势参考，不是 OpenAI 承诺。
      </p>
      <p className="muted" style={{ marginTop: 12 }}>
        距下一次信号扫描 <Countdown />
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <a className="btn primary" href="#subscribe">免费进群接收提醒</a>
        <a className="btn" href="#history">查看历史</a>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        无需登录 · 不读取你的账户 · 上次确认 {fmtRelative(stats.lastResetAt ?? new Date().toISOString(), now)}
      </p>
    </section>
  );
}
