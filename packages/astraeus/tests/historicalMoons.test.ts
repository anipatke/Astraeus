import { describe, expect, it } from "vitest";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../src/core/chebyshevEphemeris";
import { PLANET_MOON_DEFINITIONS } from "../src/core/bodies/planetMoons";
import { IO } from "../src/core/bodies/io";
import { EUROPA, GANYMEDE, CALLISTO } from "../src/core/bodies/jupiterMoons";
import { planetSeriesSpan } from "../src/core/planetSeries";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

// O-047 T-200: the main moons and each system's planet are fitted from 1950, the rest keep 2010-2030. Stored Horizons UT vectors (planet-centred), no network.
interface Row { utc: string; positionKm: [number, number, number] }
const fixture = readJson(new URL("./fixtures/historical-moons-horizons.json", import.meta.url).pathname) as { bodies: Record<string, { rows: Row[] }> };
const HISTORICAL = {
  jupiter: ["io", "europa", "ganymede", "callisto"],
  saturn: ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "hyperion", "iapetus", "phoebe"],
  uranus: ["miranda", "ariel", "umbriel", "titania", "oberon"],
  neptune: ["triton", "nereid"],
} as const;
const load = (system: string) => {
  const folder = moonDataFolder(system);
  const raw = readJson(`${folder}index.json`) as { bodies: { id: string; role: string; span?: { fromUtc: string; toUtc: string } }[] };
  return { folder, raw, index: parseEphemerisIndex(raw) };
};

describe("moons fitted back to 1950", () => {
  for (const [system, ids] of Object.entries(HISTORICAL)) {
    it(`${system}: the named moons and the planet answer from 1950; the other moons keep 2010 to 2030`, () => {
      const { raw, index } = load(system);
      const ephemeris = new ChebyshevEphemeris(index);
      for (const id of [...ids, system]) {
        expect(ephemeris.boundsOf(id).startUtcMs, id).toBeLessThanOrEqual(Date.UTC(1950, 0, 1, 0, 5));
        expect(ephemeris.boundsOf(id).endUtcMs, id).toBeGreaterThanOrEqual(Date.UTC(2029, 11, 31));
      }
      const others = raw.bodies.filter((body) => body.role === "moon" && !(ids as readonly string[]).includes(body.id));
      expect(others.length).toBeGreaterThan(0);
      for (const body of others) expect(ephemeris.boundsOf(body.id).startUtcMs, body.id).toBeGreaterThanOrEqual(Date.UTC(2010, 0, 1));
    });
  }

  it("places Io at 1979-03-05 and Titan at 1980-11-12 (and at five dates each from 1950) within a metre of Horizons", () => {
    for (const [id, system] of [["io", "jupiter"], ["titan", "saturn"]] as const) {
      const { folder, index } = load(system);
      const ephemeris = new ChebyshevEphemeris(index);
      const rows = fixture.bodies[id].rows;
      expect(rows.some((row) => row.utc.startsWith(id === "io" ? "1979-03-05" : "1980-11-12"))).toBe(true);
      for (const row of rows) {
        const time = Date.parse(row.utc);
        for (const chunk of ephemeris.chunksFor([id, system], time, time)) ephemeris.addChunk(chunk.body, chunk.path, readBytes(`${folder}${chunk.path}`));
        const state = ephemeris.trajectory(id).stateAt(time);
        const error = Math.hypot(...row.positionKm.map((value, axis) => state.positionKm[axis] - value)) * 1000;
        expect(error, `${id} at ${row.utc}`).toBeLessThan(1);
      }
    }
  });

  it("states each mapped moon's validity as the span its own index holds (no second range to drift)", () => {
    for (const definition of [IO, EUROPA, GANYMEDE, CALLISTO, ...PLANET_MOON_DEFINITIONS.filter((moon) => !["phobos", "deimos", "charon"].includes(moon.id))]) {
      const system = definition.parentId as string;
      const { index } = load(system);
      const bounds = new ChebyshevEphemeris(index).boundsOf(definition.id);
      expect(Math.abs(definition.accuracy.validUtc.startUtcMs - bounds.startUtcMs), definition.id).toBeLessThan(3 * 86_400_000);
      expect(Math.abs(definition.accuracy.validUtc.endUtcMs - bounds.endUtcMs), definition.id).toBeLessThan(3 * 86_400_000);
      expect(definition.accuracy.position.notes, definition.id).toContain(`Valid ${new Date(definition.accuracy.validUtc.startUtcMs + 3e5).getUTCFullYear()}-2030`);
    }
  });

  it("holds the planet series from 1950", () => {
    expect(planetSeriesSpan().startUtcMs).toBeLessThanOrEqual(Date.UTC(1950, 0, 2));
  });
});
