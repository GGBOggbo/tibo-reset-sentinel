import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fetchRemoteEvents } from "../src/lib/sources";
import { refreshSnapshot } from "../src/lib/snapshot";
import { loadEvents, loadHealth } from "../src/lib/events";
import { runPoll } from "./poll";

async function main() {
  // 真正请求来源一次；仅在临时目录构造缺少最新条目的旧快照，不删除生产历史。
  const live = await fetchRemoteEvents();
  assert.equal(live.warning, null, "来源必须正常，不能拿过期 RSS 通过检查");
  const newest = live.events.slice().sort((a, b) => b.announced_at.localeCompare(a.announced_at))[0];
  assert.ok(newest);
  const archive = loadEvents();
  const earlier = { ...archive, events: archive.events.filter(e => e.tweetUrl !== newest.tweet_url && e.id !== newest.tweet_id) };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sentinel-live-recovery-"));
  try {
    fs.writeFileSync(path.join(dir, "events.json"), JSON.stringify(earlier));
    fs.writeFileSync(path.join(dir, "health.json"), JSON.stringify(loadHealth()));
    const snapshot = await refreshSnapshot(earlier, loadHealth(), async () => live);
    assert.ok(snapshot.events.some(e => e.tweetUrl === newest.tweet_url), "实时页面必须补齐缺少的最新公告");
    const first = await runPoll({ dataDir: dir, fetchRemote: async () => live });
    assert.equal(first.failed, false); assert.equal(first.degraded, false); assert.ok(first.changedCount >= 1);
    const recovered = JSON.parse(fs.readFileSync(path.join(dir, "events.json"), "utf8"));
    for (const event of earlier.events) assert.deepEqual(recovered.events.find((e: { id: string }) => e.id === event.id), event);
    const second = await runPoll({ dataDir: dir, fetchRemote: async () => live });
    assert.equal(second.failed, false); assert.equal(second.changedCount, 0);
    console.log(JSON.stringify({ verification: "真实来源 + 生产同环境隔离恢复", source: live.source,
      sourceFetchedAt: live.sourceFetchedAt, recoveredId: newest.tweet_id,
      pageSeesNewRecordWithoutDeployment: true, persisted: true, originalHistoryPreserved: true, duplicateOnRerun: false }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
