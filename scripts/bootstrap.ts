import fs from "node:fs";
import path from "node:path";
import type { EventsFile, ResetEvent } from "../src/lib/types";

const API = "https://codex-resets.com/api/resets";
const DATA = path.join(process.cwd(), "data");

interface RemoteEvent {
  tweet_id: string;
  tweet_url: string;
  text: string;
  announced_at: string;
  reset_type: "regular" | "banked";
}

async function main() {
  const res = await fetch(API, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const { events: remote } = (await res.json()) as { events: RemoteEvent[] };
  const sorted = [...remote].sort((a, b) => a.announced_at.localeCompare(b.announced_at));
  const events: ResetEvent[] = sorted.map((e, i) => ({
    id: e.tweet_id,
    type: e.reset_type === "banked" ? "banked" : "reset",
    title: `第 ${i + 1} 次重置（${e.reset_type === "banked" ? "重置卡" : "常规"}）`, // 待人工/AI 润色
    summary: e.text.slice(0, 120),
    announcedAt: e.announced_at,
    tweetUrl: e.tweet_url,
    verified: true,
    source: "codex-resets-poll",
  }));
  const file: EventsFile = { version: 1, events };
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, "events.json"), JSON.stringify(file, null, 2) + "\n");
  fs.writeFileSync(path.join(DATA, "health.json"),
    JSON.stringify({ lastSuccessAt: new Date().toISOString() }, null, 2) + "\n");
  // 待译清单：供批量撰写中文标题/摘要
  const rows = sorted.map((e, i) =>
    `| ${i + 1} | ${e.tweet_id} | ${e.announced_at} | ${e.reset_type} | ${e.text.replace(/\|/g, "/").slice(0, 100)} |`)
    .join("\n");
  fs.mkdirSync(path.join(process.cwd(), "docs"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "docs/title-review.md"),
    `# 标题/摘要润色清单（bootstrap 生成）\n\n| # | tweet_id | 时间 | 类型 | 原文 |\n|---|---|---|---|---|\n${rows}\n`);
  console.log(`已写入 ${events.length} 条事件与待译清单`);
}

main().catch((e) => { console.error(e); process.exit(1); });
