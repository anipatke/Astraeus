import { describe, expect, it } from "vitest";
import { Scene, SceneError, type DataSource } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { IO_PERIOD_DAYS } from "../src/core/bodies/io";
import { SIDEREAL_MONTH_MS } from "../src/assets/compositions";
import europaOrbit from "../data/orbits/europa.json";
import titanOrbit from "../data/orbits/titan.json";
import mimasOrbit from "../data/orbits/mimas.json";

const DAY_MS = 86_400_000;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
// A made-up data source that provides every catalogued body, so the scene builds without the data packages (only the orbit lines are read).
const everything: DataSource = { name: "made-up", provides: catalogue.ids() };
const pathsOf = (scene: Scene) => scene.toDefinition([everything]).composition?.paths ?? [];

describe("an orbit line for any catalogued moon (I-119)", () => {
  it("draws the Moon and Io exactly as before", () => {
    expect(pathsOf(new Scene().addBody("earth").addBody("moon", { orbit: true }))).toEqual([{ body: "moon", spanMs: SIDEREAL_MONTH_MS }]);
    expect(pathsOf(new Scene().addBody("jupiter").addBody("io", { orbit: true }))).toEqual([{ body: "io", spanMs: IO_PERIOD_DAYS * DAY_MS, look: { endFadeOn: false } }]);
  });

  it("draws Europa, Titan and Mimas about their planet over one lap of the catalogue's period", () => {
    const europa = pathsOf(new Scene().addBody("jupiter").addBody("europa", { orbit: true }))[0]!;
    expect(europa.spanMs / DAY_MS).toBeCloseTo(3.551, 2);
    const titan = pathsOf(new Scene().addBody("saturn").addBody("titan", { orbit: true }))[0]!;
    expect(titan.spanMs / DAY_MS).toBeCloseTo(titanOrbit.elements.periodDays, 6);
    const mimas = pathsOf(new Scene().addBody("saturn").addBody("mimas", { orbit: true }))[0]!;
    expect(mimas.spanMs / DAY_MS).toBeCloseTo(mimasOrbit.elements.periodDays, 6);
    expect(europaOrbit.elements.periodDays).toBeGreaterThan(3.5);
  });

  it("reads the period off the catalogue definition for every moon that has one", () => {
    const moons = catalogue.definitions().filter((d) => d.parentId !== undefined && d.parentId !== "sun" && d.orbitPeriodDays !== undefined);
    expect(moons.map((d) => d.id)).toEqual(expect.arrayContaining(["moon", "io", "europa", "titan", "mimas", "triton", "charon"]));
    for (const d of moons) {
      const scene = new Scene().addBody(d.parentId!).addBody(d.id, { orbit: true });
      expect(pathsOf(scene)[0]!.spanMs).toBeCloseTo(d.orbitPeriodDays! * DAY_MS, 3);
    }
  });

  it("refuses a moon whose data give no period, and one whose planet is not in the scene", () => {
    expect(codeOf(() => new Scene().addBody("mars").addBody("phobos", { orbit: true }))).toMatch(/^no-orbit: .*period about its planet/);
    expect(codeOf(() => new Scene().addBody("europa", { orbit: true }).toDefinition([everything]))).toMatch(/^no-orbit: .*about jupiter/);
  });
});
