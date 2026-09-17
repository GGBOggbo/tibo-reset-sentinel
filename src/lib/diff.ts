import type { ResetEvent } from "./types";

export interface RemoteEvent {
  tweet_id: string;
  tweet_url: string;
  text: string;
  announced_at: string;
  reset_type: "regular" | "banked";
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
