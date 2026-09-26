import { XMLParser, XMLValidator } from "fast-xml-parser";
import { validateRemoteEvents, type RemoteEvent } from "./diff";

export const PRIMARY_URL = "https://codex-resets.com/api/resets";
export const FALLBACK_URL = "https://www.resetrelay.com/codex/feed.xml";
export type PollSource = "codex-resets-poll" | "resetrelay-rss";
export interface SourceResult {
  events: RemoteEvent[];
  source: PollSource;
  warning: string | null;
  unconfirmedUrls?: string[];
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
    const res = await fetcher(url, { signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "edu-shaobing-sentinel/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  };
  let primaryError: string;
  try {
    const body = await (await request(PRIMARY_URL)).json();
    if (!Array.isArray(body?.events) || !body.events.length) throw new Error("API 结构异常：缺少历史事件");
    return { events: checked(body.events), source: "codex-resets-poll", warning: null };
  } catch (err) {
    primaryError = err instanceof Error ? err.message : String(err);
  }
  // 使用独立站点公开提供的 RSS，不代理或绕过主源的访问限制。
  try {
    const feed = parseResetRelayFeed(await (await request(FALLBACK_URL)).text());
    return { ...feed, source: "resetrelay-rss", warning: `主源不可用（${primaryError}），本轮使用 Reset Relay RSS` };
  } catch (err) {
    throw new Error(`主源失败：${primaryError}；备用 RSS 失败：${err instanceof Error ? err.message : String(err)}`);
  }
}
