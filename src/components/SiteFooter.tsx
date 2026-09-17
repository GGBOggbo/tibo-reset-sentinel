import type { DerivedStats } from "@/lib/types";

export default function SiteFooter({ stats, updatedIso }: { stats: DerivedStats; updatedIso: string }) {
  return (
    <>
      <section className="card" id="subscribe">
        <p className="eyebrow">STAY TUNED</p>
        <b>重置确认后，第一时间飞书群推送</b>
        <p className="muted" style={{ margin: "8px 0 12px" }}>
          扫码进群即订阅，退群即退订。不发广告，不收集任何信息。
        </p>
        {/* 站长建群后替换为真实群二维码图片 public/lark-group-qr.png */}
        <div style={{ border: "1px dashed var(--card-border)", borderRadius: 10, padding: "20px 12px",
          color: "var(--text-dim)", fontSize: 13, textAlign: "center" }}>
          飞书订阅群二维码（部署前替换）
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          也可用 <a href="/feed.xml">RSS 订阅</a> · 当前 {stats.totalResets} 次公开记录
        </p>
      </section>
      <footer className="muted" style={{ textAlign: "center", fontSize: 12 }}>
        <p>最近数据更新 {updatedIso.slice(0, 10)} · 与 OpenAI 无隶属关系</p>
        <p>历史规律不代表下一次一定发生，个人额度请以 Codex 内显示为准。所有记录均可直达原帖。</p>
      </footer>
    </>
  );
}
