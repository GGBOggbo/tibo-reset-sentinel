import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/live", async () => {
  const { loadEvents, loadHealth } = await import("@/lib/events");
  return { loadLiveSnapshot: async () => ({ events: loadEvents().events, health: loadHealth() }) };
});
import { GET } from "@/app/feed.xml/route";

describe("RSS feed", () => {
  it("uses a real configured or local site URL and emits items", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toMatch(/<link>https?:\/\//);
    expect(xml).not.toContain("PLACEHOLDER-DOMAIN");
    expect(xml).not.toContain("localhost");
    expect(xml).not.toContain("飞书群第一时间推送");
    expect(xml).toContain("<item>");
  });
});
