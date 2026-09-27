import type { HealthFile } from "./types";

export function isHealthy(health: HealthFile, now = Date.now()): boolean {
  const success = Date.parse(health.lastSuccessAt);
  const failure = health.lastFailureAt ? Date.parse(health.lastFailureAt) : NaN;
  return !health.sourceWarning && Number.isFinite(success) && success <= now && now - success < 26 * 3_600_000
    && !(Number.isFinite(failure) && failure >= success);
}
