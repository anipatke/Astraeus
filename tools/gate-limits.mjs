// The time limits (O-060 T-283): read from tools/gate-limits.json, the only place the numbers live. A limit is advice: `overrun` only words a warning and no caller
// changes an exit code because of it.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const LIMITS_FILE = join(dirname(fileURLToPath(import.meta.url)), "gate-limits.json");

/** The limits object (`gates`, `browser.total`, `browser.steps`) from `file`. */
export function loadLimits(file = LIMITS_FILE) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The warning for a run of `seconds` against `limit`, or "" when it is within the limit (or no limit is stated). */
export function overrun(label, seconds, limit) {
  if (typeof limit !== "number" || seconds <= limit) return "";
  return `WARNING: ${label} took ${seconds}s, over its limit of ${limit}s (slow growth; the run is not failed for time)`;
}
