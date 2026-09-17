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
    <section className="card" style={{ textAlign: "center" }}>
      <p className="eyebrow">RESET WISH / GOOD LUCK</p>
      <p style={{ margin: "0 0 4px" }}>一起等 Tibo 下次重置</p>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        点一下攒点好运，次数只保存在你的浏览器里。本设备已祈愿 {count ?? "—"} 次
      </p>
      <button className="btn primary" onClick={wish}>🙏 祈愿一次</button>
    </section>
  );
}
