import type { GateLimits } from "../../../../tools/gate-limits.mjs";
export function runSet(
  setName: string,
  steps: readonly Record<string, unknown>[],
  limits?: GateLimits,
  tier?: "quick" | "full" | "steps",
): Promise<number>;
