import { describe, it, expect, vi } from "vitest";
import { fetchRemoteEvents, parseResetRelayFeed, PRIMARY_URL, FALLBACK_URL } from "@/lib/sources";

const url = "https://x.com/thsottiaux/status/2102463847714247142";
const item = (status = "重置次数公告，不代表余额已恢复", date = "Tue, 22 Sep 2026 18:23:37 GMT", title = "重置卡公告") =>
  `<item><title>${title}</title><link>${url}</link><pubDate>${date}</pubDate><description>状态：${status}。原文：Plus &amp; Pro banked reset.</description></item>`;
const feed = (items = item()) => `<rss><channel><link>https://www.resetrelay.com/codex</link>${items}</channel></rss>`;

describe("公开 RSS 备用来源", () => {
  it("保留精确原帖 ID，识别重置卡并解码 XML", () => {
    const result = parseResetRelayFeed(feed());
    expect(result.events[0]).toMatchObject({ tweet_id: "2102463847714247142", reset_type: "banked", announced_at: "2026-09-22T18:23:37.000Z" });
    expect(result.events[0].text).toContain("Plus & Pro");
  });
  it("新更正优先于旧确认，预告不进入重置统计", () => {
    const result = parseResetRelayFeed(feed(item("已确认的公开额度重置")
      + item("待确认消息，不代表重置完成", "Wed, 23 Sep 2026 18:23:37 GMT", "【更正】等待确认")));
    expect(result.events).toEqual([]);
    expect(result.unconfirmedUrls).toEqual([url]);
  });
  it("未知状态、假链接、畸形 XML 都拒绝，不猜测分类", () => {
    expect(() => parseResetRelayFeed(feed(item("状态格式已改变")))).toThrow(/未知公告状态/);
    expect(() => parseResetRelayFeed(feed().replace(url, "https://example.com/1"))).toThrow(/原帖地址非法/);
    expect(() => parseResetRelayFeed("<rss>")).toThrow(/XML/);
    expect(() => parseResetRelayFeed("<!DOCTYPE rss>" + feed())).toThrow(/XML/);
  });
  it("主源 403 自动切到独立 RSS，暴露降级原因", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Forbidden", { status: 403 }))
      .mockResolvedValueOnce(new Response(feed()));
    const result = await fetchRemoteEvents(fetcher);
    expect(result.source).toBe("resetrelay-rss");
    expect(result.warning).toContain("403");
    expect(result.events).toHaveLength(1);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([PRIMARY_URL, FALLBACK_URL]);
  });
  it("两源都失败时抛错，不能伪装成无新事件", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("Forbidden", { status: 403 }));
    await expect(fetchRemoteEvents(fetcher)).rejects.toThrow(/主源失败.*备用 RSS 失败/);
  });
});
