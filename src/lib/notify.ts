const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postLarkRaw(webhook: string, body: unknown): Promise<void> {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({ code: -1 }))) as { code: number };
  if (!res.ok || data.code !== 0) throw new Error(`飞书 webhook 失败: HTTP ${res.status} code ${data.code}`);
}

export async function postLark(webhook: string, text: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try { return await postLarkRaw(webhook, { msg_type: "text", content: { text } }); }
    catch (e) { if (i === retries - 1) throw e; await sleep(1000 * 2 ** i); }
  }
}

const bj = (iso: string) =>
  new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export interface ResetAlertInput {
  seq: number;
  type: "reset" | "banked";
  announcedAt: string;
  tweetUrl: string;
}

export async function sendResetAlert(e: ResetAlertInput): Promise<void> {
  const webhook = process.env.LARK_SUBSCRIBE_WEBHOOK;
  if (!webhook) { console.warn("LARK_SUBSCRIBE_WEBHOOK 未配置，跳过推送"); return; }
  const typeName = e.type === "banked" ? "重置卡" : "常规重置";
  await postLark(webhook,
    `🚨 Codex 重置确认（第 ${e.seq} 次）\n` +
    `类型：${typeName} · 北京时间 ${bj(e.announcedAt)}\n` +
    `原推：${e.tweetUrl}\n` +
    `<at user_id="all">所有人</at> → 去看看你的额度回来了没`);
}

export async function sendOpsAlert(text: string): Promise<void> {
  const webhook = process.env.LARK_OPS_WEBHOOK;
  if (!webhook) { console.warn("LARK_OPS_WEBHOOK 未配置，跳过运维通知"); return; }
  await postLark(webhook, `🤖 哨兵运维：${text}`);
}
