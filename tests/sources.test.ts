import { describe, it, expect, vi } from "vitest";
import { fetchRemoteEvents, parseResetRelayFeed, PRIMARY_URL, FALLBACK_URL, TIBO_URL, parseTiboResponse } from "@/lib/sources";

const withUnavailableTibo = (fetcher: typeof fetch): typeof fetch =>
  (url, init) => String(url) === TIBO_URL ? Promise.resolve(new Response("Unavailable test fixture", { status: 503 })) : fetcher(url, init);

const url = "https://x.com/thsottiaux/status/2102463847714247142";
const item = (status = "重置次数公告，不代表余额已恢复", date = "Tue, 22 Sep 2026 18:23:37 GMT", title = "重置卡公告") =>
  `<item><title>${title}</title><link>${url}</link><pubDate>${date}</pubDate><description>状态：${status}。原文：Plus &amp; Pro banked reset.</description></item>`;
const feed = (items = item()) => `<rss><channel><link>https://www.resetrelay.com/codex</link>${items}</channel></rss>`;
const publicReset = (id: string, reset_type = "regular") => ({ id, reset_type,
  announced_at: "2026-09-26T18:17:54.000Z", text: "Resets all propagated.",
  source: { type: "x_post", author: "thsottiaux", url: `https://x.com/thsottiaux/status/${id}` } });
const publicPage = (data: unknown[], cursor: string | null = null) => new Response(JSON.stringify({
  data, pagination: { has_more: cursor !== null, next_cursor: cursor }, meta: { api_version: "v1" },
}));

describe("已发布的 Public API v1", () => {
  it("读取 data/source.url 格式，第55条完成公告不依赖滞后的 RSS", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(publicPage([publicReset("2103911959544610829")]));
    const result = await fetchRemoteEvents(withUnavailableTibo(fetcher));
    expect(PRIMARY_URL).toBe("https://codex-resets.com/api/v1/resets?limit=100");
    expect(result).toMatchObject({ source: "codex-resets-poll", warning: null, events: [{
      tweet_id: "2103911959544610829", tweet_url: "https://x.com/thsottiaux/status/2103911959544610829", reset_type: "regular",
    }] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("继续读取分页，保留重置卡与 observed ID", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(publicPage([publicReset("1", "banked")], "cursor_2"))
      .mockResolvedValueOnce(publicPage([{ ...publicReset("2"), id: "observed-2", source: { type: "observed", url: "https://x.com/thsottiaux/status/2" } }]));
    const result = await fetchRemoteEvents(withUnavailableTibo(fetcher));
    expect(result.events.map(e => [e.tweet_id, e.reset_type])).toEqual([["1", "banked"], ["observed-2", "regular"]]);
    expect(fetcher.mock.calls[1][0]).toBe(`${PRIMARY_URL}&cursor=cursor_2`);
  });
  it("分页循环不会静默截断历史或无限请求，转为明确降级", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(publicPage([publicReset("1")], "same"))
      .mockResolvedValueOnce(publicPage([publicReset("2")], "same"))
      .mockResolvedValueOnce(new Response(feed()));
    const result = await fetchRemoteEvents(withUnavailableTibo(fetcher));
    expect(result.source).toBe("resetrelay-rss");
    expect(result.warning).toContain("分页游标异常");
  });
});

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
    const result = await fetchRemoteEvents(withUnavailableTibo(fetcher));
    expect(result.source).toBe("resetrelay-rss");
    expect(result.warning).toContain("403");
    expect(result.events).toHaveLength(1);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([PRIMARY_URL, FALLBACK_URL]);
  });
  it("两源都失败时抛错，不能伪装成无新事件", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("Forbidden", { status: 403 }));
    await expect(fetchRemoteEvents(withUnavailableTibo(fetcher))).rejects.toThrow(/主源失败.*备用 RSS 失败/);
  });
});

describe("TIBO 公开 API 新鲜度契约", () => {
  const valid = () => ({ data: [publicReset("2103911959544610829")], stale: false, upstream_status: "ok", error: null,
    is_prediction: false, source_url: "https://codex-resets.com", fetched_at: new Date().toISOString(),
    upstream_generated_at: new Date().toISOString(), fresh_until: new Date(Date.now() + 300_000).toISOString(),
    pagination: { returned: 1, has_more: false } });
  it("只接受明确新鲜、格式合法的真实记录", () => {
    expect(parseTiboResponse(valid())).toMatchObject({ source: "tibo-public-api", warning: null,
      events: [{ tweet_id: "2103911959544610829", reset_type: "regular" }] });
  });
  it("HTTP 200 中的 stale、旧抓取时间、旧上游响应和缺失字段均拒绝", () => {
    for (const change of [
      { stale: true }, { upstream_status: "http_403" }, { fresh_until: new Date(Date.now() - 1).toISOString() },
      { fetched_at: new Date(Date.now() - 11 * 60_000).toISOString() },
      { upstream_generated_at: new Date(Date.now() - 16 * 60_000).toISOString() },
      { error: { code: "bad" } }, { data: [] }, { is_prediction: true },
    ]) expect(() => parseTiboResponse({ ...valid(), ...change })).toThrow();
  });
  it("首选 API 成功时不触碰被拒绝的旧源或 RSS", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify(valid())));
    const result = await fetchRemoteEvents(fetcher);
    expect(result.source).toBe("tibo-public-api");
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([TIBO_URL]);
  });
});
