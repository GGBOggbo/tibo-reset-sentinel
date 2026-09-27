import { describe, it, expect } from "vitest";
import { isHealthy } from "@/lib/health";

describe("健康状态", () => {
  const now = Date.parse("2026-09-26T12:00:00Z");
  const health = { lastSuccessAt: "2026-09-26T11:55:00Z", lastFailureAt: null, lastError: null };
  it("新失败立即显示异常，不必等 26 小时", () => {
    expect(isHealthy(health, now)).toBe(true);
    expect(isHealthy({ ...health, lastFailureAt: "2026-09-26T11:58:00Z" }, now)).toBe(false);
  });
  it("过期、缺失和未来的成功时间不能显示健康", () => {
    for (const at of ["", "invalid", "2026-09-26T11:49:00Z", "2026-09-17T00:00:00Z", "2026-09-27T00:00:00Z"])
      expect(isHealthy({ ...health, lastSuccessAt: at }, now)).toBe(false);
  });
  it("备用源读取成功也不能作为完整更新成功展示", () => {
    expect(isHealthy({ ...health, sourceWarning: "主源 HTTP 403，使用备用 RSS" }, now)).toBe(false);
  });
});
