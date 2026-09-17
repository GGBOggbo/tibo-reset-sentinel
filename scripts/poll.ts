import fs from "node:fs";
import path from "node:path";
import { loadEvents, loadHealth, confirmedResets } from "../src/lib/events";
import { findNewEvents, mapRemote, type RemoteEvent } from "../src/lib/diff";
import { sendResetAlert, sendOpsAlert } from "../src/lib/notify";

const API = "https://codex-resets.com/api/resets";
const DATA = path.join(process.cwd(), "data");
const DAY_MS = 86_400_000;
const DRY = process.argv.includes("--dry-run");
const STALE_H = 26; // 超过即判定"降级"

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

async function main() {
  let persisted = false; // 本轮是否已写入过 events.json（部分成功也要提交，避免下轮重复推送）
  try {
    const remote = await fetchRemote();
    const local = loadEvents();
    const fresh = findNewEvents(local.events, remote)
      .filter((r) => r.reset_type === "regular" || r.reset_type === "banked")
      .sort((a, b) => a.announced_at.localeCompare(b.announced_at));

    if (fresh.length > 0) {
      let seq = confirmedResets(local.events).length;
      for (const r of fresh) {
        seq += 1;
        const mapped = mapRemote(r, seq);
        if (!DRY) await sendResetAlert({ seq, type: mapped.type as "reset" | "banked",
          announcedAt: mapped.announcedAt, tweetUrl: mapped.tweetUrl });
        // 推送成功才落盘：中途失败时，已推送的事件已安全落盘，下轮 diff 只会发现未推送的
        local.events.push(mapped);
        local.events.sort((a, b) => a.announcedAt.localeCompare(b.announcedAt));
        if (!DRY) {
          fs.writeFileSync(path.join(DATA, "events.json"), JSON.stringify(local, null, 2) + "\n");
          persisted = true;
        }
      }
      if (!DRY) await sendOpsAlert(`发现 ${fresh.length} 条新重置事件（最新第 ${seq} 次），已推送订阅群并更新数据，待部署生效。`);
      console.log(`新事件 ${fresh.length} 条`);
      setOutput("changed", "1");
      setOutput("changedCount", String(fresh.length));
    } else {
      console.log("无新事件");
      setOutput("changed", "0");
    }
    if (!DRY) fs.writeFileSync(path.join(DATA, "health.json"),
      JSON.stringify({ lastSuccessAt: new Date().toISOString() }, null, 2) + "\n");
  } catch (err) {
    console.error("本轮抓取/推送中断：", err);
    const staleMs = Date.now() - Date.parse(loadHealth().lastSuccessAt);
    if (staleMs > STALE_H * 3_600_000 && !DRY)
      await sendOpsAlert(`信号源连续失败已超 ${Math.floor(staleMs / DAY_MS)} 天，页面已降级"人工核验中"。请检查 codex-resets.com 接口并改用 pnpm record 人工录入。`).catch(() => {});
    setOutput("changed", persisted ? "1" : "0"); // 部分成功也提交已推送的事件
  }
}

main();
