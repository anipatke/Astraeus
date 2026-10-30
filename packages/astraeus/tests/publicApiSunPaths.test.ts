// O-046 T-189: a path in a Sun-centred scene, with its line fixed to a chosen body. Proved on a made-up probe flying a made-up transfer between two planets (ARCH-03).
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, mars, moon, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { createState } from "../src/core/state";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { trueScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { relativeTrailKm } from "../src/app/pathRules";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { bodyAbsolute } from "../src/app/sceneLayout";
import { placementAbout } from "./scenePlacement";
import { solarSystemPolicyForTest } from "./scalePolicies";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const FLYBY = T0 + 200 * DAY;
const resolver = () => createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };

/** A made-up transfer: from Earth's place at T0 in a straight line to Mars's place at the flyby time, measured from the Sun (km, 11 samples). */
const transfer = () => {
  const from = resolver().stateOf("earth", T0, "sun").positionKm;
  const to = resolver().stateOf("mars", FLYBY, "sun").positionKm;
  return Array.from({ length: 11 }, (_, i) => ({ time: T0 + i * 20 * DAY, positionKm: from.map((v, k) => v + ((to[k]! - v) * i) / 10) }));
};
const probe = (extra: object = {}) => ({ id: "probe", center: "sun", samples: transfer(), ...extra });
const solar = (extra: object = {}) => new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars, { enlarge: 50 }).setTime(T0).addTrajectory(probe(extra));

/** Draws the view at `timeUtcMs` with the scene centre `centre` and returns the first drawn vertex of the travelled line (origin at zero). */
function firstVertex(view: TrackedBodyView, centre: "sun" | "earth", timeUtcMs: number): number[] {
  view.update(timeUtcMs, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout(centre));
  const line = view.group.children[0] as any;
  return Array.from(line.geometry.getAttribute("position").array.slice(0, 3));
}

