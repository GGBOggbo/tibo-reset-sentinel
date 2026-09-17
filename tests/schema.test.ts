import { describe, it, expect } from "vitest";
import { validateEvents } from "@/lib/schema";
import type { EventsFile } from "@/lib/types";

const ok: EventsFile = {
  version: 1,
  events: [{
    id: "2098685367058612394", type: "reset", title: "全量重置已传播完成", summary: "s",
    announcedAt: "2026-09-12T08:09:17.000Z",
    tweetUrl: "https://x.com/thsottiaux/status/2098685367058612394",
    verified: true, source: "manual",
  }],
};

describe("validateEvents", () => {
  it("合法数据通过", () => expect(validateEvents(ok)).toEqual([]));
  it("version 必须为 1", () =>
    expect(validateEvents({ ...ok, version: 2 as 1 })).toHaveLength(1));
  it("type 枚举外报错", () =>
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], type: "foo" as never }] })).toHaveLength(1));
  it("source 枚举外报错", () =>
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], source: "foo" as never }] })).toHaveLength(1));
  it("events 非数组报错", () =>
    expect(validateEvents({ ...ok, events: "nope" as never })).toContain("events 必须为数组"));
  it("时间不可解析报错", () =>
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], announcedAt: "not-a-date" }] })).toHaveLength(1));
  it("tweetUrl 非 X 链接报错", () =>
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], tweetUrl: "https://example.com" }] })).toHaveLength(1));
  it("id 重复报错", () => {
    const dup = { ...ok, events: [ok.events[0], { ...ok.events[0] }] };
    expect(validateEvents(dup)).toHaveLength(1);
  });
  it("title 全空白报错", () =>
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], title: " " }] })).toHaveLength(1));
  it("未来时间报错（+5 分钟容忍）", () => {
    const future = new Date(Date.now() + 10 * 60_000).toISOString();
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], announcedAt: future }] }, new Date())).toHaveLength(1);
    // 恰好在容忍窗口内（+1 分钟）则通过
    const near = new Date(Date.now() + 60_000).toISOString();
    expect(validateEvents({ ...ok, events: [{ ...ok.events[0], announcedAt: near }] }, new Date())).toEqual([]);
  });
  it("null 条目报错且不崩溃", () =>
    expect(validateEvents({ ...ok, events: [null as never] })).toContain("events[0]: 条目必须为对象"));
  it("id 缺失单独报错", () => {
    const r = validateEvents({ ...ok, events: [{ ...ok.events[0], id: "" }] });
    expect(r).toContain("events[0]: id 缺失");
  });
});
