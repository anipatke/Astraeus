import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { catalogueItem } from "../src/app/catalogueItem";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BODIES } from "../src/core/bodies";
import { MOON_ROTATION } from "../src/core/bodies/moon";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import {
  MARS_MOON_SYSTEM,
  NEPTUNE_MOON_SYSTEM,
  PLUTO_MOON_SYSTEM,
  SATURN_MOON_SYSTEM,
  URANUS_MOON_SYSTEM,
} from "../src/core/bodies/planetMoons";
import {
  iauElementsFromRecord,
  iauOrientation,
  type IauRotationElements,
  type IauRotationRecord,
} from "../src/core/iauRotation";

// A moon's orientation label names the model its state source runs (O-083 Decision 9; AH-05 part 1). The model is observed, not read from a table:
// the state source's orientation is compared with the IAU record's (`data/orbits/<id>.json`, the one source), and the label and card sentence must follow.
// The setup loads the fits for 2016-02-10 to 2016-12-30.
const adapter = createOrbAstronomyAdapter();
const SYSTEMS = {
  mars: MARS_MOON_SYSTEM,
  jupiter: JUPITER_MOON_SYSTEM,
  saturn: SATURN_MOON_SYSTEM,
  uranus: URANUS_MOON_SYSTEM,
  neptune: NEPTUNE_MOON_SYSTEM,
  pluto: PLUTO_MOON_SYSTEM,
} as const;
const DATES = [Date.UTC(2016, 2, 3, 5), Date.UTC(2016, 10, 17, 19)];
const quaternionGap = (a: ArrayLike<number>, b: ArrayLike<number>): number =>
  1 - Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
const angleDeg = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  (Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2])),
      ),
    ),
  ) *
    180) /
  Math.PI;

/** The IAU rotation record saved with a moon's orbit; undefined when the moon has none (its orbit turns it). */
function recordOf(id: string): IauRotationRecord | undefined {
  try {
    return (
      JSON.parse(readFileSync(new URL(`../data/orbits/${id}.json`, import.meta.url), "utf8")) as {
        rotation?: IauRotationRecord;
      }
    ).rotation;
  } catch {
    return undefined;
  }
}

const moons = BUILT_IN_BODIES.filter((body) => body.parentId !== undefined && body.parentId in SYSTEMS);

describe("a moon's orientation label is the model its state source runs", () => {
  it("covers every built-in moon of a planet (the Earth's Moon is checked below)", () => {
    expect(moons.map((moon) => moon.id)).toEqual([
      "io",
      "europa",
      "ganymede",
      "callisto",
      "phobos",
      "deimos",
      "mimas",
      "enceladus",
      "tethys",
      "dione",
      "rhea",
      "titan",
      "iapetus",
      "triton",
      "charon",
    ]);
    expect(moons.filter((moon) => recordOf(moon.id) === undefined).map((moon) => moon.id)).toEqual([
      "phobos",
      "deimos",
    ]);
  });

  for (const moon of moons) {
    const record = recordOf(moon.id);
    const elements: IauRotationElements | undefined = record === undefined ? undefined : iauElementsFromRecord(record);
    it(`${moon.id}: labelled ${elements === undefined ? "tidal-lock" : "iau-rotation"}, and its state turns by that model`, () => {
      const trajectory = catalogue.get(moon.id).source!.create(adapter);
      for (const time of DATES) {
        const state = trajectory.stateAt(time);
        const orientation = state.orientation!;
        if (elements !== undefined) {
          expect(moon.orientation).toBe("iau-rotation");
          expect(
            quaternionGap(orientation, iauOrientation(elements, adapter.daysSinceJ2000Tt(time))),
            `${moon.id} at ${time}`,
          ).toBeLessThan(1e-9);
        } else {
          expect(moon.orientation).toBe("tidal-lock");
          const [x, y, z, w] = orientation;
          const nearSide = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)];
          expect(
            angleDeg(
              nearSide,
              state.positionKm.map((c) => -c),
            ),
            `${moon.id} at ${time}`,
          ).toBeLessThan(1e-3);
        }
      }
    });

    it(`${moon.id}: its card sentence is its model's sentence for ${moon.parentId}`, () => {
      const expected = SYSTEMS[moon.parentId as keyof typeof SYSTEMS].orientationFacts(elements).orientationLimitations;
      expect(moon.accuracy.orientationLimitations).toEqual(expected);
      expect(catalogueItem(moon.id).knownLimitations).toEqual(expected);
    });
  }

  it("the Earth's Moon, the one moon outside the fitted systems, is labelled IAU and its state turns by that model", () => {
    expect(BUILT_IN_BODIES.find((body) => body.id === "moon")!.orientation).toBe("iau-rotation");
    const state = catalogue.get("moon").source!.create(adapter).stateAt(DATES[0]);
    expect(
      quaternionGap(state.orientation!, iauOrientation(MOON_ROTATION, adapter.daysSinceJ2000Tt(DATES[0]))),
    ).toBeLessThan(1e-9);
  });

  it("the two models have different sentences, one source for each", () => {
    const iau = JUPITER_MOON_SYSTEM.orientationFacts(iauElementsFromRecord(recordOf("io")!));
    const locked = JUPITER_MOON_SYSTEM.orientationFacts();
    expect([iau.orientation, locked.orientation]).toEqual(["iau-rotation", "tidal-lock"]);
    expect(iau.orientationLimitations[0]).toContain("IAU rotation model");
    expect(locked.orientationLimitations[0]).toContain("no libration");
  });
});
