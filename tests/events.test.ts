import { describe, it, expect } from "vitest";
import { deriveStats, resetIntervalsDays } from "@/lib/events";
import type { ResetEvent } from "@/lib/types";

const ev = (id: string, at: string, type = "reset"): ResetEvent =>
  ({ id, type: type as ResetEvent["type"], title: id, summary: "", announcedAt: at,
     tweetUrl: "https://x.com/thsottiaux/status/" + id, verified: true, source: "manual" });

// 五次重置：0d, 2d, 4d, 8d, 16d（相对 2026-01-01T00:00:00Z）→ 间隔 [2,2,4,8]
const events = [
  ev("1", "2026-01-01T00:00:00.000Z"),
  ev("2", "2026-01-03T00:00:00.000Z"),
  ev("3", "2026-01-05T00:00:00.000Z"),
  ev("4", "2026-01-09T00:00:00.000Z"),
  ev("5", "2026-01-17T00:00:00.000Z"),
  ev("n1", "2026-01-18T00:00:00.000Z", "normal"), // 不计入
];

describe("deriveStats", () => {
  it("统计 reset+banked、派生间隔与距今天数", () => {
    const s = deriveStats(events, new Date("2026-01-21T00:00:00.000Z"));
    expect(s.totalResets).toBe(5);
    expect(s.avgIntervalDays).toBeCloseTo(4);
    expect(s.longestIntervalDays).toBe(8);
    expect(s.daysSinceLastReset).toBeCloseTo(4);
    expect(s.lastResetAt).toBe("2026-01-17T00:00:00.000Z");
  });
  it("空数据安全返回", () => {
    const s = deriveStats([]);
    expect(s.totalResets).toBe(0);
    expect(s.lastResetAt).toBeNull();
  });
});

describe("resetIntervalsDays", () => {
  it("返回升序确认重置的相邻间隔", () => {
    expect(resetIntervalsDays(events)).toEqual([2, 2, 4, 8]);
  });
  it("乱序输入 + banked 计入并正确排序", () => {
    const shuffled = [
      ev("4", "2026-01-09T00:00:00.000Z", "reset"),
      ev("1", "2026-01-01T00:00:00.000Z", "banked"), // banked 也算确认重置
      ev("2", "2026-01-03T00:00:00.000Z", "reset"),
    ];
    expect(resetIntervalsDays(shuffled)).toEqual([2, 6]);
  });
});
