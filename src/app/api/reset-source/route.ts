import { fetchRemoteEvents } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 固定用途的公开数据读取接口；不接受任意 URL，不写入仓库或用户数据。
// 采集在本站服务端执行，GitHub 仅负责保存快照和触发部署。
export async function GET() {
  try {
    const result = await fetchRemoteEvents();
    return Response.json({ ...result, fetchedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": result.warning ? "no-store" : "public, max-age=0, s-maxage=300" },
    });
  } catch {
    return Response.json({ error: "公开公告来源暂不可用" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
