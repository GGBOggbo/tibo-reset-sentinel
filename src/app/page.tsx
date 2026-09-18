import { loadEvents, deriveStats, resetIntervalsDays, loadHealth, confirmedResets } from "@/lib/events";
import { probability } from "@/lib/probability";
import RadarStatus from "@/components/RadarStatus";
import LastResetCard from "@/components/LastResetCard";
import ResetTimeline from "@/components/ResetTimeline";
import StatCards from "@/components/StatCards";
import FeedList from "@/components/FeedList";
import WishButton from "@/components/WishButton";
import SiteFooter from "@/components/SiteFooter";
import BrandMark from "@/components/BrandMark";
import PartnerResourceCard from "@/components/PartnerResourceCard";

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
      <header className="site-header reveal reveal-1">
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <p className="eyebrow">TIBO RESET SENTINEL</p>
            <h1>Tibo重置哨兵</h1>
            <p className="tagline">盯着 <a href="https://x.com/thsottiaux" target="_blank" rel="noreferrer">@thsottiaux</a> 的重置公告，替你从噪音里找信号</p>
          </div>
        </div>
        <a className="header-link" href="https://x.com/thsottiaux" target="_blank" rel="noreferrer">查看原始信号 ↗</a>
      </header>
      <PartnerResourceCard />
      <div className="reveal reveal-3">
        <RadarStatus stats={stats} prob={prob} intervalsDays={intervals} healthy={healthy} lastSuccessAt={health.lastSuccessAt}
        lastFailureAt={health.lastFailureAt} lastError={health.lastError} now={now}
        totalIntervals={intervals.length} />
      </div>
      <div className="support-grid reveal reveal-4">
        <LastResetCard event={lastReset} now={now} />
        <WishButton />
      </div>
      <div className="reveal reveal-4"><StatCards stats={stats} /></div>
      <ResetTimeline events={events} />
      <FeedList events={events} nowIso={now.toISOString()} />
      <SiteFooter stats={stats} updatedIso={health.lastSuccessAt} />
    </main>
  );
}
