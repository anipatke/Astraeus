import { describe, expect, it } from "vitest";
import { groupsOf } from "astraeus/app/experienceDefinition";
import { KeplerPoints } from "astraeus/app/KeplerPoints";
import {
  KEPLER_BEGIN_VERTEX_GLSL,
  KEPLER_MAX_STEPS,
  keplerGlsl,
  keplerKmF32,
  keplerOperationOrder,
  keplerStepsFor,
} from "astraeus/app/keplerShader";
import { eqjToRenderVector } from "astraeus/app/renderCoordinates";
import { eccentricAnomalyRad } from "astraeus/core/listedOrbitGroup";
import { fillKeplerRangeKm } from "astraeus/core/keplerElements";
import { createOrbitGroup } from "astraeus/core/orbitGroup";
import { createProvenance } from "astraeus/core/provenance";
import type { PointGroup } from "astraeus/core/pointGroup";
import { trueScale } from "astraeus/core/scalePolicy";
import { createOrbTwoBodyAdapter } from "astraeus/core/twoBodyAdapter";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import geminidsFile from "../data/showers/geminids.json";
import perseidsFile from "../data/showers/perseids.json";
import { readShippedOrbits } from "./helpers/measuredOrbits";

// T-075: the shader solves Kepler's equation for every dot. Proven first (ARCH-03) by a JavaScript twin that rounds to 32 bits
// at each GLSL operation: it must reproduce the group's own 64-bit positions, on a made-up group with eccentricities up to 0.99 and
// then on every member of both shipped sets, across the whole timeline, through the real epoch handling of KeplerPoints.

const DAY = 86_400_000;
/** The camera's vertical field of view is 45 degrees; a 900 pixel tall window is the largest the app is shown in. */
const FOCAL_PX = 900 / 2 / Math.tan((22.5 * Math.PI) / 180);
/** The closest the camera may come to a point focus (TRACKED_MIN_DISTANCE), in scaled units. */
const CLOSEST_UNITS = 0.002;
/** Stated tolerances: a few 32-bit roundings of the orbit's own size (measured at most 2.4e-7), and a thirtieth of a pixel at the closest camera (measured at most 0.016). */
const TOLERANCE_OF_ORBIT = 4e-7;
const TOLERANCE_PX = 0.03;
const K = trueScale.linearUnitsPerKm!;

interface Accuracy {
  /** Largest distance between the twin and the group's position, km, with the scene centre as the origin. */
  maxKm: number;
  /** The same as a share of the member's semi-major axis times sqrt((1 + e) / (1 - e)) (its speed at periapsis in units of mean motion times a, which a 32-bit phase error is multiplied by). */
  maxOfOrbit: number;
  /** Largest error in pixels with the camera at its closest to the centroid, which also carries the rounding of the origin offset. */
  maxPx: number;
  worst: number;
}

/** Compares the twin of the shader with the group's 64-bit fill at each time. */
function accuracyOf(group: PointGroup, times: readonly number[]): Accuracy {
  const elements = group.keplerElements!();
  const kepler = new KeplerPoints(elements, "#ffffff", 1.5);
  const exact = new Float64Array(3 * group.count);
  const result: Accuracy = { maxKm: 0, maxOfOrbit: 0, maxPx: 0, worst: -1 };
  let previous = times[0];
  for (const t of times) {
    group.fillPositionsKm(t, exact);
    const centroid = [0, 0, 0];
    for (let i = 0; i < exact.length; i += 3) for (let k = 0; k < 3; k++) centroid[k] += exact[i + k] / group.count;
    const origin = eqjToRenderVector(centroid.map((v) => v * K));
    const direction = t >= previous ? 1 : -1;
    previous = t;
    const truths = (i: number): number[] => eqjToRenderVector([exact[3 * i] * K, exact[3 * i + 1] * K, exact[3 * i + 2] * K]);
    kepler.update(t, direction, K, [0, 0, 0]);
    const kernel = Array.from({ length: group.count }, (_, i) => kepler.localPosition(i));
    kepler.update(t, direction, K, [-origin[0], -origin[1], -origin[2]]);
    for (let i = 0; i < group.count; i++) {
      const truth = truths(i);
      const km = Math.hypot(kernel[i][0] - truth[0], kernel[i][1] - truth[1], kernel[i][2] - truth[2]) / K;
      const speed = elements.semiMajorAxisKm[i] * Math.sqrt((1 + elements.eccentricity[i]) / (1 - elements.eccentricity[i]));
      if (km > result.maxKm) { result.maxKm = km; result.worst = i; }
      result.maxOfOrbit = Math.max(result.maxOfOrbit, km / speed);
      const local = [0, 1, 2].map((k) => truth[k] - origin[k]);
      const drawn = kepler.localPosition(i);
      const error = Math.hypot(drawn[0] - local[0], drawn[1] - local[1], drawn[2] - local[2]);
      result.maxPx = Math.max(result.maxPx, (error / Math.max(Math.hypot(...local), CLOSEST_UNITS)) * FOCAL_PX);
    }
  }
  return result;
}

function spread(count: number): PointGroup {
  const provenance = createProvenance({ sourceType: "illustrative", sources: ["Made up inside the Kepler shader tests"], accuracy: "None claimed.", notes: "Fixture." });
  return createOrbitGroup({
    id: "wide-e", count, center: "sun", plane: "ecliptic-j2000", epochUtcMs: Date.UTC(2030, 0, 1), provenance, seed: 7,
    base: { semiMajorAxisKm: 2.2e8, eccentricity: 0.9, inclinationDeg: 40, raanDeg: 120, argumentOfPeriapsisDeg: 200, trueAnomalyDeg: 180 },
    spread: { semiMajorAxisKm: 1.9e8, eccentricity: 0.0899, inclinationDeg: 38, raanDeg: 180, argumentOfPeriapsisDeg: 180, trueAnomalyDeg: 180 },
  }, createOrbTwoBodyAdapter());
}

