"use client";
import { useEffect, useState } from "react";

const KEY = "wish-count";

export default function WishButton() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(Number(localStorage.getItem(KEY) ?? "0") || 0);
  }, []);
  const wish = () => {
    const next = (count ?? 0) + 1;
    localStorage.setItem(KEY, String(next));
    setCount(next);
  };
  return (
    <section className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 220px" }}>
        <p className="eyebrow">RESET WISH / GOOD LUCK</p>
        <b style={{ fontSize: 17 }}>一起等 Tibo 下次重置</b>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          点一下，为下一次额度重置攒点好运。次数只保存在你的浏览器里。
          本设备已祈愿 <b className="mono-num" style={{ color: "var(--accent)" }}>{count ?? "—"}</b> 次
        </p>
      </div>
      <button className="btn primary" onClick={wish} style={{ padding: "12px 22px", fontSize: 15, flexShrink: 0 }}>🙏 祈愿一次</button>
    </section>
  );
}
