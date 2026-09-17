import { loadEvents, deriveStats, resetIntervalsDays, loadHealth } from "@/lib/events";
import { probability } from "@/lib/probability";
import RadarStatus from "@/components/RadarStatus";

export default function Page() {
  const { events } = loadEvents();
  const stats = deriveStats(events);
  const prob = probability(resetIntervalsDays(events), stats.daysSinceLastReset);
  const healthy = Date.now() - Date.parse(loadHealth().lastSuccessAt) < 26 * 3_600_000;
  return (
    <main className="shell">
      <RadarStatus stats={stats} prob={prob} healthy={healthy} now={new Date()} />
      <p className="muted">区块①完成：{stats.totalResets} 次重置</p>
    </main>
  );
}
