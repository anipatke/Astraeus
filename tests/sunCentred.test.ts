import { describe, expect, it } from "vitest";
import {
  experienceWithGroups,
  groupsOf,
  sunCentredOf,
  validateSunCentred,
  type ExperienceDefinition,
  type PathLayer,
  type SunBody,
} from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { PathView, BodyMarkerView, createSunCentredViews } from "../src/app/SunCentredView";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createProvenance } from "../src/core/provenance";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { createEarthSunTrajectory, createTwoBodyTrajectory, samplePathKm } from "../src/core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { apollo11Definition } from "../src/mission/apollo11Definition";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import {
  syntheticBeltDefinition,
  syntheticEarthPath,
  syntheticFarPath,
  syntheticRingDefinition,
  syntheticSun,
} from "../src/synthetic/syntheticRingDefinition";

const adapter = createOrbAstronomyAdapter();
const twoBody = createOrbTwoBodyAdapter();
const AU_KM = 149_597_870.7;
const YEAR_MS = Math.round(365.256363 * 86_400_000);
const START = Date.UTC(2030, 0, 1);

const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const object = (id: string, withProvenance = true) => ({ id, label: id, ...(withProvenance ? { provenance } : {}) });

// A made-up Sun-centred source: nothing here belongs to any real object.
const madeUpSource = createTwoBodyTrajectory({
  body: "test-object",
  plane: "ecliptic-j2000",
  epochUtcMs: START,
  elements: { semiMajorAxisKm: 3 * AU_KM, eccentricity: 0.3, inclinationDeg: 12, raanDeg: 40, argumentOfPeriapsisDeg: 70, trueAnomalyDeg: 25 },
}, twoBody);
const path = (over: Partial<PathLayer> = {}): PathLayer => ({
  object: object("test-path"),
  color: "#ffffff",
  source: madeUpSource,
  span: { startUtcMs: START, endUtcMs: START + 4 * YEAR_MS },
  ...over,
});
const sun = (over: Partial<SunBody> = {}): SunBody => ({ object: object("test-sun"), color: "#ffff00", ...over });

