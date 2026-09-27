"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isHealthy } from "@/lib/health";

const REFRESH_MS = 5 * 60 * 1000;

export default function Countdown({ lastSuccessAt, lastFailureAt, sourceWarning }: { lastSuccessAt: string; lastFailureAt: string | null; sourceWarning?: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const router = useRouter();
  useEffect(() => {
    let next = Date.now() + REFRESH_MS;
    setNextRefreshAt(next);
    setNow(Date.now());
    const refresh = () => {
      next = Date.now() + REFRESH_MS;
      setNextRefreshAt(next);
      router.refresh();
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= next && document.visibilityState === "visible") refresh();
    }, 1000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [router]);

  if (now === null || nextRefreshAt === null)
    return (
      <div className="count-digits" aria-label="倒计时加载中">
        {["--", "--", "--"].map((n, i) => (
          <span key={i} className="count-seg"><span className="num">{n}</span></span>
        ))}
      </div>
    );
  const remain = Math.max(0, nextRefreshAt - now);
  const h = String(Math.floor(remain / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((remain % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((remain % 60_000) / 1000)).padStart(2, "0");
  if (!isHealthy({ lastSuccessAt, lastFailureAt, lastError: null, sourceWarning }, now)) {
    return <p role="status" className="muted" style={{ color: "var(--warn)" }}>暂时无法核对最新公告，本页仍会每 5 分钟重试。历史记录保留。</p>;
  }
  return (
    <div>
      <div className="count-digits" role="timer" aria-label={`距本页自动刷新 ${h} 时 ${m} 分 ${s} 秒`}>
        <span className="count-seg"><span className="num">{h}</span><span className="unit">时</span></span>
        <span className="count-colon">:</span>
        <span className="count-seg"><span className="num">{m}</span><span className="unit">分</span></span>
        <span className="count-colon">:</span>
        <span className="count-seg"><span className="num">{s}</span><span className="unit">秒</span></span>
      </div>
      <p className="muted" style={{ margin: "10px 0 0" }}>
        到时本页自动重新核对 · 也可手动刷新
      </p>
    </div>
  );
}
