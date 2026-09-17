"use client";
import { useEffect, useState } from "react";

const SLOT = 30 * 60 * 1000;

function nextSlot(from: number) {
  return Math.ceil((from + 1) / SLOT) * SLOT;
}

export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span className="mono-num">--:--:--</span>;
  const remain = nextSlot(now) - now;
  const h = String(Math.floor(remain / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((remain % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((remain % 60_000) / 1000)).padStart(2, "0");
  const minute = new Date(now).getMinutes();
  const scanning = minute >= 28 || minute < 3; // XX:28–XX:03 为扫描窗口
  return (
    <span>
      <span className="mono-num">{h}:{m}:{s}</span>
      <span className="muted"> · {scanning ? "扫描中" : "下一次整点/半点 · 北京时间"}</span>
    </span>
  );
}
