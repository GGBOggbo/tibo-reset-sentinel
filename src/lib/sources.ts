import { XMLParser, XMLValidator } from "fast-xml-parser";
import { validateRemoteEvents, type RemoteEvent } from "./diff";

// https://codex-resets.com/api/docs publishes v1 for external integrations.
// /api/resets is the site's internal endpoint and rejects GitHub's requests.
export const PRIMARY_URL = "https://codex-resets.com/api/v1/resets?limit=100";
export const TIBO_URL = "https://tibo.cc/api/v1/resets?limit=100";
export const FALLBACK_URL = "https://www.resetrelay.com/codex/feed.xml";
export type PollSource = "tibo-public-api" | "codex-resets-poll" | "resetrelay-rss";
export interface SourceResult {
  events: RemoteEvent[];
  source: PollSource;
  warning: string | null;
  unconfirmedUrls?: string[];
  sourceFetchedAt?: string;
}

// This provider explicitly publishes a read-only API with cache freshness metadata:
// https://tibo.cc/guide/api . HTTP 200 alone is not sufficient.
export function parseTiboResponse(input: unknown, now = Date.now()): SourceResult {
  const body = input as { data?: Array<{ id: string; text: string; announced_at: string; reset_type: RemoteEvent["reset_type"];
    source?: { type: string; author?: string; url?: string } }>;
    stale?: boolean; upstream_status?: string; error?: unknown; is_prediction?: boolean;
    fetched_at?: string; upstream_generated_at?: string; fresh_until?: string;
    pagination?: { returned?: number; has_more?: boolean }; source_url?: string };
  if (!body || !Array.isArray(body.data) || !body.data.length || body.stale !== false
    || body.upstream_status !== "ok" || body.error !== null || body.is_prediction !== false
    || body.source_url?.replace(/\/$/, "") !== "https://codex-resets.com"
    || body.pagination?.returned !== body.data.length || body.pagination.has_more !== false)
    throw new Error("TIBO 公开 API 数据缺失、过期或状态异常");
  const fetched = Date.parse(body.fetched_at ?? "");
  const generated = Date.parse(body.upstream_generated_at ?? "");
  const until = Date.parse(body.fresh_until ?? "");
  if (!Number.isFinite(fetched) || !Number.isFinite(generated) || !Number.isFinite(until)
    || fetched > now + 300_000 || generated > now + 300_000 || until <= now
    || now - fetched > 10 * 60_000 || now - generated > 15 * 60_000)
    throw new Error("TIBO 公开 API 缓存已过期，拒绝当作最新数据");
  const events = body.data.map((entry) => {
    if (!entry || !entry.source || !["x_post", "observed"].includes(entry.source.type)
      || (entry.source.type === "x_post" && entry.source.author !== "thsottiaux"))
      throw new Error("TIBO 公告来源非法");
    return { tweet_id: entry.id, tweet_url: entry.source.url!, text: entry.text,
      announced_at: entry.announced_at, reset_type: entry.reset_type };
  });
  return { events: checked(events), source: "tibo-public-api", warning: null, sourceFetchedAt: body.fetched_at };
}

function checked(events: RemoteEvent[]): RemoteEvent[] {
  const errors = validateRemoteEvents(events);
  if (errors.length) throw new Error(`来源数据未通过校验：${errors.join("；")}`);
  return events;
}