describe("the shader's structure", () => {
  it("does the transcendental operations in the order its twin does, with the same step rule", () => {
    for (const e of [0, 0.49, 0.5, 0.94, 0.95, 0.99]) {
      const trace: string[] = [];
      keplerKmF32([1, 0, 0], [0, 1, 0], e, 1, 1e-7, 100, trace);
      expect(trace).toEqual(keplerOperationOrder(e));
    }
    const glsl = keplerGlsl();
    const body = glsl.slice(glsl.indexOf("{"));
    expect([...body.matchAll(/\b(floor|sign|sin|cos)\(/g)].map((m) => m[1])).toEqual(["floor", "sign", "sin", "cos", "cos", "sin"]);
    expect(body).toContain(`i < ${KEPLER_MAX_STEPS}`);
    expect(body).toContain(`int steps = e < 0.5 ? ${keplerStepsFor(0)} : (e < 0.95 ? ${keplerStepsFor(0.9)} : ${keplerStepsFor(0.99)});`);
    expect(glsl).toContain("E = E - g / (d - 0.5 * g * (e * s) / d);");
    expect(KEPLER_BEGIN_VERTEX_GLSL).toContain("keplerKm(position, keplerQ, keplerShape, uDt)");
  });

  it("solves Kepler's equation to the 32-bit floor for every eccentricity up to 0.99 with the stated steps", () => {
    let worst = 0;
    for (let k = 0; k < 20_000; k++) {
      const e = 0.99 * ((k * 0.6180339) % 1);
      const m = -Math.PI + 2 * Math.PI * ((k * 0.7548776) % 1);
      const E = eccentricAnomalyRad(m, e);
      const p = keplerKmF32([1, 0, 0], [0, Math.sqrt(1 - e * e), 0], e, m, 0, 0);
      const truth = [Math.cos(E) - e, Math.sqrt(1 - e * e) * Math.sin(E)];
      worst = Math.max(worst, Math.hypot(p[0] - truth[0], p[1] - truth[1]) / Math.sqrt((1 + e) / (1 - e)));
    }
    console.info("kepler solve worst, of a sqrt((1+e)/(1-e))", worst);
    expect(worst).toBeLessThan(4e-7);
  });
});

describe("the 64-bit fill from the elements", () => {
  it("reproduces the group's own positions to a part in 10^9, on a made-up group and both shipped sets", () => {
    const groups = [spread(1500), ...[["perseids", 7, perseidsFile], ["geminids", 4, geminidsFile]].map(([story, iau, file]) =>
      groupsOf(buildShowerDefinition(parseShowerSettings(file as typeof geminidsFile), { kind: "loaded", orbits: readShippedOrbits(story as string, iau as number) }, "all"))[0].group)];
    for (const group of groups) {
      const own = new Float64Array(3 * group.count);
      const theirs = new Float64Array(3 * group.count);
      const at = group.bounds === undefined ? Date.UTC(2030, 5, 1) : Math.round((group.bounds.startUtcMs + group.bounds.endUtcMs) / 2);
      group.fillPositionsKm(at, theirs);
      fillKeplerRangeKm(group.keplerElements!(), at, own, 0, group.count);
      let worst = 0;
      for (let i = 0; i < own.length; i += 3) {
        const gap = Math.hypot(own[i] - theirs[i], own[i + 1] - theirs[i + 1], own[i + 2] - theirs[i + 2]);
        worst = Math.max(worst, gap / Math.hypot(theirs[i], theirs[i + 1], theirs[i + 2]));
      }
      expect(worst).toBeLessThan(1e-9); // of the member's distance from the Sun (3e-10 for e up to 0.99 over a year of phase, under 1e-12 for the shipped sets): tens of metres
    }
  }, 60_000);
});

describe("shader twin against the group's own positions", () => {
  it("matches a made-up group with eccentricities up to 0.99 across two years", () => {
    const group = spread(2000);
    const elements = group.keplerElements!();
    expect(Math.max(...elements.eccentricity)).toBeGreaterThan(0.985);
    const times = Array.from({ length: 40 }, (_, k) => Date.UTC(2030, 0, 1) + (k * 18 - 365) * DAY);
    const found = accuracyOf(group, times);
    console.info("made-up e<=0.99", JSON.stringify(found));
    expect(found.maxOfOrbit).toBeLessThan(TOLERANCE_OF_ORBIT);
    expect(found.maxPx).toBeLessThan(TOLERANCE_PX);
  }, 120_000);
});

describe.each([
  { name: "Perseids", story: "perseids", iau: 7, file: perseidsFile },
  { name: "Geminids", story: "geminids", iau: 4, file: geminidsFile },
])("$name shipped set", ({ story, iau, file }) => {
  it("matches every member across the timeline", () => {
    const settings = parseShowerSettings(file);
    const layer = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits(story, iau) }, "all"))[0];
    const { bounds } = layer.group;
    const times = Array.from({ length: 24 }, (_, k) => Math.round(bounds!.startUtcMs + ((bounds!.endUtcMs - bounds!.startUtcMs) * k) / 23));
    const found = accuracyOf(layer.group, times);
    console.info(story, layer.group.count, JSON.stringify(found));
    expect(found.maxOfOrbit).toBeLessThan(TOLERANCE_OF_ORBIT);
    expect(found.maxPx).toBeLessThan(TOLERANCE_PX);
  }, 300_000);
});
