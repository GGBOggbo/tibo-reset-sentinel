"use client";
import { useEffect, useState } from "react";

const ONLINE_H = 26; // 与 poll 心跳粒度（12h）匹配的降级阈值

export default function HealthBadge({
  initialHealthy, lastSuccessAt,
}: { initialHealthy: boolean; lastSuccessAt: string }) {
  const [healthy, setHealthy] = useState(initialHealthy);
  useEffect(() => {
    const check = () =>
      setHealthy(Date.now() - Date.parse(lastSuccessAt) < ONLINE_H * 3_600_000);
    check(); // 挂载后切到实时判断（静态页构建值可能已过期）
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [lastSuccessAt]);
  return (
    <span className={`badge${healthy ? "" : " warn"}`} role="status" aria-live="polite">
      <span className="dot pulse" />{healthy ? "雷达在线" : "雷达降级 · 人工核验中"}
    </span>
  );
}
