import { describe, expect, it } from "vitest";
import { GET } from "@/app/feed.xml/route";

describe("RSS feed", () => {
  it("uses a real configured or local site URL and emits items", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toMatch(/<link>https?:\/\//);
    expect(xml).not.toContain("PLACEHOLDER-DOMAIN");
    expect(xml).toContain("<item>");
  });
});
