// O-083 T-350 (AH-05 part 2; Gemini SCI-02; PROV-01): a body's known position limits (its ephemeris record's sentences) reach its card and `scene.bodies[].knownLimitations`,
// beside its orientation limits. The records are the one source: each sentence is read from them, never restated here.
import { describe, expect, it } from "vitest";
import { Scene, sun, mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune, pluto } from "astraeus";
import { catalogueItem } from "../src/app/catalogueItem";
import { BUILT_IN_BODIES } from "../src/core/bodies";
import { EARTH_EPHEMERIS } from "../src/core/bodies/earth";
import { MOON_EPHEMERIS } from "../src/core/bodies/moon";
import { JUPITER_EPHEMERIS, JUPITER_BAND_LIMITATION } from "../src/core/bodies/jupiter";
import { MERCURY_EPHEMERIS } from "../src/core/bodies/mercury";
import { VENUS_EPHEMERIS } from "../src/core/bodies/venus";
import { MARS_EPHEMERIS } from "../src/core/bodies/mars";
import {
  NEPTUNE_EPHEMERIS,
  PLUTO_EPHEMERIS,
  SATURN_EPHEMERIS,
  URANUS_EPHEMERIS,
} from "../src/core/bodies/outerPlanets";
import { IAU_REPORT, ROTATION_LIMITATION } from "../src/core/bodies/planetRecords";

const RECORDS = {
  earth: EARTH_EPHEMERIS,
  moon: MOON_EPHEMERIS,
  mercury: MERCURY_EPHEMERIS,
  venus: VENUS_EPHEMERIS,
  mars: MARS_EPHEMERIS,
  jupiter: JUPITER_EPHEMERIS,
  saturn: SATURN_EPHEMERIS,
  uranus: URANUS_EPHEMERIS,
  neptune: NEPTUNE_EPHEMERIS,
  pluto: PLUTO_EPHEMERIS,
} as const;
const REFS = { earth, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto } as const;
// The Sun and the planets' moons have no EphemerisRecord (the Sun is the root; a moon's position comes from its fitted package and says so in its provenance).
const WITHOUT_RECORD = (id: string) =>
  id === "sun" || (BUILT_IN_BODIES.find((body) => body.id === id)?.parentId !== "sun" && id !== "moon");

describe("a body's position limits reach its card", () => {
  it("every built-in body that has an ephemeris record carries positionLimitations (a new body without it fails)", () => {
    const missing = BUILT_IN_BODIES.filter(
      (body) => !WITHOUT_RECORD(body.id) && body.accuracy.positionLimitations === undefined,
    ).map((body) => body.id);
    expect(missing).toEqual([]);
    expect(Object.keys(RECORDS).sort()).toEqual(
      BUILT_IN_BODIES.filter((body) => !WITHOUT_RECORD(body.id))
        .map((body) => body.id)
        .sort(),
    );
  });

  for (const [id, record] of Object.entries(RECORDS)) {
    it(`${id}: every sentence of its record is on its card once, position limits before orientation limits`, () => {
      const card = catalogueItem(id).knownLimitations ?? [];
      for (const sentence of record.knownLimitations) expect(card, `${id}: ${sentence}`).toContain(sentence);
      expect(new Set(card).size).toBe(card.length);
      const definition = BUILT_IN_BODIES.find((body) => body.id === id)!;
      const own = definition.accuracy.positionLimitations!;
      expect(card.slice(0, own.length)).toEqual(own);
      for (const sentence of own) expect(definition.accuracy.orientationLimitations).not.toContain(sentence);
    });

    it(`${id}: scene.bodies lists the same sentences`, () => {
      const row = new Scene()
        .addBody(sun)
        .addBody(REFS[id as keyof typeof REFS])
        .bodies.find((body) => body.id === id)!;
      for (const sentence of record.knownLimitations) expect(row.knownLimitations).toContain(sentence);
    });
  }

  it("Jupiter's list is its position limits, then its orientation limit", () => {
    const row = new Scene()
      .addBody(sun)
      .addBody(jupiter)
      .bodies.find((body) => body.id === "jupiter")!;
    expect(row.knownLimitations).toEqual([
      ...JUPITER_EPHEMERIS.knownLimitations,
      ROTATION_LIMITATION,
      JUPITER_BAND_LIMITATION,
      `Constants: ${IAU_REPORT}.`,
    ]);
    expect(row.knownLimitations[0]).toMatch(/^No velocity is modelled for planets/);
  });

  it("a host's own knownLimitations still replace them", () => {
    expect(catalogueItem("jupiter", { knownLimitations: ["Mine."] }).knownLimitations).toEqual(["Mine."]);
  });
});
