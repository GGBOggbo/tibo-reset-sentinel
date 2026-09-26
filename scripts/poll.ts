import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { confirmedResets } from "../src/lib/events";
import { findNewEvents, mapRemote, validateRemoteEvents } from "../src/lib/diff";
import { fetchRemoteEvents, type SourceResult } from "../src/lib/sources";
import { validateEvents } from "../src/lib/schema";
import type { EventsFile, HealthFile } from "../src/lib/types";

const HEARTBEAT_H = 12;
interface PollResult { failed: boolean; changed: boolean; changedCount: number }

export async function runPoll({
  dataDir = path.join(process.cwd(), "data"), dryRun = false,
  fetchRemote = fetchRemoteEvents, now = new Date(),
}: {
  dataDir?: string; dryRun?: boolean;
  fetchRemote?: () => Promise<SourceResult>; now?: Date;
} = {}): Promise<PollResult> {
  const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
  const write = (name: string, value: unknown) => {
    const target = path.join(dataDir, name);
    fs.writeFileSync(`${target}.tmp`, JSON.stringify(value, null, 2) + "\n");
    fs.renameSync(`${target}.tmp`, target);
  };
  let changed = false;
  let changedCount = 0;
  try {
    const { events: remote, source, warning, unconfirmedUrls = [] } = await fetchRemote();
    const remoteErrors = validateRemoteEvents(remote, now);
    if (remoteErrors.length) throw new Error(`远端数据未通过校验：${remoteErrors.join("；")}`);
    const local: EventsFile = read("events.json");
    const localErrors = validateEvents(local, now);
    if (localErrors.length) throw new Error(`本地历史未通过校验：${localErrors.join("；")}`);
    const health: HealthFile = read("health.json");

    // 备用源的更正只修改来自该源的记录；保留原帖，停止把预告计入重置。
    let corrected = false;
    local.events = local.events.map((event) => {
      if (event.source !== "resetrelay-rss") return event;
      if (unconfirmedUrls.includes(event.tweetUrl) && event.type !== "normal") {
        corrected = true;
        return { ...event, type: "normal", verified: false,
          title: `待确认 · ${event.title}`, summary: "来源已更正为待确认消息，不计入已完成重置。请查看原帖。" };
      }
      const confirmed = remote.find((r) => r.tweet_url === event.tweetUrl);
      if (confirmed && event.type === "normal") {
        corrected = true;
        return { ...mapRemote(confirmed, confirmedResets(local.events).length + 1, source), id: event.id, announcedAt: event.announcedAt };
      }
      return event;
    });
    const fresh = findNewEvents(local.events, remote).sort((a, b) => a.announced_at.localeCompare(b.announced_at));
    let seq = confirmedResets(local.events).length;
    for (const event of fresh) local.events.push(mapRemote(event, ++seq, source));
    local.events.sort((a, b) => a.announcedAt.localeCompare(b.announcedAt));
    const errors = validateEvents(local, now);
    if (errors.length) throw new Error(`新数据未通过校验，拒绝落盘：${errors.join("；")}`);
    changedCount = fresh.length;
    if (fresh.length || corrected) {
      if (!dryRun) { write("events.json", local); changed = true; }
    }
    console.log(`来源 ${source}；新事件 ${fresh.length} 条${dryRun ? "（dry-run，未落盘）" : ""}${corrected ? "；已处理来源更正" : ""}`);
    if (warning) console.warn(warning);

    if (!dryRun) {
      const committedAt = Date.parse(health.lastSuccessAt);
      const heartbeatDue = !Number.isFinite(committedAt) || now.getTime() - committedAt >= HEARTBEAT_H * 3_600_000;
      const healthChanged = !!health.lastFailureAt || !!health.lastError
        || health.lastSource !== source || (health.sourceWarning ?? null) !== warning;
      if (heartbeatDue || healthChanged || changed) {
        write("health.json", { lastSuccessAt: now.toISOString(), lastFailureAt: null, lastError: null,
          lastSource: source, sourceWarning: warning } satisfies HealthFile);
        changed = true;
      }
    }
    return { failed: false, changed, changedCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("本轮抓取中断：", message);
    if (!dryRun) {
      let health: HealthFile = { lastSuccessAt: "", lastFailureAt: null, lastError: null };
      try { health = read("health.json"); } catch { /* 保留可读的失败状态 */ }
      write("health.json", { ...health, lastFailureAt: now.toISOString(), lastError: message.slice(0, 500) });
      changed = true;
    }
    return { failed: true, changed, changedCount };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPoll({ dryRun: process.argv.includes("--dry-run") }).then((result) => {
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
      `failed=${result.failed ? "1" : "0"}\nchanged=${result.changed ? "1" : "0"}\nchangedCount=${result.changedCount}\n`);
    if (result.failed) process.exitCode = 1;
  }).catch((err) => { console.error(err); process.exitCode = 1; });
}
