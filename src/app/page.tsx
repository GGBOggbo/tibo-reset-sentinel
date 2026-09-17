import { loadEvents, deriveStats, resetIntervalsDays, loadHealth, confirmedResets } from "@/lib/events";
import { probability } from "@/lib/probability";
import RadarStatus from "@/components/RadarStatus";
import LastResetCard from "@/components/LastResetCard";
import ResetTimeline from "@/components/ResetTimeline";
import StatCards from "@/components/StatCards";
import FeedList from "@/components/FeedList";
import WishButton from "@/components/WishButton";
import SiteFooter from "@/components/SiteFooter";

export default function Page() {
  const { events } = loadEvents();
  const stats = deriveStats(events);
  const intervals = resetIntervalsDays(events);
  const prob = probability(intervals, stats.daysSinceLastReset);
  const health = loadHealth();
  // 构建时求值：降级判定最长延迟一个心跳周期（12h）
  const healthy = Date.now() - Date.parse(health.lastSuccessAt) < 26 * 3_600_000;
  const now = new Date();
  const lastReset = confirmedResets(events).at(-1)!;
  return (
    <main className="shell">
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span aria-hidden="true" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38, borderRadius: 12, fontSize: 20,
          background: "var(--bg-soft)", border: "1px solid var(--card-border)" }}>🛰</span>
        <div>
          <b style={{ fontSize: 16 }}>额度哨兵 <span className="muted" style={{ fontWeight: 400 }}>· Codex Reset Sentinel</span></b>
          <p className="muted" style={{ margin: 0 }}>
            盯着 <a href="https://x.com/thsottiaux" target="_blank" rel="noreferrer">@thsottiaux</a> 的重置公告，替你从噪音里找信号
          </p>
        </div>
      </header>
      <RadarStatus stats={stats} prob={prob} healthy={healthy} lastSuccessAt={health.lastSuccessAt} now={now}
        totalIntervals={intervals.length} />
      <LastResetCard event={lastReset} now={now} />
      <WishButton />
      <StatCards stats={stats} />
      <ResetTimeline events={events} />
      <FeedList events={events} nowIso={now.toISOString()} />
      <SiteFooter stats={stats} updatedIso={health.lastSuccessAt} />
    </main>
  );
}
