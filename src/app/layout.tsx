import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "额度哨兵 · Codex Reset Sentinel",
  description: "追踪 Tibo 的 Codex 公共重置公告、历史节奏与原始 X 帖子，重置确认后飞书群第一时间推送。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
