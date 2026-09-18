import fs from "node:fs";
import path from "node:path";
import { loadEvents } from "../src/lib/events";
import { validateEvents } from "../src/lib/schema";
import type { EventsFile, ResetEvent } from "../src/lib/types";

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    console.error(`缺少 --${name}`); process.exit(1);
  }
  return process.argv[i + 1]!;
}

const tweetUrl = arg("tweet");
const id = tweetUrl.match(/status\/(\d+)$/)?.[1];
if (!id) { console.error("tweet URL 必须形如 https://x.com/thsottiaux/status/<id>"); process.exit(1); }

const type = arg("type") as ResetEvent["type"];
if (!["reset", "banked", "capacity", "normal"].includes(type)) {
  console.error("--type 必须是 reset、banked、capacity 或 normal"); process.exit(1);
}

const event: ResetEvent = {
  id,
  type,
  title: arg("title"),
  summary: process.argv.includes("--summary") ? arg("summary") : "",
  announcedAt: arg("at"),
  tweetUrl,
  verified: true,
  source: "manual",
};
if (Number.isNaN(Date.parse(event.announcedAt))) { console.error("--at 必须是 ISO 时间"); process.exit(1); }

const file: EventsFile = loadEvents();
file.events.push(event);
file.events.sort((a, b) => a.announcedAt.localeCompare(b.announcedAt));
const errors = validateEvents(file);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
fs.writeFileSync(path.join(process.cwd(), "data/events.json"), JSON.stringify(file, null, 2) + "\n");
console.log(`已录入 ${id}，共 ${file.events.length} 条`);
