import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { trueScale } from "../src/core/scalePolicy";
import { eccentricAnomalyFromMean, eccentricPathTimesUtcMs, pathTimesUtcMs } from "../src/core/sunCentredSources";
import { DEFAULT_ECCENTRIC_SAMPLE_COUNT, DEFAULT_PATH_SAMPLE_COUNT, validatePathSpec, type PathLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PathView } from "../src/app/PathView";
import { fitDistance } from "../src/app/sceneFraming";
import { ECCENTRIC_ELEMENTS, ECCENTRIC_PERIOD_MS, ECCENTRIC_SAMPLING, eccentricSource, syntheticEccentricDefinition, syntheticEccentricPath } from "../src/synthetic/syntheticEccentricDefinition";
import { placementAbout } from "./scenePlacement";

const AU_KM = 149_597_870.7;
const SPAN = { startUtcMs: ECCENTRIC_SAMPLING.periapsisUtcMs, endUtcMs: ECCENTRIC_SAMPLING.periapsisUtcMs + Math.round(ECCENTRIC_PERIOD_MS) };
const adapter = createOrbAstronomyAdapter();

/** Longest straight segment between neighbouring samples as a fraction of the orbit radius there (the mean of the segment's two end radii). */
function worstChordFraction(times: readonly number[]): number {
  let worst = 0;
  let previous = eccentricSource.stateAt(times[0], "sun").positionKm;
  for (let k = 1; k < times.length; k += 1) {
    const next = eccentricSource.stateAt(times[k], "sun").positionKm;
    const chord = Math.hypot(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]);
    worst = Math.max(worst, chord / ((Math.hypot(...previous) + Math.hypot(...next)) / 2));
    previous = next;
  }
  return worst;
}

