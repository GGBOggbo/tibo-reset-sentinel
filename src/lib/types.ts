export type ResetEventType = "reset" | "banked" | "capacity" | "normal";
export type EventSource = "codex-resets-poll" | "manual";

export interface ResetEvent {
  id: string;              // 上游 tweet_id（可能为 observed-* 合成值），去重键
  type: ResetEventType;
  title: string;
  summary: string;
  announcedAt: string;     // ISO 8601 UTC
  tweetUrl: string;
  verified: boolean;
  source: EventSource;
}

export interface EventsFile {
  version: 1;
  events: ResetEvent[];    // announcedAt 升序
}

export interface DerivedStats {
  totalResets: number;
  avgIntervalDays: number;
  longestIntervalDays: number;
  daysSinceLastReset: number;
  lastResetAt: string | null;
}

export interface HealthFile {
  lastSuccessAt: string;   // ISO，抓取最后成功时间
  lastFailureAt: string | null;
  lastError: string | null;
}