describe("a path in a Sun-centred scene", () => {
  it("builds, lists the path and offers the enlarged solar-system scale", () => {
    const definition = solar().toDefinition();
    expect(trackedBodiesOf(definition).map((body) => body.id)).toEqual(["probe"]);
    expect(definition.experience.objects.map((o) => o.id)).toContain("probe");
    expect(definition.scaleChoices).toContain("solar-system");
  });

  it("draws a line fixed to the Sun at the same points at two display times", () => {
    const body = trackedBodiesOf(solar({ lineFixedTo: "sun" }).toDefinition())[0]!;
    const view = new TrackedBodyView(body);
    const a = firstVertex(view, "sun", T0 + 60 * DAY);
    const b = firstVertex(view, "sun", T0 + 120 * DAY);
    expect(a).toEqual(b);
    expect(Math.hypot(...a)).toBeGreaterThan(1_000);
  });

  it("meets the target planet at the flyby time, within the sampling error", () => {
    const body = trackedBodiesOf(solar({ lineFixedTo: "sun" }).toDefinition())[0]!;
    const view = new TrackedBodyView(body);
    view.update(FLYBY, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun"));
    const marker = (view.group.children[3] as any).position;
    const planet = bodyAbsolute(resolver().stateOf("mars", FLYBY, "sun").positionKm, trueScale);
    // render axes are a signed permutation of EQJ: compare distances, not components
    const gap = Math.hypot(marker.x - planet[0]!, marker.y - planet[1]!, marker.z - planet[2]!);
    expect(gap / Math.hypot(...planet)).toBeLessThan(1e-6);
  });

  it("with the default line in an Earth-centred scene matches the plain relative trail, and fixed to Earth is the same line", () => {
    const earthScene = (extra: object = {}) => new Scene().addBody(earth).addBody(moon).addTrajectory({ id: "probe", samples: [{ time: T0, positionKm: [8000, 0, 0] }, { time: T0 + DAY, positionKm: [0, 9000, 0] }], ...extra });
    const plain = new TrackedBodyView(trackedBodiesOf(earthScene().toDefinition())[0]!);
    const fixed = new TrackedBodyView(trackedBodiesOf(earthScene({ lineFixedTo: "earth" }).toDefinition())[0]!);
    expect(firstVertex(plain, "earth", T0)).toEqual(firstVertex(fixed, "earth", T0));
    const placement = placementAbout("earth");
    const samples = { timesUtcMs: [T0], positionsKm: Float64Array.of(8000, 0, 0) };
    expect(relativeTrailKm(samples, "earth", placement)).toBe(samples.positionsKm);
  });

  it("keeps the readouts about the path's centre", () => {
    const scene = solar({ lineFixedTo: "sun", readouts: [{ kind: "range" }, { kind: "speed" }] });
    const rows = scene.toDefinition().createMetrics({ resolver: resolver(), catalogue, clock: undefined as never })("probe", T0 + 60 * DAY) as any[];
    expect(rows.map((row) => row.id)).toEqual(["probe-range", "probe-speed"]);
    const start = transfer()[3]!.positionKm;
    expect(rows[0].value).toBeGreaterThan(0.5 * Math.hypot(...start));
  });

  it("works with the enlarged solar-system scale policy", () => {
    const view = new TrackedBodyView(trackedBodiesOf(solar({ lineFixedTo: "sun" }).toDefinition())[0]!);
    view.update(T0 + 60 * DAY, solarSystemPolicyForTest({ earth: 50, mars: 50 }), new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun"));
    expect(Number.isFinite((view.group.children[3] as any).position.x)).toBe(true);
  });

  it("refuses a lineFixedTo body the scene does not hold, naming the field and the body", () => {
    expect(codeOf(() => solar({ lineFixedTo: "jupiter" }).toDefinition())).toMatch(/^bad-trajectory: addTrajectory\("probe"\): lineFixedTo names "jupiter"/);
  });
});

// O-046 T-190: the frame a path's positions use. A made-up circular orbit in the ecliptic, given both ways.
describe("a path given in the ecliptic plane", () => {
  const R = 1.5e8;
  const W = (2 * Math.PI) / (365 * DAY / 1000); // rad/s
  const ecl = (t: number) => ({ p: [R * Math.cos(W * t), R * Math.sin(W * t), 0], v: [-R * W * Math.sin(W * t), R * W * Math.cos(W * t), 0] });
  const rows = Array.from({ length: 9 }, (_, i) => i * 10 * DAY);
  const matrix = () => createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
  const turn = (v: number[]) => [0, 1, 2].map((r) => matrix()[3 * r]! * v[0]! + matrix()[3 * r + 1]! * v[1]! + matrix()[3 * r + 2]! * v[2]!);
  const build = (frame: "ecl" | "eqj", extra: object = {}) => new Scene().addBody(sun).setTime(T0).addTrajectory({
    id: "orbiter", center: "sun", ...extra,
    samples: rows.map((ms) => { const s = ecl(ms / 1000); return { time: T0 + ms, positionKm: frame === "ecl" ? s.p : turn(s.p), velocityKmS: frame === "ecl" ? s.v : turn(s.v) }; }),
  });

  it("gives the same stateOf as the pre-rotated EQJ path, at several times", () => {
    const a = build("ecl", { plane: "ecliptic-j2000" });
    const b = build("eqj");
    for (const k of [0, 25, 40, 80]) {
      const sa = a.stateOf("orbiter", T0 + k * DAY), sb = b.stateOf("orbiter", T0 + k * DAY);
      sa.positionKm.forEach((v, i) => expect(v).toBeCloseTo(sb.positionKm[i]!, 3));
      sa.velocityKmS!.forEach((v, i) => expect(v).toBeCloseTo(sb.velocityKmS![i]!, 9));
    }
  });

  it("leaves the default as EQJ: unrotated ecliptic numbers stay as given", () => {
    const state = build("ecl").stateOf("orbiter", T0);
    expect(Array.from(state.positionKm)).toEqual([R, 0, 0].map((v) => v));
    expect(build("ecl", { plane: "EQJ" }).stateOf("orbiter", T0).positionKm[1]).toBe(0);
  });

  it("lies in the planets' plane once rotated (the orbit's normal is the ecliptic pole)", () => {
    const state = build("ecl", { plane: "ecliptic-j2000" });
    const at = state.stateOf("orbiter", T0 + 45 * DAY);
    const r = Array.from(at.positionKm), v = Array.from(at.velocityKmS!);
    const h = [r[1]! * v[2]! - r[2]! * v[1]!, r[2]! * v[0]! - r[0]! * v[2]!, r[0]! * v[1]! - r[1]! * v[0]!];
    const pole = turn([0, 0, 1]);
    const inclinationDeg = (Math.acos((h[0]! * pole[0]! + h[1]! * pole[1]! + h[2]! * pole[2]!) / Math.hypot(...h)) * 180) / Math.PI;
    expect(inclinationDeg).toBeLessThan(1e-3);
    expect(Math.abs(r[2]!)).toBeGreaterThan(0); // and it is tilted against the equator, as the rotation should leave it
  });

  it("rotates a provider's states the same way", () => {
    const provider = { stateAt: (t: number) => { const s = ecl((t - T0) / 1000); return createState({ body: "orbiter", center: "sun", timeUtcMs: t, positionKm: s.p, velocityKmS: s.v, orientation: null }); } };
    const scene = new Scene().addBody(sun).setTime(T0).addTrajectory({ id: "orbiter", center: "sun", plane: "ecliptic-j2000", provider, bounds: { start: T0, end: T0 + 80 * DAY } });
    const got = scene.stateOf("orbiter", T0 + 30 * DAY);
    const want = turn(ecl(30 * 86_400).p);
    got.positionKm.forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 3));
  });

  it("refuses a bad plane, naming the field", () => {
    expect(codeOf(() => build("eqj", { plane: "galactic" }))).toMatch(/^bad-trajectory: addTrajectory\("orbiter"\): plane "galactic"/);
  });
});

