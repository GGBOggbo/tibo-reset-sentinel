import { describe, expect, it } from "vitest";
import { refreshSnapshot } from "@/lib/snapshot";
import { mergeSourceEvents } from "@/lib/sync";
import type { EventsFile, HealthFile } from "@/lib/types";
import type { SourceResult } from "@/lib/sources";

const archive: EventsFile = { version: 1, events: [{ id: "1", type: "reset", title: "历史中文标题", summary: "历史中文摘要",
  announcedAt: "2026-09-12T08:09:17.000Z", tweetUrl: "https://x.com/thsottiaux/status/1", verified: true, source: "manual" }] };
const health: HealthFile = { lastSuccessAt: "2026-09-17T00:00:00Z", lastFailureAt: null, lastError: null };
const source: SourceResult = { source: "tibo-public-api", warning: null, sourceFetchedAt: new Date().toISOString(), events: [
  { tweet_id: "1", tweet_url: archive.events[0].tweetUrl, text: "old", announced_at: archive.events[0].announcedAt, reset_type: "regular" },
  { tweet_id: "2103911959544610829", tweet_url: "https://x.com/thsottiaux/status/2103911959544610829", text: "Resets all propagated.", announced_at: "2026-09-26T18:17:54.000Z", reset_type: "regular" },
] };

describe("页面实时数据独立于 Git 归档", () => {
  it("旧归档直接合并新公告用于页面/RSS，且不改写旧记录或输入", async () => {
    const original = JSON.stringify(archive);
    const snapshot = await refreshSnapshot(archive, health, async () => source);
    expect(snapshot.events).toHaveLength(2);
    expect(snapshot.events[0]).toEqual(archive.events[0]);
    expect(snapshot.events[1].id).toBe("2103911959544610829");
    expect(snapshot.health).toMatchObject({ lastSource: "tibo-public-api", sourceWarning: null });
    expect(JSON.stringify(archive)).toBe(original);
  });
  it("来源失败时保留历史并明确标记过期，不静默显示绿色", async () => {
    const snapshot = await refreshSnapshot(archive, health, async () => { throw new Error("HTTP 403"); });
    expect(snapshot.events).toEqual(archive.events);
    expect(snapshot.health.lastSuccessAt).toBe(health.lastSuccessAt);
    expect(snapshot.health.sourceWarning).toContain("无法核对");
    expect(snapshot.health.lastError).toContain("403");
  });
  it("最近100条与档案失去交集时报告可能缺口", () => {
    expect(() => mergeSourceEvents(archive, { ...source, events: source.events.slice(1) })).toThrow(/采集缺口/);
  });
});
