import fs from "node:fs";
import path from "node:path";
import { loadEvents, loadHealth, confirmedResets } from "../src/lib/events";
import { findNewEvents, mapRemote, validateRemoteEvents, type RemoteEvent } from "../src/lib/diff";
import { validateEvents } from "../src/lib/schema";
import type { HealthFile } from "../src/lib/types";

const API = "https://codex-resets.com/api/resets";
const DATA = path.join(process.cwd(), "data");
const DRY = process.argv.includes("--dry-run");
const HEARTBEAT_H = 12;

async function fetchRemote(): Promise<RemoteEvent[]> {
  const res = await fetch(API, { signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "edu-shaobing-sentinel/1.0" } });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  const body = (await res.json()) as { events?: RemoteEvent[] };
  if (!Array.isArray(body.events)) throw new Error("API 结构异常：缺少 events 数组");
  return body.events;
}

function setOutput(key: string, value: string) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  fs.appendFileSync(out, `${key}=${value}\n`);
}

function writeData(name: string, value: unknown) {
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(value, null, 2) + "\n");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main() {
  let persisted = false;
  try {
    const remote = await fetchRemote();
    const remoteErrors = validateRemoteEvents(remote);
    if (remoteErrors.length) throw new Error(`远端数据未通过校验，拒绝处理：\n${remoteErrors.join("\n")}`);

    const local = loadEvents();
    const health = loadHealth();
    const fresh = findNewEvents(local.events, remote)
      .filter((r) => r.reset_type === "regular" || r.reset_type === "banked")
      .sort((a, b) => a.announced_at.localeCompare(b.announced_at));

    let changed = "0";
    if (fresh.length > 0) {
      let seq = confirmedResets(local.events).length;
      for (const r of fresh) {
        seq += 1;
        const mapped = mapRemote(r, seq);
        const candidate = {
          ...local,
          events: [...local.events, mapped].sort((a, b) => a.announcedAt.localeCompare(b.announcedAt)),
        };
        const errors = validateEvents(candidate);
        if (errors.length) throw new Error(`新数据未通过校验，拒绝落盘：\n${errors.join("\n")}`);
        if (!DRY) {
          local.events = candidate.events;
          writeData("events.json", local);
          persisted = true;
        }
      }
      console.log(`新事件 ${fresh.length} 条${DRY ? "（dry-run，未落盘）" : "，已更新历史数据"}`);
      setOutput("changedCount", String(fresh.length));
      changed = "1";
    } else {
      console.log("无新事件");
    }

    if (!DRY) {
      const nowIso = new Date().toISOString();
      const committedAt = Date.parse(health.lastSuccessAt);
      const heartbeatDue = Number.isNaN(committedAt) || Date.now() - committedAt > HEARTBEAT_H * 3_600_000;
      const healthChanged = health.lastFailureAt !== null || health.lastError !== null;
      const nextHealth: HealthFile = { lastSuccessAt: nowIso, lastFailureAt: null, lastError: null };
      if (heartbeatDue || healthChanged || persisted) {
        writeData("health.json", nextHealth);
        persisted = true;
      }
      if (heartbeatDue || healthChanged) changed = "1";
    }
    setOutput("failed", "0");
    setOutput("changed", DRY ? "0" : changed);
  } catch (err) {
    const message = errorMessage(err);
    console.error("本轮抓取中断：", message);
    if (!DRY) {
      let health: HealthFile = { lastSuccessAt: "", lastFailureAt: null, lastError: null };
      try { health = loadHealth(); } catch { /* health 文件损坏时仍尝试写入可读的失败状态 */ }
      writeData("health.json", {
        lastSuccessAt: health.lastSuccessAt,
        lastFailureAt: new Date().toISOString(),
        lastError: message.slice(0, 500),
      } satisfies HealthFile);
      persisted = true;
    }
    setOutput("failed", "1");
    setOutput("changed", DRY ? "0" : persisted ? "1" : "0");
  }
}

main();
