import { describe, it, expect } from "vitest";
import { fmtBJ, fmtRelative } from "@/lib/format";

describe("fmtBJ", () => {
  it("北京时间 M/D HH:mm", () => {
    expect(fmtBJ("2026-09-12T08:09:17.000Z")).toBe("9/12 16:09");
  });
  it("跨日边界", () => {
    expect(fmtBJ("2026-09-12T16:00:00.000Z")).toBe("9/13 00:00");
  });
});

describe("fmtRelative", () => {
  const now = new Date("2026-09-17T12:00:00.000Z");
  it("各级相对时间", () => {
    expect(fmtRelative("2026-09-17T11:59:30.000Z", now)).toBe("刚刚");
    expect(fmtRelative("2026-09-17T11:50:00.000Z", now)).toBe("10 分钟前");
    expect(fmtRelative("2026-09-17T08:00:00.000Z", now)).toBe("4 小时前");
    expect(fmtRelative("2026-09-12T12:00:00.000Z", now)).toBe("5 天前");
  });
  it("未来时间钳制为刚刚", () => {
    expect(fmtRelative("2026-09-17T13:00:00.000Z", now)).toBe("刚刚");
  });
});
