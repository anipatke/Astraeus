import { moonDataFolder } from "./moonData";
import { describe, expect, it } from "vitest";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../src/core/chebyshevEphemeris";
import { exists, readBytes, readJson } from "../tools/import/test-io.mjs";

// The committed core data (data/ephemerides/jupiter-moons/, O-025 T-096) read through the provider, checked against JPL
// Horizons' own Jupiter-centred UT vectors kept in a fixture. No network.
const DATA = moonDataFolder("jupiter");
const FIXTURE = new URL("./fixtures/jupiter-moons-horizons.json", import.meta.url).pathname;

interface FixtureRow { utc: string; positionKm: [number, number, number] }
const raw = readJson(`${DATA}index.json`) as {
  source: { moonCount: number };
  span: { fromUtc: string; toUtc: string };
  bodies: { id: string; role: string; span?: { fromUtc: string; toUtc: string }; accuracy: { targetM: number; span: { worstM: number; count: number }; demoWindow: { worstM: number } } }[];
};
const index = parseEphemerisIndex(raw);
const fixture = readJson(FIXTURE) as { bodies: Record<string, { rows: FixtureRow[] }> };

describe("Jupiter's moons as core curve-fit data", () => {
  it("holds every moon Horizons listed, plus Jupiter as the centre", () => {
    const moons = raw.bodies.filter((body) => body.role === "moon");
    expect(moons.length).toBe(raw.source.moonCount);
    expect(moons.length).toBeGreaterThanOrEqual(95);
    expect(index.centre).toBe("jupiter");
    for (const id of ["io", "europa", "ganymede", "callisto", "metis", "adrastea", "amalthea", "thebe", "himalia"]) expect(index.bodies.some((body) => body.id === id)).toBe(true);
  });

  it("has every chunk file the index names, at the stated size", () => {
    for (const body of index.bodies) {
      for (const chunk of body.chunks) {
        const path = `${DATA}${chunk.path}`;
        expect(exists(path), path).toBe(true);
        expect(readBytes(path).byteLength, path).toBe(chunk.bytes);
      }
    }
  });

  it("records a measured error within the target for every body, over the span and the demo window", () => {
    for (const body of raw.bodies) {
      expect(body.accuracy.span.count, body.id).toBeGreaterThan(1000);
      expect(body.accuracy.span.worstM, body.id).toBeLessThanOrEqual(body.accuracy.targetM);
      expect(body.accuracy.demoWindow.worstM, body.id).toBeLessThanOrEqual(body.accuracy.targetM);
    }
  });

  it("covers the whole span for every body", () => {
    const ephemeris = new ChebyshevEphemeris(index);
    const to = Date.parse(`${raw.span.toUtc}T00:00:00Z`);
    for (const body of index.bodies) {
      const from = Date.parse(`${raw.bodies.find((entry) => entry.id === body.id)?.span?.fromUtc ?? raw.span.fromUtc}T00:00:00Z`);
      const bounds = ephemeris.boundsOf(body.id);
      expect(bounds.startUtcMs, body.id).toBeLessThanOrEqual(from + 60_000);
      expect(bounds.endUtcMs, body.id).toBeGreaterThanOrEqual(to);
    }
  });

  it("places moons where Horizons does (Jupiter-centred, UTC) to within two metres", () => {
    const ephemeris = new ChebyshevEphemeris(index);
    const loaded = new Set<string>();
    for (const [id, { rows }] of Object.entries(fixture.bodies)) {
      for (const row of rows) {
        const time = Date.parse(row.utc);
        for (const { body, path } of ephemeris.chunksFor([id], time, time)) {
          if (loaded.has(path)) continue;
          ephemeris.addChunk(body, path, readBytes(`${DATA}${path}`));
          loaded.add(path);
        }
        const state = ephemeris.trajectory(id).stateAt(time);
        const error = Math.hypot(...row.positionKm.map((value, axis) => state.positionKm[axis] - value));
        expect(error * 1000, `${id} at ${row.utc}`).toBeLessThan(2);
      }
    }
  });
});
