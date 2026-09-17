import { loadEvents, confirmedResets } from "@/lib/events";

export const dynamic = "force-static";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET() {
  const items = confirmedResets(loadEvents().events)
    .slice(-20)
    .reverse()
    .map((e) => `  <item>
    <title>${esc(e.title)}</title>
    <link>${e.tweetUrl}</link>
    <guid isPermaLink="true">${e.tweetUrl}</guid>
    <pubDate>${new Date(e.announcedAt).toUTCString()}</pubDate>
    <description>${esc(e.summary)}</description>
  </item>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>额度哨兵 · Codex 重置追踪</title>
  <link>https://PLACEHOLDER-DOMAIN.example.com</link>
  <description>追踪 @thsottiaux 的已核验 Codex 重置公告，确认后飞书群第一时间推送。</description>
  <language>zh-CN</language>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