describe("the made-up probe experience (O-046 T-193)", () => {
  it("builds on the public API: Sun first, enlarged planets, the Solar system scale first, the path fixed to the Sun", async () => {
    const { syntheticProbeDefinition } = await import("../src/synthetic/syntheticProbeDefinition");
    expect(syntheticProbeDefinition.scaleChoices?.[0]).toBe("solar-system");
    const body = trackedBodiesOf(syntheticProbeDefinition)[0]!;
    expect(body.id).toBe("probe");
    expect(body.lineFixedTo).toBe("sun");
    expect(syntheticProbeDefinition.experience.objects.map((o) => o.id)).toEqual(expect.arrayContaining(["sun", "earth", "mars", "probe"]));
  });

  it("builds the README example (a made-up ecliptic probe, line fixed to the Sun, Solar system scale)", async () => {
    const { solarSystemScale } = await import("astraeus");
    const AU = 149_597_870.7;
    const samples = Array.from({ length: 11 }, (_, i) => ({ time: T0 + i * 20 * DAY, positionKm: [AU * (0.6 + 0.05 * i), AU * 0.1 * i, 0] }));
    const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 60 }).addBody(mars, { enlarge: 60 })
      .addTrajectory({ id: "probe", label: "Made-up probe", samples, plane: "ecliptic-j2000", lineFixedTo: "sun" }).setTime(T0).setScale(solarSystemScale);
    scene.camera.fitOrbit(mars);
    expect(scene.toDefinition().scaleChoices![0]).toBe("solar-system");
  });
});

describe("addTrajectory's centre defaults to the scene's centre (O-046, owner decision 2026-10-30)", () => {
  const withoutCentre = () => ({ id: "probe", samples: transfer(), lineFixedTo: "sun" as const });
  const meetsMars = (scene: Scene): number => {
    const view = new TrackedBodyView(trackedBodiesOf(scene.toDefinition())[0]!);
    view.update(FLYBY, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun"));
    const marker = (view.group.children[3] as any).position;
    const planet = bodyAbsolute(resolver().stateOf("mars", FLYBY, "sun").positionKm, trueScale);
    return Math.hypot(marker.x - planet[0]!, marker.y - planet[1]!, marker.z - planet[2]!) / Math.hypot(...planet);
  };

  it("a Sun-first scene reads Sun-measured samples from the Sun, so the probe meets the planet (the miss the owner saw)", () => {
    const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars, { enlarge: 50 }).setTime(T0).addTrajectory(withoutCentre());
    expect(meetsMars(scene)).toBeLessThan(1e-6);
    expect(scene.stateOf("probe", FLYBY).center).toBe("sun");
  });

  it("follows the first body even when the path is added before any body", () => {
    const scene = new Scene().addTrajectory(withoutCentre()).addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars, { enlarge: 50 }).setTime(T0);
    expect(scene.stateOf("probe", FLYBY).center).toBe("sun");
    expect(meetsMars(scene)).toBeLessThan(1e-6);
  });

  it("an Earth-first scene still reads from Earth, and an explicit centre wins", () => {
    const earthFirst = new Scene().addBody(earth).addBody(moon).addTrajectory({ id: "p", samples: [{ time: T0, positionKm: [8000, 0, 0] }, { time: T0 + DAY, positionKm: [0, 9000, 0] }] });
    expect(earthFirst.stateOf("p", T0).center).toBe("earth");
    const alone = new Scene().addTrajectory({ id: "p", samples: [{ time: T0, positionKm: [8000, 0, 0] }, { time: T0 + DAY, positionKm: [0, 9000, 0] }] });
    expect(alone.stateOf("p", T0).center).toBe("earth");
    const explicit = new Scene().addBody(sun).addBody(earth).addTrajectory({ id: "p", center: "earth", samples: [{ time: T0, positionKm: [8000, 0, 0] }, { time: T0 + DAY, positionKm: [0, 9000, 0] }] });
    expect(explicit.stateOf("p", T0).center).toBe("earth");
  });
});

