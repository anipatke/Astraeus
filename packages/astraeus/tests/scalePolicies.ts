import { createSolarSystemScale, type ScalePolicy } from "../src/core/scalePolicy";

/** The engine's solar-system scale with the named bodies enlarged by the stated factors (test helper). */
export function solarSystemPolicyForTest(exaggeration: Readonly<Record<string, number>>): ScalePolicy {
  return createSolarSystemScale({ exaggeration, defaultExaggeration: 1 });
}
