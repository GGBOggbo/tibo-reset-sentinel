import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tibo重置哨兵 · Tibo Reset Sentinel",
  description: "追踪 Tibo 的 Codex 公共重置公告、历史节奏与原始 X 帖子，重置确认后第一时间提醒。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
