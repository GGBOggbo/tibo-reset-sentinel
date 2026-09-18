import type { ResetEvent } from "./types";

export interface RemoteEvent {
  tweet_id: string;
  tweet_url: string;
  text: string;
  announced_at: string;
  reset_type: "regular" | "banked";
}

const TWEET_URL = /^https:\/\/x\.com\/thsottiaux\/status\/\d+$/;

export function validateRemoteEvents(events: RemoteEvent[], now: Date = new Date()): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  events.forEach((e, i) => {
    const at = `remote[${i}]`;
    if (!e || typeof e !== "object") { errors.push(`${at}: 条目必须为对象`); return; }
    if (!e.tweet_id?.trim()) errors.push(`${at}: tweet_id 缺失`);
    if (seen.has(e.tweet_id)) errors.push(`${at}: tweet_id 重复（${e.tweet_id}）`);
    else seen.add(e.tweet_id);
    if (!TWEET_URL.test(e.tweet_url)) errors.push(`${at}: tweet_url 非法（${e.tweet_url}）`);
    if (typeof e.text !== "string") errors.push(`${at}: text 必须为字符串`);
    if (e.reset_type !== "regular" && e.reset_type !== "banked") errors.push(`${at}: reset_type 非法（${e.reset_type}）`);
    if (Number.isNaN(Date.parse(e.announced_at))) errors.push(`${at}: announced_at 不可解析（${e.announced_at}）`);
    if (!Number.isNaN(Date.parse(e.announced_at)) && Date.parse(e.announced_at) > now.getTime() + 5 * 60_000)
      errors.push(`${at}: announced_at 不得晚于当前时间（+5 分钟容忍）`);
  });
  return errors;
}

export function mapRemote(e: RemoteEvent, seq: number): ResetEvent {
  return {
    id: e.tweet_id,
    type: e.reset_type === "banked" ? "banked" : "reset",
    title: `第 ${seq} 次重置（${e.reset_type === "banked" ? "重置卡" : "常规"}）`,
    summary: e.text.slice(0, 120),
    announcedAt: e.announced_at,
    tweetUrl: e.tweet_url,
    verified: true,
    source: "codex-resets-poll",
  };
}

export function findNewEvents(local: ResetEvent[], remote: RemoteEvent[]): RemoteEvent[] {
  const known = new Set(local.map((e) => e.id));
  return remote.filter((r) => !known.has(r.tweet_id));
}
