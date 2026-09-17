import fs from "node:fs";
import path from "node:path";
import type { EventsFile, HealthFile, ResetEvent, DerivedStats } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DAY_MS = 86_400_000;

export function loadEvents(): EventsFile {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "events.json"), "utf8"));
}

export function loadHealth(): HealthFile {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "health.json"), "utf8"));
}

export function confirmedResets(events: ResetEvent[]): ResetEvent[] {
  return events
    .filter((e) => e.type === "reset" || e.type === "banked")
    .sort((a, b) => a.announcedAt.localeCompare(b.announcedAt));
}

export function resetIntervalsDays(events: ResetEvent[]): number[] {
  const times = confirmedResets(events).map((e) => Date.parse(e.announcedAt));
  const out: number[] = [];
  for (let i = 1; i < times.length; i++) out.push((times[i] - times[i - 1]) / DAY_MS);
  return out;
}

export function deriveStats(events: ResetEvent[], now: Date = new Date()): DerivedStats {
  const resets = confirmedResets(events);
  if (resets.length === 0)
    return { totalResets: 0, avgIntervalDays: 0, longestIntervalDays: 0, daysSinceLastReset: 0, lastResetAt: null };
  const intervals = resetIntervalsDays(events);
  const avg = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  return {
    totalResets: resets.length,
    avgIntervalDays: avg,
    longestIntervalDays: intervals.length ? Math.max(...intervals) : 0,
    daysSinceLastReset: (now.getTime() - Date.parse(resets[resets.length - 1].announcedAt)) / DAY_MS,
    lastResetAt: resets[resets.length - 1].announcedAt,
  };
}