describe("the Sun and path declaration", () => {
  it("accepts a valid Sun and path", () => {
    expect(validateSunCentred(sun(), [path()]).paths).toHaveLength(1);
  });

  it.each([
    ["an empty path id", () => validateSunCentred(undefined, [path({ object: object("") })]), /path id must be non-empty/],
    ["a repeated id", () => validateSunCentred(sun({ object: object("same") }), [path({ object: object("same") })]), /duplicate id "same"/],
    ["missing path provenance", () => validateSunCentred(undefined, [path({ object: object("p", false) })]), /path "p" needs provenance/],
    ["missing Sun provenance", () => validateSunCentred(sun({ object: object("s", false) }), []), /sun "s" needs provenance/],
    ["a reversed span", () => validateSunCentred(undefined, [path({ span: { startUtcMs: START + 10, endUtcMs: START } })]), /span must end after it starts/],
    ["a non-finite span", () => validateSunCentred(undefined, [path({ span: { startUtcMs: Number.NaN, endUtcMs: START } })]), /finite start and end/],
    ["too few samples", () => validateSunCentred(undefined, [path({ samples: 1 })]), /samples must be a whole number of at least 2/],
    ["a source with no stateAt", () => validateSunCentred(undefined, [path({ source: {} as never })]), /source must be a Trajectory/],
    ["a source that cannot give a Sun-centred state", () => validateSunCentred(undefined, [path({
      source: { body: "x", stateAt: () => { throw new RangeError("no such state"); } },
    })]), /cannot give a Sun-centred state at the span start: no such state/],
    ["a bad marker size", () => validateSunCentred(sun({ markerSizePx: 0 }), []), /markerSizePx must be positive/],
  ])("names the problem for %s", (_what, act, message) => {
    expect(act).toThrow(message);
  });

  it("rejects a source whose elements are not a bound orbit", () => {
    expect(() => createTwoBodyTrajectory({
      body: "bad", plane: "EQJ", epochUtcMs: START,
      elements: { semiMajorAxisKm: AU_KM, eccentricity: 1.1, inclinationDeg: 0, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
    }, twoBody)).toThrow(/eccentricity/);
  });
});

describe("a path is a state source sampled over a span", () => {
  it("has a vertex at the source's position for every sample time", () => {
    const span = { startUtcMs: START, endUtcMs: START + 3 * YEAR_MS };
    const samples = samplePathKm(madeUpSource, span, 40);
    expect(samples).toHaveLength(120);
    for (const k of [0, 1, 17, 38, 39]) {
      const t = Math.round(span.startUtcMs + ((span.endUtcMs - span.startUtcMs) * k) / 39);
      const expected = madeUpSource.stateAt(t, "sun").positionKm;
      for (let c = 0; c < 3; c += 1) expect(samples[3 * k + c]).toBe(expected[c]);
    }
  });

  it("rejects a Sun-centred source asked for another centre, and a span outside the source's bounds", () => {
    expect(() => madeUpSource.stateAt(START, "earth")).toThrow(/Sun-centred/);
    const bounded = createTwoBodyTrajectory({
      body: "b", plane: "EQJ", epochUtcMs: START, bounds: { startUtcMs: START, endUtcMs: START + 1000 },
      elements: { semiMajorAxisKm: AU_KM, eccentricity: 0.1, inclinationDeg: 0, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
    }, twoBody);
    expect(() => samplePathKm(bounded, { startUtcMs: START, endUtcMs: START + 5000 }, 4)).toThrow();
  });

  it("takes Earth's path from Earth's own Sun-centred state", () => {
    const earth = createEarthSunTrajectory(adapter);
    const t = START + 100 * 86_400_000;
    expect(Array.from(earth.stateAt(t, "sun").positionKm)).toEqual(Array.from(earthStateAt(adapter, t).positionKm));
    expect(() => earth.stateAt(t, "earth")).toThrow(/Sun-centred/);
  });
});

/** Smallest distance (km) from `point` to the polyline through `vertices` (3 values each). */
function distanceToPolyline(vertices: Float64Array, point: ArrayLike<number>): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 3 < vertices.length; i += 3) {
    const a = [vertices[i], vertices[i + 1], vertices[i + 2]];
    const ab = [vertices[i + 3] - a[0], vertices[i + 4] - a[1], vertices[i + 5] - a[2]];
    const ap = [point[0] - a[0], point[1] - a[1], point[2] - a[2]];
    const f = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
    best = Math.min(best, Math.hypot(ap[0] - f * ab[0], ap[1] - f * ab[1], ap[2] - f * ab[2]));
  }
  return best;
}

describe("Earth's path and the Sun are placed through centre composition", () => {
  const earthView = new PathView(syntheticEarthPath);
  // 256 samples over a year: the chord of one segment sags about 1.1e4 km below the true curve.
  const TOLERANCE_KM = 2e4;

  it.each([
    ["the start", START],
    ["three months on", START + 91 * 86_400_000],
    ["eight months on", START + 243 * 86_400_000],
  ])("passes through Earth's own position at %s", (_when, t) => {
    expect(distanceToPolyline(earthView.samplesKm, earthStateAt(adapter, t).positionKm)).toBeLessThan(TOLERANCE_KM);
  });

  it("composed to the Earth-centred scene, the line passes through the origin where Earth is", () => {
    for (const t of [START + 10 * 86_400_000, START + 200 * 86_400_000]) {
      const offset = sunPositionFromEarthAt(adapter, t).positionKm;
      const composed = Float64Array.from(earthView.samplesKm, (value, i) => value + offset[i % 3]);
      expect(distanceToPolyline(composed, [0, 0, 0])).toBeLessThan(TOLERANCE_KM);
    }
  });

  it.each([["True", trueScale], ["Readable", readableScale]])("places the Sun body and every vertex at %s scale", (_name, policy) => {
    const t = START + 30 * 86_400_000;
    const sunView = new BodyMarkerView(syntheticSun);
    sunView.sync(t, adapter, policy);
    const sunKm = sunPositionFromEarthAt(adapter, t).positionKm;
    expect(Array.from(sunView.absolute())).toEqual(Array.from(eqjToRenderVector(policy.mapPosition(sunKm))));

    const far = new PathView(syntheticFarPath);
    far.sync(t, adapter, policy);
    far.place(new FloatingOrigin());
    for (const k of [0, 100, 255]) {
      const km = [0, 1, 2].map((c) => far.samplesKm[3 * k + c] + sunKm[c]);
      const expected = eqjToRenderVector(policy.mapPosition(km));
      expect(Array.from(far.vertexAbsolute(k))).toEqual(Array.from(expected));
      const local = far.vertexLocal(k);
      for (let c = 0; c < 3; c += 1) expect(local[c] / expected[c]).toBeCloseTo(1, 5);
    }
  });

  it("frames the Sun by the farthest path and anchors a path's label on its own line", () => {
    const views = createSunCentredViews(syntheticSun, [syntheticEarthPath, syntheticFarPath]);
    const sunView = views[0];
    const far = views[2] as PathView;
    sunView.sync(START, adapter, trueScale);
    expect(sunView.extentUnits(trueScale)).toBeCloseTo((far.maxRadiusKm / 6371), 0);
    far.sync(START, adapter, trueScale);
    expect(Array.from(far.labelAnchor())).toEqual(Array.from(far.vertexAbsolute(0)));
  });
});

