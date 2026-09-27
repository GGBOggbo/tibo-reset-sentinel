import { describe, expect, it, vi } from "vitest";
import { fetchPollingSource } from "@/lib/collector";

const result = () => ({ fetchedAt: new Date().toISOString(), source: "codex-resets-poll", warning: null,
  events: [{ tweet_id: "2103911959544610829", tweet_url: "https://x.com/thsottiaux/status/2103911959544610829",
    announced_at: "2026-09-26T18:17:54.000Z", text: "Resets all propagated.", reset_type: "regular" }] });
const respond = (body: unknown) => vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body)));

describe("服务端采集结果", () => {
  it("读取正式站采集的公告并保留原帖", async () => {
    const fetcher = respond(result());
    const data = await fetchPollingSource("https://tibo.c-quinn.xyz/api/reset-source", fetcher);
    expect(data.events[0].tweet_id).toBe("2103911959544610829");
    expect(data.warning).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("过期缓存拒绝作为最新采集结果", async () => {
    await expect(fetchPollingSource("https://example.invalid", respond({ ...result(), fetchedAt: new Date(Date.now() - 11 * 60_000).toISOString() }))).rejects.toThrow(/过期/);
  });
  it("原帖校验、错误响应及降级状态都不能被跳过", async () => {
    await expect(fetchPollingSource("https://example.invalid", vi.fn<typeof fetch>().mockResolvedValue(new Response("error", { status: 502 })))).rejects.toThrow(/502/);
    const bad = result(); bad.events[0].tweet_url = "https://example.com";
    await expect(fetchPollingSource("https://example.invalid", respond(bad))).rejects.toThrow(/校验/);
    await expect(fetchPollingSource("https://example.invalid", respond({ ...result(), source: "resetrelay-rss" }))).rejects.toThrow(/降级说明/);
    const fallback = await fetchPollingSource("https://example.invalid", respond({ ...result(), source: "resetrelay-rss", warning: "主源异常" }));
    expect(fallback.warning).toBe("主源异常");
  });
});
