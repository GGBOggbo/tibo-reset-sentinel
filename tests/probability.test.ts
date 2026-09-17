import { describe, it, expect } from "vitest";
import { probability } from "@/lib/probability";

describe("probability（离散风险率：等待 d 天后 24h 内重置比例）", () => {
  it("常规样本：interval (d, d+1] 计分子，> d 计分母", () => {
    // intervals: [1,2,2.5,3,5,10,12]; d=2 → 分母 {2.5,3,5,10,12}=5，分子 {2.5,3}=2 → 40%
    // 注：计划原 fixture [1,2,3,5,10] 分母仅 3（<5 触发 insufficient），与设计规格
    // “样本数（分母）<5 不给百分比”矛盾，故扩充至分母恰为 5 的边界样本。
    const r = probability([1, 2, 2.5, 3, 5, 10, 12], 2);
    expect(r.kind).toBe("ok");
    expect(r.percent).toBe(40);
    expect(r.sampleSize).toBe(5);
  });
  it("d=0 → 全部样本计入分母", () => {
    const r = probability([1, 2, 3, 5, 10], 0);
    expect(r.percent).toBe(20); // (0,1] = 1 / 5
  });
  it("分层标签：低/中/高", () => {
    expect(probability([1, 2, 3, 5, 10], 0).label).toBe("低");      // 20%
    expect(probability([2, 2.5, 2.8, 2.9, 3, 10], 2).label).toBe("高"); // 4/5=80%
    // 注：计划原 fixture [2,2.5,3,5,10] 实际为 2/4=50%（中），注释"4/5=80%"无法由任何
    // 子集得出；修正 fixture 使注释算术成立（分子 (2,3]={2.5,2.8,2.9,3}=4，分母 5）。
    expect(probability([4.5, 4.6, 4.8, 5, 10, 12], 4.5).label).toBe("中"); // 3/5=60%→中
    // 注：计划原 fixture [4.5,4.6,4.8,5,10] 分母仅 4 且 3/4=75%（高）；补充 12 使
    // 分母达 5，注释"3/5=60%→中"字面成立。
  });
  it("分母 <5 → insufficient，不给百分比", () => {
    const r = probability([1, 2], 0.5);
    expect(r.kind).toBe("insufficient");
    expect(r.percent).toBeUndefined();
  });
  it("d ≥ 历史最长 → beyond 高位提示", () => {
    const r = probability([1, 2, 3, 5, 10], 10);
    expect(r.kind).toBe("beyond");
  });
  it("intervals 为空 → insufficient（而非 beyond，冷启动单事件场景）", () => {
    expect(probability([], 3).kind).toBe("insufficient");
  });
  it("标签边界：30% → 中", () => {
    // d=1：分母 = i>1 = 全部 10 个，分子 = (1,2] = {2,2,2} = 3 → 3/10=30%，
    // 30 不满足 <30（低）而满足 ≤60 → 中。计划原 fixture [1,1,1,5×7] d=0.5
    // 经核算实际同样得 30%（1>0.5 计入分母），此处改用整数 d 消除歧义。
    expect(probability([2, 2, 2, 5, 5, 5, 5, 5, 5, 5], 1).label).toBe("中");
  });
  it("MIN_SAMPLE 边界：分母恰为 4 → insufficient", () => {
    // d=0：分母 = 全部 4 个 → 4 < 5 → 样本不足
    expect(probability([1, 2, 3, 4], 0).kind).toBe("insufficient");
  });
});
