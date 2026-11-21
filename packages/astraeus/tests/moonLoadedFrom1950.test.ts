import { describe, expect, it } from "vitest";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../src/core/chebyshevEphemeris";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createProvenance } from "../src/core/provenance";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

// O-084 T-355 (AH-48): a moon's orbit line asks `loadedFromUtcMs` in the first year of data. The answer is limited to the time-scale
// table as `boundsOf` is, so it never asks the conversion for an instant before the table starts.
const folder = moonDataFolder("jupiter");
const set = new ChebyshevEphemeris(parseEphemerisIndex(readJson(`${folder}index.json`)));
for (const body of ["io", "jupiter"])
  for (const year of [1950, 2016]) set.addChunk(body, `${body}/${year}.bin`, readBytes(`${folder}${body}/${year}.bin`));
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the moon loaded-from tests"],
  accuracy: "None claimed.",
  notes: "Fixture.",
});
const group = createEphemerisGroup({
  id: "jupiter-moons",
  center: "jupiter",
  ephemeris: () => set,
  members: ["io"],
  bounds: set.boundsOf("io"),
  provenance,
});
const february1950 = Date.UTC(1950, 1, 1);

describe("loadedFromUtcMs in the first year of data", () => {
  it("(1) answers a finite time no earlier than the body's bounds start, and no later than the asked time", () => {
    const from = set.loadedFromUtcMs("io", february1950);
    expect(from).not.toBeNull();
    expect(Number.isFinite(from)).toBe(true);
    expect(from!).toBeGreaterThanOrEqual(set.boundsOf("io").startUtcMs);
    expect(from!).toBeLessThanOrEqual(february1950);
  });

  it("(2) answers the same through the group path the orbit line calls", () => {
    expect(group.memberLoadedFromUtcMs(0, february1950)).toBe(set.loadedFromUtcMs("io", february1950));
  });

  it("(3) a mid-span time returns the same value as before the clamp", () => {
    // Recorded before the change (the start of the loaded 2016 chunk, in UTC); the clamp must not move it.
    expect(set.loadedFromUtcMs("io", Date.UTC(2016, 5, 1))).toBe(1451735931817);
  });
});