describe("a made-up e = 0.96 orbit (1 to 51 AU) sampled by eccentric anomaly", () => {
  const uniform = pathTimesUtcMs(SPAN, DEFAULT_ECCENTRIC_SAMPLE_COUNT);
  const eccentric = eccentricPathTimesUtcMs(SPAN, DEFAULT_ECCENTRIC_SAMPLE_COUNT, ECCENTRIC_SAMPLING);

  it("has a made-up orbit from 1.04 AU to 50.96 AU", () => {
    expect(ECCENTRIC_ELEMENTS.eccentricity).toBe(0.96);
    expect(Math.hypot(...eccentricSource.stateAt(SPAN.startUtcMs, "sun").positionKm) / AU_KM).toBeCloseTo(26 * 0.04, 3);
    const aphelionAt = Math.round(SPAN.startUtcMs + ECCENTRIC_PERIOD_MS / 2);
    expect(Math.hypot(...eccentricSource.stateAt(aphelionAt, "sun").positionKm) / AU_KM).toBeCloseTo(26 * 1.96, 3);
  });

  it("keeps the longest chord, as a fraction of the local orbit radius, at most one tenth of even-in-time sampling's (same sample count)", () => {
    const byTime = worstChordFraction(uniform);
    const byAnomaly = worstChordFraction(eccentric);
    expect(byTime).toBeGreaterThan(1);
    expect(byAnomaly).toBeLessThan(0.1 * byTime);
    // At the figures: about 1.37 against 0.086 at 512 samples, a ratio of about 16.
    expect(byTime / byAnomaly).toBeGreaterThan(15);
  });

  it("is unchanged by sampling being the engine default for any path that does not ask: those stay even in time at 256", () => {
    expect(DEFAULT_PATH_SAMPLE_COUNT).toBe(256);
    expect(DEFAULT_ECCENTRIC_SAMPLE_COUNT).toBe(512);
  });

  it("runs from the span's start to its end exactly, in increasing order, with aphelion in the middle", () => {
    expect(eccentric).toHaveLength(DEFAULT_ECCENTRIC_SAMPLE_COUNT);
    expect(eccentric[0]).toBe(SPAN.startUtcMs);
    expect(eccentric[eccentric.length - 1]).toBe(SPAN.endUtcMs);
    for (let k = 1; k < eccentric.length; k += 1) expect(eccentric[k]).toBeGreaterThan(eccentric[k - 1]);
    const near = Math.round(SPAN.startUtcMs + ECCENTRIC_PERIOD_MS / 2);
    const closest = eccentric.reduce((a, b) => (Math.abs(b - near) < Math.abs(a - near) ? b : a));
    expect(Math.abs(closest - near)).toBeLessThan(ECCENTRIC_PERIOD_MS / 400);
  });

  it("solves Kepler's equation to machine precision, for unwrapped mean anomalies of any size", () => {
    for (const e of [0, 0.2, 0.9, 0.96, 0.999]) {
      for (const mean of [-20, -3, -0.001, 0, 0.001, 1, Math.PI, 5, 40]) {
        const anomaly = eccentricAnomalyFromMean(mean, e);
        expect(anomaly - e * Math.sin(anomaly)).toBeCloseTo(mean, 11);
      }
    }
  });

  it("is a time spacing for a circular orbit, and a window of several turns stays increasing", () => {
    const circle = eccentricPathTimesUtcMs({ startUtcMs: 0, endUtcMs: 1000 }, 11, { eccentricity: 0, periodMs: 1000, periapsisUtcMs: 0 });
    expect(circle).toEqual(pathTimesUtcMs({ startUtcMs: 0, endUtcMs: 1000 }, 11));
    const turns = eccentricPathTimesUtcMs({ startUtcMs: -3000, endUtcMs: 5000 }, 200, { eccentricity: 0.9, periodMs: 1000, periapsisUtcMs: 123 });
    for (let k = 1; k < turns.length; k += 1) expect(turns[k]).toBeGreaterThanOrEqual(turns[k - 1]);
  });

  it("refuses an unbound orbit, a bad period and a one-sample path", () => {
    expect(() => eccentricPathTimesUtcMs(SPAN, 5, { ...ECCENTRIC_SAMPLING, eccentricity: 1 })).toThrow(/eccentricity/);
    expect(() => eccentricPathTimesUtcMs(SPAN, 5, { ...ECCENTRIC_SAMPLING, periodMs: 0 })).toThrow(/period/);
    expect(() => eccentricPathTimesUtcMs(SPAN, 1, ECCENTRIC_SAMPLING)).toThrow(/at least 2/);
    expect(() => eccentricPathTimesUtcMs({ startUtcMs: 5, endUtcMs: 5 }, 5, ECCENTRIC_SAMPLING)).toThrow(/end after/);
  });
});

describe("a path with eccentric sampling is declared and drawn like any other", () => {
  it("passes through the source's own positions at the sample times", () => {
    const view = new PathView(syntheticEccentricPath);
    expect(view.timesUtcMs).toHaveLength(DEFAULT_ECCENTRIC_SAMPLE_COUNT);
    view.timesUtcMs.forEach((time, k) => {
      const expected = eccentricSource.stateAt(time, "sun").positionKm;
      for (let axis = 0; axis < 3; axis += 1) expect(view.samplesKm[3 * k + axis]).toBe(expected[axis]);
    });
    expect(view.maxRadiusKm / AU_KM).toBeCloseTo(26 * 1.96, 0);
  });

  it("validates its sampling and refuses it on a rolling window", () => {
    expect(() => validatePathSpec("p", syntheticEccentricPath)).not.toThrow();
    expect(() => validatePathSpec("p", { ...syntheticEccentricPath, sampling: { ...ECCENTRIC_SAMPLING, eccentricity: 1.2 } })).toThrow(/sampling eccentricity/);
    expect(() => validatePathSpec("p", { ...syntheticEccentricPath, sampling: { ...ECCENTRIC_SAMPLING, periodMs: -1 } })).toThrow(/periodMs/);
    expect(() => validatePathSpec("p", { ...syntheticEccentricPath, span: { windowMs: 86_400_000 }, samples: 5 } as PathLayer)).toThrow(/fixed span/);
  });
});

