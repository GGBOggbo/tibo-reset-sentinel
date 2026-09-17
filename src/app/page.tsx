import { loadEvents, deriveStats, resetIntervalsDays } from "@/lib/events";
import { probability } from "@/lib/probability";

export default function Page() {
  const { events } = loadEvents();
  const stats = deriveStats(events);
  const prob = probability(resetIntervalsDays(events), stats.daysSinceLastReset);
  return (
    <main className="shell">
      <p className="muted">骨架：{stats.totalResets} 次重置 / 概率 {prob.kind}</p>
    </main>
  );
}
