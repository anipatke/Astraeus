// O-046 T-189: a path in a Sun-centred scene, with its line fixed to a chosen body. Proved on a made-up probe flying a made-up transfer between two planets (ARCH-03).
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, mars, moon, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
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
