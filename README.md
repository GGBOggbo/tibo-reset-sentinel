# 额度哨兵 · Codex Reset Sentinel

追踪 @thsottiaux 的 Codex 重置公告：自动轮询 → 更新历史数据 → 静态站点。设计见
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

- 自动：每 30 分钟轮询一次，新事件自动写入历史数据 + 提交数据 + 触发部署；数据健康每 12h 心跳提交一次。
- 轮询失败会先把 `health.json` 的失败状态提交，再让 workflow 以失败结束，避免“状态已降级但 Actions 仍显示绿色”。
- 人工兜底：codex-resets 接口失效时，用 `pnpm record` 录入（示例：
  `pnpm record -- --tweet https://x.com/thsottiaux/status/<id> --type reset --title "全量重置" --at 2026-09-20T08:00:00Z --summary "..."`），
  连续失败超 26 小时页面自动显示"雷达降级 · 人工核验中"，运维群会收到告警。
- 注意：GitHub 对超过 60 天无活动的仓库会自动停用定时任务，长期无重置时留意 Actions 是否被禁用。
- 冷启动脚本 `pnpm bootstrap` 为一次性工具，已存在数据时会拒绝执行。
