// O-102 T-467: Ceres as a built-in body. Its position comes from astraeus-data (the T-464 fit, handed in through bodyPositions), it is turned by
// the pck00011 elements, and without the package a scene holding it fails at mount with missing-data.
import { readFileSync } from "node:fs";
import { dataSource } from "astraeus-data";
import { describe, expect, it } from "vitest";
import { Scene, SceneError, ceres, earth, sun, type DataSource } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { CERES, CERES_ROTATION } from "../src/core/bodies/ceres";
import { iauOrientation } from "../src/core/iauRotation";
import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { utcMsToTtSeconds, type TimeScaleTable } from "../src/core/timeScale";

const file = JSON.parse(
  readFileSync(new URL("../../astraeus-data/data/positions/ceres.json", import.meta.url), "utf8"),
) as { timeScale: TimeScaleTable };
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const J2000 = AstroInstant.fromUnixMs(J2000_MS);

/** Two archived Horizons states of 1 Ceres (T-464's evidence: geometric ICRF km about the Sun, TDB read as TT, JPL#48). */
const ARCHIVED = [
  { tdb: "1955-07-04T03:21:09Z", icrfKm: [130206498.5557624, -365185729.4475343, -197510891.5605752] },
  { tdb: "2038-11-02T20:00:13Z", icrfKm: [333597927.9624379, -233077552.9986892, -178148334.5918728] },
];

/** The UTC instant whose TT (by the engine's table) is the archived TDB label. */
function utcOfTdb(tdb: string): number {
  const targetS = (Date.parse(tdb) - J2000_MS) / 1000;
  let utc = Date.parse(tdb);
  for (let i = 0; i < 4; i += 1) utc -= (utcMsToTtSeconds(file.timeScale, utc) - targetS) * 1000;
  return utc;
}

const ceresScene = () =>
  new Scene()
    .addBody(sun)
    .addBody(ceres, { orbit: true })
    .setTimeline({ start: "1960-01-01T00:00:00Z", end: "1961-01-01T00:00:00Z" });

describe("Ceres as a built-in body", () => {
  it("is placed within 1 km of two archived Horizons positions once astraeus-data is loaded", async () => {
    const scene = new Scene()
      .addBody(sun)
      .addBody(ceres)
      .setTimeline({ start: "1955-01-01T00:00:00Z", end: "2040-01-01T00:00:00Z" });
    await scene.load({ data: [dataSource] });
    for (const { tdb, icrfKm } of ARCHIVED) {
      const expected = transform(makeState({ t: J2000, frame: "equatorial-j2000", center: "sun", r: icrfKm }), {
        frame: "equatorial-j2000",
      }).r;
      const state = scene.stateOf("ceres", new Date(utcOfTdb(tdb)).toISOString());
      expect(Math.hypot(...state.positionKm.map((v, i) => v - expected[i])), tdb).toBeLessThan(1);
    }
  });

  it("turns by pck00011: the prime meridian at J2000 is W0, and the pole is the report's", () => {
    expect(CERES_ROTATION.primeMeridianDeg).toEqual([170.65, 952.1532]);
    expect(CERES_ROTATION.poleRaDeg[0]).toBe(291.418);
    expect(CERES_ROTATION.poleDecDeg[0]).toBe(66.764);
    const orientation = iauOrientation(CERES_ROTATION, 0);
    expect(orientation).toBeDefined();
    expect(CERES.radiusKm).toBe(469.7);
    expect(CERES.gmKm3S2).toBe(62.6284);
  });

  it("states provenance for position, radius and rotation", () => {
    expect(CERES.accuracy?.position.sources.join(" ")).toMatch(/COMMAND '1;'.*JPL#48/);
    expect(CERES.accuracy?.position.accuracy).toMatch(/0\.774 km/);
    expect(CERES.accuracy?.dimensions.sources.join(" ")).toMatch(/RAD = 469\.7.*GM = 62\.6284/);
    expect(CERES.accuracy?.orientationLimitations.join(" ")).toMatch(/pck00011/);
  });

  it("is provided by astraeus-data, which lists it and loads its series lazily", () => {
    expect(dataSource.provides).toEqual(["ceres"]);
    expect(typeof dataSource.bodyPositions?.ceres).toBe("function");
  });

  it("without astraeus-data, mount's checks throw missing-data naming it", () => {
    const failure = (() => {
      try {
        definitionOf(ceresScene(), []);
      } catch (error) {
        return error;
      }
    })();
    expect(failure).toBeInstanceOf(SceneError);
    expect(failure).toMatchObject({ code: "missing-data", message: expect.stringContaining("astraeus-data") });
  });

  it("accepts orbit: true and prepares with the package", async () => {
    await expect(definitionOf(ceresScene(), [dataSource]).prepare!()).resolves.toBeUndefined();
  });

  it("outside 1950 to 2045 the error names Ceres's years, from the body's own series", async () => {
    const scene = new Scene()
      .addBody(sun)
      .addBody(ceres)
      .addBody(earth)
      .setTimeline({ start: "1999-01-01T00:00:00Z", end: "2001-01-01T00:00:00Z" });
    await scene.load({ data: [dataSource] });
    expect(() => scene.stateOf("ceres", "2046-06-01T00:00:00Z")).toThrow(
      expect.objectContaining({
        code: "out-of-span",
        message: expect.stringMatching(/ceres.*1950-01-01 to 2045-01-01/),
      }),
    );
  });

  it("orbit: true with a window outside 1950 to 2045 is out-of-span naming Ceres's years, never a raw error", async () => {
    const make = () =>
      new Scene()
        .addBody(sun)
        .addBody(ceres, { orbit: true })
        .setTimeline({ start: "2046-01-01T00:00:00Z", end: "2047-01-01T00:00:00Z" });
    expect(() => definitionOf(make(), [dataSource])).not.toThrow();
    await expect(definitionOf(make(), [dataSource]).prepare!()).rejects.toMatchObject({
      code: "out-of-span",
      message: expect.stringMatching(/ceres.*1950-01-01 to 2045-01-01/),
    });
  });

  it("a package that provides Ceres is a DataSource like any other", () => {
    const source: DataSource = dataSource;
    expect(source.name).toBe("astraeus-data");
  });
});
