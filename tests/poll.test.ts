import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPoll } from "../scripts/poll";
import type { SourceResult } from "@/lib/sources";

let dir: string;
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const now = new Date("2026-09-26T12:00:00Z");
const event = { id: "observed-old", type: "reset", title: "旧记录", summary: "原文", announcedAt: "2026-09-12T08:09:17.000Z",
  tweetUrl: "https://x.com/thsottiaux/status/100", verified: true, source: "codex-resets-poll" };
const remote: SourceResult = { source: "resetrelay-rss", warning: "主源 HTTP 403", events: [
  { tweet_id: "100", tweet_url: event.tweetUrl, text: "old", announced_at: event.announcedAt, reset_type: "regular" },
  { tweet_id: "200", tweet_url: "https://x.com/thsottiaux/status/200", text: "重置卡", announced_at: "2026-09-22T18:23:37.000Z", reset_type: "banked" },
] };

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "sentinel-poll-test-"));
  fs.writeFileSync(path.join(dir, "events.json"), JSON.stringify({ version: 1, events: [event] }));
  fs.writeFileSync(path.join(dir, "health.json"), JSON.stringify({ lastSuccessAt: "2026-09-17T13:46:18.146Z", lastFailureAt: null, lastError: null }));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); vi.restoreAllMocks(); });

describe("轮询入库与故障恢复", () => {
  it("补入重置卡，保留历史，按原帖跨源去重；再次运行无重复", async () => {
    const opts = { dataDir: dir, now, fetchRemote: async () => remote };
    expect(await runPoll(opts)).toMatchObject({ failed: false, degraded: true, changed: true, changedCount: 1 });
    expect(read("events.json").events).toHaveLength(2);
    expect(read("events.json").events[0]).toEqual(event);
    expect(read("events.json").events[1]).toMatchObject({ type: "banked", source: "resetrelay-rss" });
    expect(read("health.json")).toMatchObject({ lastSource: "resetrelay-rss", sourceWarning: "主源 HTTP 403", lastFailureAt: null });
    expect(await runPoll(opts)).toMatchObject({ failed: false, changed: false, changedCount: 0 });
  });
  it("两源失败保留原始历史与上次成功时间，同时保存失败状态", async () => {
    const original = fs.readFileSync(path.join(dir, "events.json"), "utf8");
    expect(await runPoll({ dataDir: dir, now, fetchRemote: async () => { throw new Error("两源不可用"); } })).toMatchObject({ failed: true, changed: true });
    expect(fs.readFileSync(path.join(dir, "events.json"), "utf8")).toBe(original);
    expect(read("health.json")).toMatchObject({ lastSuccessAt: "2026-09-17T13:46:18.146Z", lastFailureAt: now.toISOString(), lastError: "两源不可用" });
  });
  it("公开主源恢复后清除降级状态，插入完成公告并去重", async () => {
    await runPoll({ dataDir: dir, now, fetchRemote: async () => remote });
    const recovered: SourceResult = { source: "codex-resets-poll", warning: null, events: [...remote.events,
      { tweet_id: "2103911959544610829", tweet_url: "https://x.com/thsottiaux/status/2103911959544610829", text: "Resets all propagated.", announced_at: "2026-09-26T18:17:54.000Z", reset_type: "regular" },
    ] };
    const opts = { dataDir: dir, now: new Date("2026-09-27T00:00:00Z"), fetchRemote: async () => recovered };
    expect(await runPoll(opts)).toMatchObject({ failed: false, degraded: false, changedCount: 1 });
    expect(read("health.json")).toMatchObject({ lastSource: "codex-resets-poll", sourceWarning: null });
    expect(read("events.json").events.at(-1).id).toBe("2103911959544610829");
    expect(await runPoll(opts)).toMatchObject({ changed: false, changedCount: 0 });
  });
  it("dry-run 成功与失败都不写文件", async () => {
    const original = [read("events.json"), read("health.json")];
    expect(await runPoll({ dataDir: dir, now, dryRun: true, fetchRemote: async () => remote })).toMatchObject({ changed: false, changedCount: 1 });
    expect(await runPoll({ dataDir: dir, now, dryRun: true, fetchRemote: async () => { throw new Error("失败"); } })).toMatchObject({ failed: true, changed: false });
    expect([read("events.json"), read("health.json")]).toEqual(original);
  });
  it("更正会退出已完成统计，之后重新确认可恢复，且不增加记录", async () => {
    await runPoll({ dataDir: dir, now, fetchRemote: async () => remote });
    await runPoll({ dataDir: dir, now, fetchRemote: async () => ({ ...remote, events: [], unconfirmedUrls: [remote.events[1].tweet_url] }) });
    expect(read("events.json").events[1]).toMatchObject({ type: "normal", verified: false });
    await runPoll({ dataDir: dir, now, fetchRemote: async () => remote });
    expect(read("events.json").events).toHaveLength(2);
    expect(read("events.json").events[1]).toMatchObject({ type: "banked", verified: true });
  });
});
