# 额度哨兵 · Codex Reset Sentinel

追踪 @thsottiaux 的 Codex 重置公告：自动轮询 → 飞书群推送 → 静态站点。设计见
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
2. 建两个飞书群（用户订阅群 / 站长运维群），群设置 → 群机器人 → 添加"自定义机器人"，
   分别复制 webhook 地址。注意：订阅群需在群设置中开启" @所有人"权限，推送才会真正 @所有人。
3. GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `LARK_SUBSCRIBE_WEBHOOK` = 订阅群 webhook
   - `LARK_OPS_WEBHOOK` = 运维群 webhook
4. Vercel 导入该仓库（框架 Next.js，零配置），部署成功后绑定自定义域名（约 ¥70/年）。
5. 购买域名后：把 `src/app/feed.xml/route.ts` 中的 `PLACEHOLDER-DOMAIN.example.com` 替换为真实域名；
   把订阅群二维码图放到 `public/lark-group-qr.png` 并替换 `SiteFooter.tsx` 中的占位框。
6. Actions 页面手动触发一次 `poll` workflow，确认飞书运维群收到通知（或先看 run 日志验证）。

## 日常运维

- 自动：每 30 分钟轮询一次，新事件自动推送 + 提交数据 + 触发部署；数据健康每 12h 心跳提交一次。
- 人工兜底：codex-resets 接口失效时，用 `pnpm record` 录入（示例：
  `pnpm record -- --tweet https://x.com/thsottiaux/status/<id> --type reset --title "全量重置" --at 2026-09-20T08:00:00Z --summary "..."`），
  连续失败超 26 小时页面自动显示"雷达降级 · 人工核验中"，运维群会收到告警。
- 注意：GitHub 对超过 60 天无活动的仓库会自动停用定时任务，长期无重置时留意 Actions 是否被禁用。
- 冷启动脚本 `pnpm bootstrap` 为一次性工具，已存在数据时会拒绝执行。
