"use client";
import { useEffect, useState } from "react";
import { isHealthy } from "@/lib/health";

const SLOT = 30 * 60 * 1000;

function nextSlot(from: number) {
  return Math.ceil((from + 1) / SLOT) * SLOT;
}

export default function Countdown({ lastSuccessAt, lastFailureAt, sourceWarning }: { lastSuccessAt: string; lastFailureAt: string | null; sourceWarning?: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null)
    return (
      <div className="count-digits" aria-label="倒计时加载中">
        {["--", "--", "--"].map((n, i) => (
          <span key={i} className="count-seg"><span className="num">{n}</span></span>
        ))}
      </div>
    );
  const remain = nextSlot(now) - now;
  const h = String(Math.floor(remain / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((remain % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((remain % 60_000) / 1000)).padStart(2, "0");
  if (!isHealthy({ lastSuccessAt, lastFailureAt, lastError: null, sourceWarning }, now)) {
    return <p role="status" className="muted" style={{ color: "var(--warn)" }}>自动更新异常，暂不显示扫描倒计时。历史记录仍可查看。</p>;
  }
  return (
    <div>
      <div className="count-digits" role="timer" aria-label={`距下一次信号扫描 ${h} 时 ${m} 分 ${s} 秒`}>
        <span className="count-seg"><span className="num">{h}</span><span className="unit">时</span></span>
        <span className="count-colon">:</span>
        <span className="count-seg"><span className="num">{m}</span><span className="unit">分</span></span>
        <span className="count-colon">:</span>
        <span className="count-seg"><span className="num">{s}</span><span className="unit">秒</span></span>
      </div>
      <p className="muted" style={{ margin: "10px 0 0" }}>
        计划扫描 · 整点/半点 · 倒计时不代表正在采集
      </p>
    </div>
  );
}
