import { describe, expect, it } from "vitest";
import { AU_KM, DAY_MS, DAY_S, J2000_NOON_UNIX_MS, JD_J2000, JD_UNIX_EPOCH } from "../src/core/constants";

// Each export against an independent statement of it (the literals the engine used before they were gathered).
describe("shared constants", () => {
  const cases: [string, number, number][] = [
    ["AU_KM", AU_KM, 149597870.7],
    ["JD_J2000", JD_J2000, 2451545.0],
    ["J2000_NOON_UNIX_MS", J2000_NOON_UNIX_MS, Date.UTC(2000, 0, 1, 12)],
    ["J2000_NOON_UNIX_MS (literal)", J2000_NOON_UNIX_MS, 946728000000],
    ["JD_UNIX_EPOCH", JD_UNIX_EPOCH, 2440587.5],
    ["DAY_S", DAY_S, 24 * 60 * 60],
    ["DAY_MS", DAY_MS, 86400000],
    ["DAY_MS vs DAY_S", DAY_MS, DAY_S * 1000],
    ["J2000 JD and Unix epoch JD agree", (JD_J2000 - JD_UNIX_EPOCH) * DAY_MS, J2000_NOON_UNIX_MS],
  ];
  it.each(cases)("%s is bit-identical", (_name, actual, expected) => {
    expect(Object.is(actual, expected)).toBe(true);
  });
});
