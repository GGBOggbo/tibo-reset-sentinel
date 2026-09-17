import { loadEvents, deriveStats, resetIntervalsDays, loadHealth, confirmedResets } from "@/lib/events";
import { probability } from "@/lib/probability";
import RadarStatus from "@/components/RadarStatus";
import LastResetCard from "@/components/LastResetCard";
import ResetTimeline from "@/components/ResetTimeline";
import FeedList from "@/components/FeedList";
import WishButton from "@/components/WishButton";
import SiteFooter from "@/components/SiteFooter";

export default function Page() {
  const { events } = loadEvents();
  const stats = deriveStats(events);
  const prob = probability(resetIntervalsDays(events), stats.daysSinceLastReset);
  const health = loadHealth();
  // 构建时求值：降级判定最长延迟一个心跳周期（12h）
  const healthy = Date.now() - Date.parse(health.lastSuccessAt) < 26 * 3_600_000;
  const now = new Date();
  const lastReset = confirmedResets(events).at(-1)!;
  return (
    <main className="shell">
      <RadarStatus stats={stats} prob={prob} healthy={healthy} lastSuccessAt={health.lastSuccessAt} now={now} />
      <LastResetCard event={lastReset} now={now} />
      <ResetTimeline events={events} stats={stats} />
      <FeedList events={events} nowIso={now.toISOString()} />
      <WishButton />
      <SiteFooter stats={stats} updatedIso={health.lastSuccessAt} />
    </main>
  );
}
