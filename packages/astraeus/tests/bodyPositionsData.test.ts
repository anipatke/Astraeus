// T-465: a data package hands the engine a Sun-circling body's positions (`DataSource.bodyPositions`), read only for bodies in the scene,
// decoded by the planets' own reader and placed by the general package-series binding. "tarn" is a made-up body with a made-up series.
import { describe, expect, it, vi } from "vitest";
import planets from "../data/ephemerides/planets/planets.json" with { type: "json" };
import { checkDataSources, installData, type DataSource } from "../src/api/data";
import { BodyPlan } from "../src/api/planBodies";
import { catalogue as builtIn, bindCatalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { packageSeriesBinding } from "../src/core/bodies/planetTrajectory";
import { AU_KM } from "../src/core/constants";
import type { IauRotationElements } from "../src/core/iauRotation";
import { createSceneMoonData } from "../src/core/moonData";
import { NotLoadedError } from "../src/core/planetSeries";
import { encodeChunk } from "../tools/import/chebyshevFit";

const ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [0, 0],
  poleDecDeg: [90, 0],
  primeMeridianDeg: [0, 360],
  citation: "made up",
});
const SEGMENT_S = 100 * 86400;

/** Two segments of constant position (ecliptic km): 1 au along the equinox, then 2 au. */
function tarnSeries(): object {
  const coefficients = Float64Array.from([AU_KM, 0, 0, 0, 0, 0, 2 * AU_KM, 0, 0, 0, 0, 0]);
  const bytes = encodeChunk({ startTdbS: 0, segmentCount: 2, coefficientCount: 2, quantumKm: 0.1, coefficients });
  return {
    format: planets.format,
    timeScale: planets.timeScale,
    planets: {
      tarn: {
        startS: 0,
        segmentSeconds: SEGMENT_S,
        segmentCount: 2,
        coefficientCount: 2,
        quantumKm: 0.1,
        data: btoa(String.fromCharCode(...bytes)),
      },
    },
  };
}

const WINDOW = { startUtcMs: Date.UTC(2000, 0, 2), endUtcMs: Date.UTC(2000, 0, 3) };
const DAY_ONE = Date.UTC(2000, 0, 2, 12);
const DAY_150 = DAY_ONE + 150 * 86400_000;

type Row = {
  readonly name: string;
  /** The package passed to the scene; undefined passes none. */
  readonly source: (load: () => Promise<object>) => DataSource | undefined;
  readonly sceneBodies: readonly string[];
  readonly loads: number;
  /** The error code `installData` rejects with, or the position (EQJ km) of tarn after it, or undefined when nothing is provided. */
  readonly expected: { readonly code: string } | { readonly xKm: readonly number[] } | undefined;
};

const pkg = (extra: Partial<DataSource>): DataSource => ({ name: "astraeus-data-tarn", provides: [], ...extra });

const rows: readonly Row[] = [
  { name: "absent member", source: () => pkg({}), sceneBodies: ["tarn"], loads: 0, expected: undefined },
  {
    name: "valid",
    source: (load) => pkg({ bodyPositions: { tarn: load } }),
    sceneBodies: ["sun", "tarn"],
    loads: 1,
    expected: { xKm: [AU_KM, 2 * AU_KM] },
  },
  // I-210: plain Node hands back a JSON module whose only key is `default`; Vite and webpack add the named keys beside it.
  {
    name: "valid, a module whose only key is default (plain Node)",
    source: (load) => pkg({ bodyPositions: { tarn: () => load().then((file) => ({ default: file })) } }),
    sceneBodies: ["sun", "tarn"],
    loads: 1,
    expected: { xKm: [AU_KM, 2 * AU_KM] },
  },
  {
    name: "valid, a module with default and named keys (Vite)",
    source: (load) => pkg({ bodyPositions: { tarn: () => load().then((file) => ({ ...file, default: file })) } }),
    sceneBodies: ["sun", "tarn"],
    loads: 1,
    expected: { xKm: [AU_KM, 2 * AU_KM] },
  },
  {
    name: "malformed series inside default",
    source: () =>
      pkg({ bodyPositions: { tarn: () => Promise.resolve({ default: { ...tarnSeries(), format: "other/1" } }) } }),
    sceneBodies: ["tarn"],
    loads: 0,
    expected: { code: "bad-data" },
  },
  {
    name: "malformed member",
    source: () => pkg({ bodyPositions: { tarn: "tarn.json" as never } }),
    sceneBodies: ["tarn"],
    loads: 0,
    expected: { code: "bad-data" },
  },
  {
    name: "malformed series",
    source: () => pkg({ bodyPositions: { tarn: () => Promise.resolve({ ...tarnSeries(), format: "other/1" }) } }),
    sceneBodies: ["tarn"],
    loads: 0,
    expected: { code: "bad-data" },
  },
  {
    name: "body not in scene",
    source: (load) => pkg({ bodyPositions: { tarn: load } }),
    sceneBodies: ["sun", "earth"],
    loads: 0,
    expected: undefined,
  },
  {
    name: "body in scene without its package",
    source: () => undefined,
    sceneBodies: ["sun", "tarn"],
    loads: 0,
    expected: { code: "missing-data" },
  },
];

/** What `mount` checks first: a body whose ref requires the package, and the data sources' own faults. */
function checkAtMount(data: readonly DataSource[]): void {
  const plan = new BodyPlan(
    () => false,
    () => undefined,
  );
  plan.bodies.set("tarn", { id: "tarn", label: "Tarn", requires: "astraeus-data-tarn" });
  checkDataSources(data);
  plan.checkData(data);
}

describe("DataSource.bodyPositions", () => {
  it.each(rows)("$name", async ({ source, sceneBodies, loads, expected }) => {
    const load = vi.fn(() => Promise.resolve(tarnSeries()));
    const passed = source(load);
    const data = passed === undefined ? [] : [passed];
    const store = createSceneMoonData();
    const catalogue = bindCatalogue(builtIn, store);
    const code = expected !== undefined && "code" in expected ? expected.code : undefined;
    if (code === "missing-data") expect(() => checkAtMount(data)).toThrow(/tarn needs the astraeus-data-tarn package/);
    if (code === "missing-data") expect(() => checkAtMount(data)).toThrow(expect.objectContaining({ code }));
    const install = installData(data, sceneBodies, WINDOW, catalogue);
    if (code === "bad-data")
      await expect(install).rejects.toMatchObject({ code, message: expect.stringContaining("bodyPositions.tarn") });
    else await install;
    expect(load).toHaveBeenCalledTimes(loads);
    const trajectory = packageSeriesBinding("tarn", ROTATION).create(createOrbAstronomyAdapter(), store);
    if (expected === undefined || "code" in expected) {
      expect(store.series("tarn")).toBeUndefined();
      expect(() => trajectory.stateAt(DAY_ONE)).toThrow(NotLoadedError);
      return;
    }
    expect(() => checkAtMount(data)).not.toThrow();
    [DAY_ONE, DAY_150].forEach((time, i) => {
      const state = trajectory.stateAt(time, "sun");
      expect(state.body).toBe("tarn");
      expect(state.positionKm[0]).toBeCloseTo(expected.xKm[i], 0);
      expect(Math.hypot(state.positionKm[1], state.positionKm[2])).toBeLessThan(1);
    });
    // A second load of the same scene reads nothing again.
    await installData(data, sceneBodies, WINDOW, catalogue);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
