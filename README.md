# 额度哨兵 · Codex Reset Sentinel

追踪 @thsottiaux 的 Codex 公开重置公告。页面与 RSS 从服务端获取最新来源数据，GitHub Actions 独立保存历史快照，不再把“等待下一次部署”作为展示新公告的前提。

公开来源顺序：TIBO API（`https://tibo.cc/guide/api`，含上游抓取时间和新鲜度）→ Codex Resets API v1 → Reset Relay RSS（仅降级兜底）。原始数据仍归属 codex-resets.com，每条保留原帖链接。

## 本地开发

    pnpm install
    pnpm dev        # http://localhost:3210
    pnpm validate   # events.json 校验
    pnpm test       # 单元测试
    pnpm build      # 生产构建
    pnpm poll -- --dry-run   # 干跑一轮抓取（不写不发）

## 部署清单（一次性）

1. GitHub 建仓并推送（public 仓库 Actions 不限量）。
2. Vercel 导入该仓库（框架 Next.js，零配置），部署成功后绑定自定义域名（可选）。
3. 在 Vercel 配置 `NEXT_PUBLIC_SITE_URL=https://你的生产域名`，用于生成 RSS 的站点链接。
4. Actions 页面手动触发一次 `poll` workflow，确认历史数据可以正常校验和更新。

## 日常运维

- **页面与 RSS：** 请求时读取实时快照，共享服务端 60 秒缓存；缓存到期后由请求触发后台重新核对。页面在可见状态下每 5 分钟实际执行刷新，回到浏览器标签页时也刷新。与 GitHub 定时任务、数据提交及部署是否完成无关。不是推文发布瞬间的实时保证。
- **历史归档：** Actions 计划每小时第 17、47 分钟运行（避开整点高峰，实际仍可能延迟）。仅追加新记录和明确更正，历史保存在 `data/events.json`。无事件变化时每 12 小时保存归档任务心跳；网页显示的是实时快照读取时间，不使用归档心跳假装实时采集。
- **新鲜度门禁：** TIBO 必须返回 `stale=false`、`upstream_status=ok`、无错误、非预测、合法原帖、未过期 `fresh_until`；抓取时间不能超过 10 分钟，上游响应生成时间不能超过 15 分钟。最近记录必须与本地历史有交集，避免无声漏掉超出上游最近 100 条窗口的历史。
- **来源故障：** 一个结构化来源不可用时尝试另一个。仅 RSS 可用或所有来源失败时，保留历史并显示异常；10 分钟没有有效页面快照也不能显示健康。RSS 读取成功不代表它已收录最新公告；降级时 CLI 返回非零退出码、Actions 标红。
- **持久化：** `scripts/commit-data.sh` 先保存提交再 rebase/push。失败状态也先提交，再结束 workflow。网页读取不会向 Git 写入。
- **统一规则：** `src/lib/sync.ts` 被实时页面与归档共用，按原帖 URL/ID 去重、保留历史中文文案，并处理 RSS 的状态更正。预告不计入已完成重置。
- **真实链路回归：** 手动触发 `poll` 时额外执行 `scripts/check-poll-recovery.ts`。只在临时目录移除最新一条，使用真正的来源请求验证重新发现、实时快照呈现、入库、旧历史不变、再次运行不重复。生产档案不被删改。
- **诊断：** `diagnose-source` workflow 仅手动运行，检查公开接口状态和新鲜度。已确认原源对 GitHub 返回 Cloudflare challenge；不使用代理、伪装浏览器或验证码绕过。生产改用其开放再发布 API。
- **人工补录：** 只在已有原帖证据时使用 `pnpm record`。补录成功不能作为自动监控恢复的证据。
- 目前没有飞书推送。异常通过站内提示及 GitHub Actions 失败状态暴露。
- GitHub 可能停用长期无活动的定时 workflow；页面实时读取仍独立运行，归档状态需查 Actions。

原始设计参考 `docs/superpowers/specs/2026-09-17-额度哨兵-design.md`。当前数据来源和实时行为以本 README 与代码为准。
