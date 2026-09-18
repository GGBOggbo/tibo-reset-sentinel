import type { DerivedStats } from "@/lib/types";

export default function SiteFooter({ stats, updatedIso }: { stats: DerivedStats; updatedIso: string }) {
  return (
    <>
      <section className="card subscribe-card" id="subscribe" aria-labelledby="subscribe-title">
        <div>
          <p className="eyebrow">STAY TUNED</p>
          <h2 id="subscribe-title">订阅公开重置信号</h2>
          <p className="muted">飞书群入口暂未开放；你可以先用 RSS 阅读器接收公开重置记录。</p>
        </div>
        <div className="subscribe-actions">
          <a className="btn" href="/feed.xml">RSS 订阅</a>
        </div>
      </section>
      <footer className="site-footer">
        <p>最近数据更新 {updatedIso.slice(0, 10)} · 与 OpenAI 无隶属关系</p>
        <p>历史数据整理参考 <a href="https://codex-resets.com" target="_blank" rel="noreferrer">codex-resets.com</a>，每条记录均可直达原帖。</p>
        <p>历史规律不代表下一次一定发生，个人额度请以 Codex 内显示为准。</p>
      </footer>
    </>
  );
}
