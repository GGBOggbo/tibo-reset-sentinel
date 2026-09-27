import { confirmedResets } from "./events";
import { findNewEvents, mapRemote, validateRemoteEvents } from "./diff";
import { validateEvents } from "./schema";
import type { SourceResult } from "./sources";
import type { EventsFile } from "./types";

// Shared by the read-only live page and the archive writer, so classification,
// corrections and deduplication cannot diverge between the two paths.
export function mergeSourceEvents(archive: EventsFile, result: SourceResult, now = new Date()) {
  const { events: remote, source, unconfirmedUrls = [] } = result;
  const errors = [...validateEvents(archive, now), ...validateRemoteEvents(remote, now)];
  if (errors.length) throw new Error(`记录未通过校验：${errors.join("；")}`);
  const knownUrls = new Set(archive.events.map(e => e.tweetUrl));
  if (source === "tibo-public-api" && archive.events.length && !remote.some(e => knownUrls.has(e.tweet_url)))
    throw new Error("公开 API 最近记录与历史没有交集，可能存在采集缺口，需要核对");
  let corrected = false;
  const events = archive.events.map((event) => {
    if (event.source !== "resetrelay-rss") return event;
    if (unconfirmedUrls.includes(event.tweetUrl) && event.type !== "normal") {
      corrected = true;
      return { ...event, type: "normal" as const, verified: false,
        title: `待确认 · ${event.title}`, summary: "来源已更正为待确认消息，不计入已完成重置。请查看原帖。" };
    }
    const confirmed = remote.find(r => r.tweet_url === event.tweetUrl);
    if (confirmed && event.type === "normal") {
      corrected = true;
      return { ...mapRemote(confirmed, confirmedResets(archive.events).length + 1, source), id: event.id, announcedAt: event.announcedAt };
    }
    return event;
  });
  const added = findNewEvents(events, remote).sort((a, b) => a.announced_at.localeCompare(b.announced_at));
  let seq = confirmedResets(events).length;
  for (const event of added) events.push(mapRemote(event, ++seq, source));
  events.sort((a, b) => a.announcedAt.localeCompare(b.announcedAt));
  const file: EventsFile = { ...archive, events };
  const mergedErrors = validateEvents(file, now);
  if (mergedErrors.length) throw new Error(`合并结果未通过校验：${mergedErrors.join("；")}`);
  return { file, added, corrected };
}
