export interface BrowserStep {
  name: string;
  tier: "quick" | "full";
  script: string;
  scene?: string;
  args?: string[];
  env?: Record<string, string>;
  public?: boolean;
  noBrowser?: boolean;
  example?: string;
}
export const STEPS: readonly BrowserStep[];
export const TIERS: readonly ["quick", "full"];
export function selectSteps(options?: {
  tier?: string;
  steps?: readonly string[];
  all?: readonly BrowserStep[];
}): BrowserStep[];