export function parseResetRelayFeed(xml: string): Pick<SourceResult, "events" | "unconfirmedUrls"> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
    throw new Error("备用 RSS 不是有效的 XML");
  const channel = new XMLParser({ parseTagValue: false }).parse(xml)?.rss?.channel;
  if (!channel || channel.link !== "https://www.resetrelay.com/codex" || !channel.item)
    throw new Error("备用 RSS 结构异常：缺少 Codex 公告");
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];
  const latest = new Map<string, { title: string; link: string; description: string; time: number }>();
  for (const item of items) {
    if (typeof item.link !== "string" || !/^https:\/\/x\.com\/thsottiaux\/status\/\d+$/.test(item.link)
      || typeof item.title !== "string" || typeof item.description !== "string" || typeof item.pubDate !== "string")
      throw new Error("备用 RSS 公告字段或原帖地址非法");
    const time = Date.parse(item.pubDate);
    if (!Number.isFinite(time) || time > Date.now() + 300_000) throw new Error("备用 RSS 公告时间非法");
    const previous = latest.get(item.link);
    // 同一原帖可能有更正消息；必须先选最新状态，再决定是否计入重置。
    if (!previous || time > previous.time || (time === previous.time && item.title.includes("更正")))
      latest.set(item.link, { ...item, time });
  }
  const events: RemoteEvent[] = [];
  const unconfirmedUrls: string[] = [];
  for (const item of latest.values()) {
    if (item.description.includes("状态：待确认消息") || /状态：[^。]*(撤回|更正|取消)/.test(item.description)) {
      unconfirmedUrls.push(item.link);
      continue;
    }
    const banked = item.description.includes("状态：重置次数公告");
    const regular = item.description.includes("状态：已确认的公开额度重置");
    if (!banked && !regular) throw new Error("备用 RSS 出现未知公告状态，拒绝猜测重置类型");
    events.push({
      tweet_id: item.link.split("/").at(-1)!, tweet_url: item.link,
      text: item.description, title: item.title,
      announced_at: new Date(item.time).toISOString(), reset_type: banked ? "banked" : "regular",
    });
  }
  return { events: checked(events), unconfirmedUrls };
}

export async function fetchRemoteEvents(fetcher: typeof fetch = fetch): Promise<SourceResult> {
  const request = async (url: string) => {
    const res = await fetcher(url, { signal: AbortSignal.timeout(10_000),
      cache: "no-store", headers: { "user-agent": "edu-shaobing-sentinel/1.0", accept: "application/json, application/rss+xml;q=0.9" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}${res.headers.get("cf-mitigated") === "challenge" ? "（Cloudflare 机器人验证）" : ""}`);
    return res;
  };
  let publicApiError: string;
  try {
    return parseTiboResponse(await (await request(TIBO_URL)).json());
  } catch (err) {
    publicApiError = err instanceof Error ? err.message : String(err);
  }
  let primaryError: string;
  try {
    const events: RemoteEvent[] = [];
    const cursors = new Set<string>();
    let url = PRIMARY_URL;
    for (;;) {
      const body = await (await request(url)).json();
      if (!Array.isArray(body?.data) || body.meta?.api_version !== "v1"
        || typeof body.pagination?.has_more !== "boolean")
        throw new Error("公开 API v1 结构异常");
      for (const entry of body.data) {
        if (!entry || !entry.source || (entry.source.type === "x_post" && entry.source.author !== "thsottiaux"))
          throw new Error("公开 API 公告来源异常");
        events.push({ tweet_id: entry.id, tweet_url: entry.source.url, text: entry.text,
          announced_at: entry.announced_at, reset_type: entry.reset_type });
      }
      if (!body.pagination.has_more) break;
      const cursor = body.pagination.next_cursor;
      if (typeof cursor !== "string" || !cursor || cursors.has(cursor) || cursors.size >= 100)
        throw new Error("公开 API 分页游标异常");
      cursors.add(cursor);
      const next = new URL(PRIMARY_URL);
      next.searchParams.set("cursor", cursor);
      url = next.toString();
    }
    if (!events.length) throw new Error("公开 API 未返回历史事件");
    return { events: checked(events), source: "codex-resets-poll", warning: null };
  } catch (err) {
    primaryError = `TIBO: ${publicApiError}；Codex Resets: ${err instanceof Error ? err.message : String(err)}`;
  }
  // 使用独立站点公开提供的 RSS，不代理或绕过主源的访问限制。
  try {
    const feed = parseResetRelayFeed(await (await request(FALLBACK_URL)).text());
    return { ...feed, source: "resetrelay-rss", warning: `主源不可用（${primaryError}），本轮使用 Reset Relay RSS` };
  } catch (err) {
    throw new Error(`主源失败：${primaryError}；备用 RSS 失败：${err instanceof Error ? err.message : String(err)}`);
  }
}
