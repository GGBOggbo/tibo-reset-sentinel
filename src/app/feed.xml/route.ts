import { confirmedResets } from "@/lib/events";
import { loadLiveSnapshot } from "@/lib/live";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tibo.c-quinn.xyz";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const snapshot = await loadLiveSnapshot();
  const items = confirmedResets(snapshot.events)
    .slice(-20)
    .reverse()
    .map((e) => `  <item>
    <title>${esc(e.title)}</title>
    <link>${esc(e.tweetUrl)}</link>
    <guid isPermaLink="true">${esc(e.tweetUrl)}</guid>
    <pubDate>${new Date(e.announcedAt).toUTCString()}</pubDate>
    <description>${esc(e.summary)}</description>
  </item>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Tibo重置哨兵 · Codex 重置追踪</title>
  <link>${esc(SITE_URL)}</link>
  <description>追踪 @thsottiaux 的公开 Codex 重置公告与重置卡记录，每条保留原帖链接。</description>
  <language>zh-CN</language>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" } });
}
