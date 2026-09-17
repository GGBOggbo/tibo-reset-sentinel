import type { EventsFile, ResetEvent } from "./types";

const TYPES = new Set(["reset", "banked", "capacity", "normal"]);
const SOURCES = new Set(["codex-resets-poll", "manual"]);

export function validateEvents(file: EventsFile, now: Date = new Date()): string[] {
  const errors: string[] = [];
  if (file.version !== 1) errors.push("version 必须为 1");
  if (!Array.isArray(file.events)) return [...errors, "events 必须为数组"];
  const seen = new Set<string>();
  file.events.forEach((e: ResetEvent, i) => {
    const at = `events[${i}]`;
    if (!e.id || seen.has(e.id)) errors.push(`${at}: id 缺失或重复`);
    seen.add(e.id);
    if (!TYPES.has(e.type)) errors.push(`${at}: type 非法（${e.type}）`);
    if (!SOURCES.has(e.source)) errors.push(`${at}: source 非法（${e.source}）`);
    if (Number.isNaN(Date.parse(e.announcedAt))) errors.push(`${at}: announcedAt 不可解析`);
    if (Date.parse(e.announcedAt) > now.getTime() + 5 * 60_000)
      errors.push(`${at}: announcedAt 不得晚于当前时间（+5 分钟容忍）`);
    if (!/^https:\/\/x\.com\/thsottiaux\/status\/\d+$/.test(e.tweetUrl))
      errors.push(`${at}: tweetUrl 必须形如 https://x.com/thsottiaux/status/<id>`);
    if (!e.title?.trim()) errors.push(`${at}: title 不能为空`);
  });
  return errors;
}