describe("State is untouched and an experience without the declaration is unchanged", () => {
  it("leaves group fills identical with and without drawing the Sun and paths", () => {
    const layer = groupsOf(syntheticBeltDefinition)[0];
    const t = START + 3_600_000;
    const before = new Float64Array(3 * layer.group.count);
    const after = new Float64Array(3 * layer.group.count);
    layer.group.fillPositionsKm(t, before);
    const views = createSunCentredViews(syntheticSun, [syntheticEarthPath, syntheticFarPath]);
    for (const view of views) { view.sync(t, adapter, trueScale); view.place(new FloatingOrigin()); }
    layer.group.fillPositionsKm(t, after);
    expect(Array.from(after)).toEqual(Array.from(before));
    expect(Array.from(earthStateAt(adapter, t).positionKm)).toEqual(Array.from(adapter.earthPositionFromSunKm(t)));
  });

  it.each([
    ["Apollo", apollo11Definition],
    ["synthetic", syntheticDefinition],
    ["the ring", syntheticRingDefinition],
  ] as const)("draws nothing extra for %s", (_name, definition: ExperienceDefinition) => {
    expect(sunCentredOf(definition)).toEqual({ sun: undefined, paths: [] });
    const withGroupsOnly = experienceWithGroups(definition);
    expect(withGroupsOnly.objects.map((o) => o.id)).toEqual(
      [...definition.experience.objects.map((o) => o.id), ...groupsOf(definition).map((g) => g.object.id)],
    );
    expect(definition.camera).toBeUndefined();
  });

  it("keeps the belt's own items and reach when the layer is left out, and adds exactly the Sun and two paths when listed", () => {
    const without: ExperienceDefinition = { ...syntheticBeltDefinition, sceneLayers: ["points"] };
    expect(experienceWithGroups(without).objects.map((o) => o.id)).toEqual(["earth", "dust-belt"]);
    expect(experienceWithGroups(syntheticBeltDefinition).objects.map((o) => o.id)).toEqual(
      ["earth", "dust-belt", "sun", "earth-path", "far-marker-path"],
    );
    expect(without.camera).toEqual(syntheticBeltDefinition.camera);
  });

  it("states the Sun's size is a drawing choice and gives every landmark provenance", () => {
    expect(syntheticSun.object.description).toMatch(/not the Sun's real size/);
    expect(syntheticSun.object.provenance?.notes).toMatch(/not a physical radius/);
    expect(syntheticEarthPath.object.provenance?.sourceType).toBe("ephemeris");
    expect(syntheticFarPath.object.provenance?.sourceType).toBe("illustrative");
    expect(syntheticFarPath.object.knownLimitations?.join(" ")).toMatch(/Made up/);
  });
});
