import { describe, it, expect } from "vitest";
import { mapRemote, findNewEvents, validateRemoteEvents } from "@/lib/diff";
import type { ResetEvent } from "@/lib/types";

const local: ResetEvent[] = [{
  id: "100", type: "reset", title: "t", summary: "s",
  announcedAt: "2026-09-12T08:09:17.000Z",
  tweetUrl: "https://x.com/thsottiaux/status/100", verified: true, source: "manual",
}];

describe("mapRemote", () => {
  it("regular→reset，保留溯源", () => {
    const m = mapRemote({ tweet_id: "2", tweet_url: "https://x.com/thsottiaux/status/2",
      text: "All reset.", announced_at: "2026-09-20T00:00:00.000Z", reset_type: "regular" }, 54);
    expect(m.type).toBe("reset");
    expect(m.source).toBe("codex-resets-poll");
    expect(m.title).toContain("54");
  });

  it("banked → type banked + 标题含重置卡", () => {
    const m = mapRemote({ tweet_id: "3", tweet_url: "https://x.com/thsottiaux/status/3",
      text: "banked reset for Pro", announced_at: "2026-09-22T00:00:00.000Z", reset_type: "banked" }, 55);
    expect(m.type).toBe("banked");
    expect(m.title).toContain("重置卡");
  });
});

describe("findNewEvents", () => {
  const remote = [
    { tweet_id: "100", tweet_url: "https://x.com/thsottiaux/status/100", text: "old",
      announced_at: "2026-09-12T08:09:17.000Z", reset_type: "regular" },        // 已存在 → 忽略
    { tweet_id: "101", tweet_url: "https://x.com/thsottiaux/status/101", text: "new",
      announced_at: "2026-09-20T00:00:00.000Z", reset_type: "regular" },         // 新 → 保留
    { tweet_id: "102", tweet_url: "https://x.com/thsottiaux/status/102", text: "banked",
      announced_at: "2026-09-21T00:00:00.000Z", reset_type: "banked" },          // 新 banked → 保留
  ] as const;
  it("只返回本地没有的重置类事件", () => {
    const fresh = findNewEvents(local, remote as never);
    expect(fresh.map((e) => e.tweet_id)).toEqual(["101", "102"]);
  });
});

describe("validateRemoteEvents", () => {
  const ok = { tweet_id: "1", tweet_url: "https://x.com/thsottiaux/status/1", text: "reset", announced_at: "2026-09-12T08:09:17.000Z", reset_type: "regular" as const };
  it("接受合法远端事件", () => expect(validateRemoteEvents([ok], new Date("2026-09-13T00:00:00Z"))).toEqual([]));
  it("拒绝非法原帖地址和未来时间", () => {
    const errors = validateRemoteEvents([{ ...ok, tweet_url: "https://example.com", announced_at: "2027-01-01T00:00:00Z" }], new Date("2026-09-13T00:00:00Z"));
    expect(errors.join("\n")).toMatch(/tweet_url 非法/);
    expect(errors.join("\n")).toMatch(/announced_at 不得晚于/);
  });
});
