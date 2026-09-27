import { deriveStats, resetIntervalsDays, confirmedResets } from "@/lib/events";
import { loadLiveSnapshot } from "@/lib/live";
import { probability } from "@/lib/probability";
import { isHealthy } from "@/lib/health";
import RadarStatus from "@/components/RadarStatus";
import LastResetCard from "@/components/LastResetCard";
import ResetTimeline from "@/components/ResetTimeline";
import StatCards from "@/components/StatCards";
import FeedList from "@/components/FeedList";
import WishButton from "@/components/WishButton";
import SiteFooter from "@/components/SiteFooter";
import BrandMark from "@/components/BrandMark";
import PartnerResourceCard from "@/components/PartnerResourceCard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function Page() {
  const { events, health } = await loadLiveSnapshot();
  const stats = deriveStats(events);
  const intervals = resetIntervalsDays(events);
  const prob = probability(intervals, stats.daysSinceLastReset);
  const healthy = isHealthy(health);
  const now = new Date();
  const lastReset = confirmedResets(events).at(-1)!;
  return (
    <main className="shell" data-checked-at={health.lastSuccessAt} data-source={health.lastSource}>
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
        sourceWarning={health.sourceWarning} lastSource={health.lastSource} sourceFetchedAt={health.sourceFetchedAt}
        totalIntervals={intervals.length} />
      </div>
      <div className="support-grid reveal reveal-4">
        <LastResetCard event={lastReset} now={now} />
        <WishButton />
      </div>
      <div className="reveal reveal-4"><StatCards stats={stats} /></div>
      <ResetTimeline events={events} />
      <FeedList events={events} nowIso={now.toISOString()} updatedIso={health.lastSuccessAt} />
      <SiteFooter stats={stats} updatedIso={health.lastSuccessAt} />
    </main>
  );
}
