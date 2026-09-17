export type ProbabilityLabel = "低" | "中" | "高";

export interface ProbabilityResult {
  kind: "ok" | "insufficient" | "beyond";
  percent?: number;        // 0–100 取整
  label?: ProbabilityLabel;
  waitedDays: number;      // 当前已等待天数（含小数）
  sampleSize: number;      // 分母样本数
}

const MIN_SAMPLE = 5;

export function probability(intervalsDays: number[], waitedDays: number): ProbabilityResult {
  const sorted = [...intervalsDays].sort((a, b) => a - b);
  if (sorted.length === 0)
    return { kind: "insufficient", waitedDays, sampleSize: 0 }; // 空样本：无历史可比
  const max = sorted[sorted.length - 1];
  if (waitedDays >= max) return { kind: "beyond", waitedDays, sampleSize: 0 };
  const denominator = sorted.filter((i) => i > waitedDays);
  if (denominator.length < MIN_SAMPLE)
    return { kind: "insufficient", waitedDays, sampleSize: denominator.length };
  const numerator = denominator.filter((i) => i <= waitedDays + 1);
  const percent = Math.round((numerator.length / denominator.length) * 100);
  return { kind: "ok", percent, label: percent < 30 ? "低" : percent <= 60 ? "中" : "高",
           waitedDays, sampleSize: denominator.length };
}
