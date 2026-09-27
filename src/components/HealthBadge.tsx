"use client";
import { useEffect, useState } from "react";
import { isHealthy } from "@/lib/health";

export default function HealthBadge({
  initialHealthy, lastSuccessAt, lastFailureAt, sourceWarning,
}: { initialHealthy: boolean; lastSuccessAt: string; lastFailureAt: string | null; sourceWarning?: string | null }) {
  const [healthy, setHealthy] = useState(initialHealthy);
  useEffect(() => {
    const check = () =>
      setHealthy(isHealthy({ lastSuccessAt, lastFailureAt, lastError: null, sourceWarning }));
    check(); // 挂载后切到实时判断（静态页构建值可能已过期）
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [lastSuccessAt, lastFailureAt, sourceWarning]);
  return (
    <span className={`badge${healthy ? "" : " warn"}`} role="status" aria-live="polite">
      <span className="dot pulse" />{healthy ? "最近采集成功" : "更新异常 · 数据可能滞后"}
    </span>
  );
}
