"use client";
import { useEffect, useState } from "react";

const KEY = "wish-count";
const MAX_WISHES = 3;

export default function WishButton() {
  const [count, setCount] = useState<number | null>(null);
  const [justWished, setJustWished] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const saved = Math.min(Number(localStorage.getItem(KEY) ?? "0") || 0, MAX_WISHES);
    localStorage.setItem(KEY, String(saved));
    setCount(saved);
  }, []);
  const wish = () => {
    if ((count ?? 0) >= MAX_WISHES) return;
    const next = (count ?? 0) + 1;
    localStorage.setItem(KEY, String(next));
    setCount(next);
    setJustWished(true);
    setCelebrating(true);
    window.setTimeout(() => setJustWished(false), 1600);
    window.setTimeout(() => setCelebrating(false), 850);
  };
  return (
    <section className={`card wish-card${celebrating ? " is-celebrating" : ""}`} aria-labelledby="wish-title">
      <div>
        <p className="eyebrow">RESET WISH / GOOD LUCK</p>
        <h2 id="wish-title">一起等 Tibo 下次重置</h2>
        <p className="muted">
          点一下，为下一次额度重置攒点好运。次数只保存在你的浏览器里。
          本设备已祈愿 <b className="mono-num" style={{ color: "var(--accent)" }} aria-live="polite">{count ?? "—"}/{MAX_WISHES}</b> 次
        </p>
      </div>
      <button className={`btn primary wish-button${celebrating ? " is-celebrating" : ""}`} onClick={wish} disabled={(count ?? 0) >= MAX_WISHES}>
        {justWished ? "✅ 已祈愿一次" : (count ?? 0) >= MAX_WISHES ? `已完成 ${MAX_WISHES}/${MAX_WISHES}` : "🙏 祈愿一次"}
        {celebrating && <span className="wish-burst" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></span>}
      </button>
    </section>
  );
}