describe("the made-up belt with its 51 AU orbit frames the whole orbit at true scale", () => {
  const placement = placementAbout("sun", adapter);
  const view = new PathView(syntheticEccentricPath);
  view.sync(SPAN.startUtcMs, placement, trueScale);
  const centre = view.absolute();
  const extent = view.extentUnits(trueScale);
  const framing = fitDistance(extent, 45);
  const reach = syntheticEccentricDefinition.camera!;

  it("is centred on the middle of the line, not on the crowded end", () => {
    // The orbit is about 51 AU long; its middle is about 25 AU from the Sun, well away from the vertex mean near periapsis.
    const sunDistanceUnits = Math.hypot(...centre);
    expect(sunDistanceUnits / ((26 * AU_KM) / 6371.0084)).toBeGreaterThan(0.8);
  });

  it("asks for a framing distance the declared camera reach allows, and a far plane beyond the whole orbit", () => {
    expect(framing).toBeLessThanOrEqual(reach.maxFocusDistance!);
    expect(reach.far!).toBeGreaterThan(reach.maxFocusDistance!);
    const aphelionUnits = (51 * AU_KM) / 6371.0084;
    expect(reach.far!).toBeGreaterThan(framing + aphelionUnits);
  });

  it("puts every vertex of the orbit inside a 45 degree, 16:10 view at that distance, looked at from any of 86 directions", () => {
    const camera = new PerspectiveCamera(45, 1.6, 0.05, reach.far);
    const vertices = Array.from({ length: view.timesUtcMs.length }, (_v, k) => new Vector3(...view.vertexAbsolute(k)));
    let worst = 0;
    const directions: Vector3[] = [];
    for (let latitude = -75; latitude <= 75; latitude += 25) for (let longitude = 0; longitude < 360; longitude += 30) directions.push(new Vector3(Math.cos((latitude * Math.PI) / 180) * Math.cos((longitude * Math.PI) / 180), Math.sin((latitude * Math.PI) / 180), Math.cos((latitude * Math.PI) / 180) * Math.sin((longitude * Math.PI) / 180)));
    directions.push(new Vector3(0, 1, 0), new Vector3(0, -1, 0));
    const centreVector = new Vector3(...centre);
    for (const direction of directions) {
      camera.position.copy(centreVector).addScaledVector(direction, framing);
      camera.up.set(0, 1, 0);
      if (Math.abs(direction.y) > 0.999) camera.up.set(0, 0, 1);
      camera.lookAt(centreVector);
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      for (const vertex of vertices) {
        const ndc = vertex.clone().project(camera);
        worst = Math.max(worst, Math.abs(ndc.x), Math.abs(ndc.y));
      }
    }
    expect(directions).toHaveLength(86);
    expect(worst).toBeLessThanOrEqual(1);
  });

  it("holds the aphelion vertex, 51 AU out, to under 0.07 scaled units (about 440 km) in the GPU's Float32 with the Sun at the origin", () => {
    const origin = new FloatingOrigin();
    origin.set(view.absolute().map(() => 0));
    view.place(origin);
    let worstUnits = 0;
    let atAphelion = 0;
    for (let k = 0; k < view.timesUtcMs.length; k += 1) {
      const local = view.vertexLocal(k);
      const exact = view.vertexAbsolute(k);
      const error = Math.hypot(local[0] - exact[0], local[1] - exact[1], local[2] - exact[2]);
      if (Math.hypot(...exact) > atAphelion) atAphelion = Math.hypot(...exact);
      worstUnits = Math.max(worstUnits, error);
    }
    expect(atAphelion * 6371.0084 / AU_KM).toBeGreaterThan(50);
    // Float32 spacing between 2^20 and 2^21 units is 0.125, so the nearest representable value is within 0.0625 per axis.
    expect(worstUnits).toBeLessThan(0.11);
    expect(worstUnits * 6371.0084).toBeLessThan(700);
  });
});
