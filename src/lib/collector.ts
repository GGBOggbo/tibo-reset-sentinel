import { fetchRemoteEvents, type SourceResult } from "./sources";
import { validateRemoteEvents } from "./diff";

export async function fetchPollingSource(url?: string, fetcher: typeof fetch = fetch): Promise<SourceResult> {
  if (!url) return fetchRemoteEvents(fetcher);
  const response = await fetcher(url, { signal: AbortSignal.timeout(60_000), cache: "no-store" });
  if (!response.ok) throw new Error(`本站采集接口 HTTP ${response.status}`);
  const body = await response.json();
  const fetchedAt = Date.parse(body?.fetchedAt);
  if (!Array.isArray(body?.events) || !["codex-resets-poll", "resetrelay-rss"].includes(body.source)
    || !(body.warning === null || typeof body.warning === "string")
    || !Number.isFinite(fetchedAt) || fetchedAt > Date.now() + 300_000 || Date.now() - fetchedAt > 10 * 60_000)
    throw new Error("本站采集结果异常或已过期，拒绝把旧快照视为成功采集");
  if (body.source === "resetrelay-rss" && !body.warning)
    throw new Error("备用来源缺少降级说明");
  if (body.unconfirmedUrls !== undefined && (!Array.isArray(body.unconfirmedUrls)
    || !body.unconfirmedUrls.every((url: unknown) => typeof url === "string" && /^https:\/\/x\.com\/thsottiaux\/status\/\d+$/.test(url))))
    throw new Error("本站采集结果的更正原帖地址异常");
  const errors = validateRemoteEvents(body.events);
  if (errors.length) throw new Error(`本站采集结果未通过校验：${errors.join("；")}`);
  return { events: body.events, source: body.source, warning: body.warning, unconfirmedUrls: body.unconfirmedUrls };
}
