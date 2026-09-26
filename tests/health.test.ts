import { describe, it, expect } from "vitest";
import { isHealthy } from "@/lib/health";

describe("健康状态", () => {
  const now = Date.parse("2026-09-26T12:00:00Z");
  const health = { lastSuccessAt: "2026-09-26T11:00:00Z", lastFailureAt: null, lastError: null };
  it("新失败立即显示异常，不必等 26 小时", () => {
    expect(isHealthy(health, now)).toBe(true);
    expect(isHealthy({ ...health, lastFailureAt: "2026-09-26T11:30:00Z" }, now)).toBe(false);
  });
  it("过期、缺失和未来的成功时间不能显示健康", () => {
    for (const at of ["", "invalid", "2026-09-17T00:00:00Z", "2026-09-27T00:00:00Z"])
      expect(isHealthy({ ...health, lastSuccessAt: at }, now)).toBe(false);
  });
});
