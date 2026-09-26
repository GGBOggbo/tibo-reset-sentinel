# 额度哨兵 · Codex Reset Sentinel

追踪 @thsottiaux 的 Codex 重置公告：自动轮询公开数据源 → 更新历史数据 → 静态站点。主源为 codex-resets.com，主源失败时使用 Reset Relay 的公开 Codex RSS。设计见
`docs/superpowers/specs/2026-09-17-额度哨兵-design.md`，产品简报见 `docs/额度哨兵-product-brief.md`。

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

- 自动：计划每 30 分钟轮询一次（GitHub 实际调度可能延迟），新事件自动写入历史数据 + 提交数据 + 触发部署；无变化时数据健康每 12h 心跳提交一次。页面显示的是最近写入仓库的成功采集时间，倒计时仅表示计划时间。
- 来源降级：主源 HTTP 错误或数据非法时读取 `https://www.resetrelay.com/codex/feed.xml`；备用源只接受已确认重置和重置卡公告，不把待确认预告记作已完成。同一原帖优先使用最新更正，以原帖 URL 和 ID 去重，历史记录不会被较短的 RSS 列表覆盖。备用源的更正会将其先前录入的对应事件转为普通动态。
- `health.json` 记录 `lastSource` 和 `sourceWarning`，页面公开显示备用源状态。两源失败时保留历史、保存失败状态，CLI 返回非零退出码；workflow 先提交失败状态再标红。提交脚本先 commit 再 pull/rebase，避免未提交改动阻断自动更新。
- 人工兜底：两源都不可用时，用 `pnpm record` 录入已核实的公告（示例：
  `pnpm record -- --tweet https://x.com/thsottiaux/status/<id> --type reset --title "全量重置" --at 2026-09-20T08:00:00Z --summary "..."`），
  最新失败状态会让页面显示“更新异常”；超过 26 小时没有保存成功采集记录，也会显示异常并隐藏扫描倒计时。目前没有飞书运维推送，请查看 GitHub Actions 的失败通知。
- 注意：GitHub 对超过 60 天无活动的仓库会自动停用定时任务，长期无重置时留意 Actions 是否被禁用。
- 冷启动脚本 `pnpm bootstrap` 为一次性工具，已存在数据时会拒绝执行。
