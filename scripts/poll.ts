import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRemoteEvents, type SourceResult } from "../src/lib/sources";
import { mergeSourceEvents } from "../src/lib/sync";
import type { EventsFile, HealthFile } from "../src/lib/types";

const HEARTBEAT_H = 12;
interface PollResult { failed: boolean; changed: boolean; changedCount: number; degraded?: boolean }

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
    const result = await fetchRemote();
    const { source, warning, sourceFetchedAt } = result;
    const { file: local, added: fresh, corrected } = mergeSourceEvents(read("events.json") as EventsFile, result, now);
    const health: HealthFile = read("health.json");
    changedCount = fresh.length;
    if (fresh.length || corrected) {
      if (!dryRun) { write("events.json", local); changed = true; }
    }
    console.log(`来源 ${source}；新事件 ${fresh.length} 条${dryRun ? "（dry-run，未落盘）" : ""}${corrected ? "；已处理来源更正" : ""}`);
    for (const event of fresh) console.log(`新增公告 ${event.tweet_id} · ${event.reset_type} · ${event.announced_at}`);
    if (warning) console.warn(warning);

    if (!dryRun) {
      const committedAt = Date.parse(health.lastSuccessAt);
      const heartbeatDue = !Number.isFinite(committedAt) || now.getTime() - committedAt >= HEARTBEAT_H * 3_600_000;
      const healthChanged = !!health.lastFailureAt || !!health.lastError
        || health.lastSource !== source || (health.sourceWarning ?? null) !== warning;
      if (heartbeatDue || healthChanged || changed) {
        write("health.json", { lastSuccessAt: now.toISOString(), lastFailureAt: null, lastError: null,
          lastSource: source, sourceWarning: warning, sourceFetchedAt } satisfies HealthFile);
        changed = true;
      }
    }
    // 能读取备用 RSS 不等于知道公告没有遗漏。保存可用数据，同时报告降级。
    return { failed: false, changed, changedCount, degraded: !!warning };
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
      `failed=${result.failed || result.degraded ? "1" : "0"}\nchanged=${result.changed ? "1" : "0"}\nchangedCount=${result.changedCount}\n`);
    if (result.failed || result.degraded) process.exitCode = 1;
  }).catch((err) => { console.error(err); process.exitCode = 1; });
}
