import { describe, expect, it } from "vitest";
import { Line, PerspectiveCamera } from "three";
import { earthMoonSystem, SIDEREAL_MONTH_MS } from "../src/assets/compositions";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import type { CenterId } from "../src/core/body";
import { createProvenance } from "../src/core/provenance";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { createState, EQJ } from "../src/core/state";
import type { Trajectory } from "../src/core/trajectory";
import { samplePathKm } from "../src/core/sunCentredSources";
import { DEFAULT_WINDOW_SAMPLE_COUNT, validatePathSpec, type PathLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { COMPOSITION_PATH_STYLE, PathView, compositionPathLayer } from "../src/app/PathView";
import { inertialTrailKm, orbitKm, pathNeedsRefresh, relativeTrailKm, rootFrameKm } from "../src/app/pathRules";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { travelledCount } from "../src/app/mission";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { apollo11Mission } from "../src/experiences/apollo11/apollo11";
import { placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 3, 1, 12);
const SPAN = { startUtcMs: T0, endUtcMs: T0 + 40 * DAY };
const objectOf = (id: string) => ({ id, label: id, provenance });

/** A made-up source measured from `native` that circles at 5e5 km with a 10-day period. */
function circling(native: CenterId): Trajectory {
  return {
    body: "made-up",
    stateAt(timeUtcMs, center = native) {
      if (center !== native) throw new RangeError(`made-up source is measured from ${native}`);
      const angle = ((timeUtcMs - T0) / (10 * DAY)) * 2 * Math.PI;
      return createState({ body: "made-up", center: native, timeUtcMs, frame: EQJ, positionKm: [5e5 * Math.cos(angle), 5e5 * Math.sin(angle), 1e5], orientation: null });
    },
  };
}

/** A made-up source standing still in the root (Sun-centred) frame. */
const STILL_KM = [3e8, -1e8, 2e7];
const stationary: Trajectory = {
  body: "still",
  stateAt: (timeUtcMs) => createState({ body: "still", center: "sun", timeUtcMs, frame: EQJ, positionKm: STILL_KM, orientation: null }),
};

const layer = (rule: Partial<PathLayer>, source: Trajectory, samples = 21): PathLayer => ({
  kind: "orbit",
  color: "#ffffff",
  source,
  span: SPAN,
  samples,
  object: objectOf("p"),
  ...rule,
} as PathLayer);

const expectClose = (actual: ArrayLike<number>, expected: ArrayLike<number>, tolKm = 1e-6) => {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i += 1) expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolKm);
};

describe("a path declaration names its rule", () => {
  const ok = layer({ kind: "orbit" }, circling("earth"));
  it("accepts an orbit (with or without a centre), both trails, and a rolling span", () => {
    expect(() => validatePathSpec("p", ok)).not.toThrow();
    expect(() => validatePathSpec("p", layer({ kind: "orbit", center: "earth" }, circling("earth")))).not.toThrow();
    expect(() => validatePathSpec("p", layer({ kind: "trail", frame: "relative" }, circling("earth")))).not.toThrow();
    expect(() => validatePathSpec("p", layer({ kind: "trail", frame: "inertial" }, circling("earth")))).not.toThrow();
    expect(() => validatePathSpec("p", layer({ span: { windowMs: DAY } }, circling("earth"), 5))).not.toThrow();
  });

  it.each([
    ["no kind", { kind: undefined }, /path "p" kind must be "orbit" or "trail"/],
    ["an unknown kind", { kind: "loop" }, /kind must be "orbit" or "trail", got loop/],
    ["a trail without a frame", { kind: "trail" }, /frame must be "relative" or "inertial"/],
    ["a trail with a bad frame", { kind: "trail", frame: "sidereal" }, /frame must be "relative" or "inertial", got sidereal/],
    ["an uncatalogued centre", { kind: "orbit", center: "vulcan" }, /center "vulcan" is not a catalogued body/],
    ["a bad window", { span: { windowMs: 0 } }, /windowMs must be positive/],
    ["an even sample count on a window", { span: { windowMs: DAY }, samples: 4 }, /odd whole number/],
    ["a reversed span", { span: { startUtcMs: T0 + 1, endUtcMs: T0 } }, /must end after it starts/],
  ])("names the field for %s", (_what, over, message) => {
    expect(() => validatePathSpec("p", layer(over as Partial<PathLayer>, circling("earth")))).toThrow(message);
  });
});

describe("an orbit is the same shape wherever the scene centre is", () => {
  const t = T0 + 3 * DAY;
  const source = circling("earth");
  const km = samplePathKm(source, SPAN, 21);

  it("changes only by one rigid translation between scene centres", () => {
    const inEarth = orbitKm(km, "earth", placementAbout("earth", adapter), t);
    const inMoon = orbitKm(km, "earth", placementAbout("moon", adapter), t);
    const inSun = orbitKm(km, "earth", placementAbout("sun", adapter), t);
    for (const [a, b] of [[inEarth, inMoon], [inEarth, inSun]] as const) {
      const first = [0, 1, 2].map((k) => b[k] - a[k]);
      for (let i = 0; i < a.length; i += 3) expectClose([b[i] - a[i], b[i + 1] - a[i + 1], b[i + 2] - a[i + 2]], first, 1e-4);
    }
    // The translation is the centre's place from the scene centre at the clock time.
    const earthFromMoon = placementAbout("moon", adapter).resolver.offsetKm("earth", "moon", t);
    expectClose([inMoon[0] - inEarth[0], inMoon[1] - inEarth[1], inMoon[2] - inEarth[2]], earthFromMoon, 1e-4);
  });

  it("is drawn about its own centre: a scene centred there draws the samples as they are", () => {
    expect(orbitKm(km, "earth", placementAbout("earth", adapter), t)).toBe(km);
  });

  it("through a view, places each vertex at the clock time's offset, whatever the clock time is", () => {
    for (const clock of [t, t + 7 * DAY]) {
      const placement = placementAbout("moon", adapter);
      const view = new PathView(layer({ kind: "orbit" }, source));
      view.sync(clock, placement, trueScale);
      const shift = placement.resolver.offsetKm("earth", "moon", clock);
      for (const k of [0, 10, 20]) {
        const expected = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((c) => view.samplesKm[3 * k + c] + shift[c])));
        expectClose(view.vertexAbsolute(k), expected, 1e-9);
      }
      expect(view.frame).toBe("earth");
    }
  });
});

describe("a path reports itself to the browser checks (I-040)", () => {
  const t = T0 + 3 * DAY;
  const placed = (view: PathView, cameraZ: number) => {
    view.sync(t, placementAbout("earth", adapter), trueScale);
    view.place(new FloatingOrigin());
    const camera = new PerspectiveCamera(50, 1, 1e-3, 1e12);
    camera.position.set(0, 0, cameraZ);
    camera.updateMatrixWorld();
    return view.screenReadout(camera);
  };

  it("counts the line's vertices in view and the share of the view they span, and none when it is out of view", () => {
    const view = new PathView(layer({ kind: "orbit" }, circling("earth")));
    const size = Math.max(...Array.from(view.samplesKm, Math.abs));
    const unit = trueScale.mapPosition([size, 0, 0])[0];
    const near = placed(view, unit * 4);
    expect(near.visible).toBe(true);
    expect(near.vertices).toBe(21);
    expect(near.inView).toBe(21);
    expect(near.maxX - near.minX).toBeGreaterThan(0.2);
    const behind = placed(view, -unit * 4);
    expect(behind.inView).toBe(0);
  });

  it("is not visible when the group is hidden", () => {
    const view = new PathView(layer({ kind: "orbit" }, circling("earth")));
    view.group.visible = false;
    expect(placed(view, 1).visible).toBe(false);
  });
});

describe("a relative trail is each sample from the scene centre at the sample's own time", () => {
  const source = circling("earth");
  const times = Array.from({ length: 21 }, (_v, k) => Math.round(SPAN.startUtcMs + ((SPAN.endUtcMs - SPAN.startUtcMs) * k) / 20));
  const km = samplePathKm(source, SPAN, 21);

  it.each(["earth", "moon", "sun"] as const)("equals sample + the scene centre's offset at each sample time (centre %s)", (centre) => {
    const placement = placementAbout(centre, adapter);
    const drawn = relativeTrailKm({ timesUtcMs: times, positionsKm: km }, "earth", placement);
    times.forEach((time, i) => {
      const expected = [0, 1, 2].map((c) => km[3 * i + c] + placement.resolver.stateOf("earth", time, centre).positionKm[c]);
      expectClose(drawn.subarray(3 * i, 3 * i + 3), expected);
    });
  });

  it("is the same view output as the rule, and is not recomputed per frame", () => {
    const placement = placementAbout("moon", adapter);
    const view = new PathView(layer({ kind: "trail", frame: "relative" }, source));
    view.sync(SPAN.startUtcMs, placement, trueScale);
    const first = view.vertexAbsolute(5);
    view.sync(SPAN.endUtcMs, placement, trueScale);
    expect(Array.from(view.vertexAbsolute(5))).toEqual(Array.from(first));
  });
});

describe("an inertial trail is root-frame samples offset by the scene centre at the display time", () => {
  const source = circling("earth");
  const times = Array.from({ length: 21 }, (_v, k) => Math.round(SPAN.startUtcMs + ((SPAN.endUtcMs - SPAN.startUtcMs) * k) / 20));
  const km = samplePathKm(source, SPAN, 21);
  const display = T0 + 12 * DAY;

  it.each(["earth", "moon", "sun"] as const)("equals sample + native-from-Sun at the sample time - centre-from-Sun at the display time (centre %s)", (centre) => {
    const placement = placementAbout(centre, adapter);
    const samples = { timesUtcMs: times, positionsKm: km };
    const drawn = inertialTrailKm(rootFrameKm(samples, "earth", placement), placement, display);
    const centreFromSun = placement.resolver.stateOf(centre, display, "sun").positionKm;
    times.forEach((time, i) => {
      const earthFromSun = placement.resolver.stateOf("earth", time, "sun").positionKm;
      const expected = [0, 1, 2].map((c) => km[3 * i + c] + earthFromSun[c] - centreFromSun[c]);
      expectClose(drawn.subarray(3 * i, 3 * i + 3), expected, 1e-3);
    });
  });

  it("recomputes only the centre's offset when the clock moves", () => {
    const placement = placementAbout("moon", adapter);
    const view = new PathView(layer({ kind: "trail", frame: "inertial" }, source));
    view.sync(display, placement, trueScale);
    const a = view.vertexAbsolute(5);
    view.sync(display + 3 * DAY, placement, trueScale);
    const b = view.vertexAbsolute(5);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeGreaterThan(0);
  });
});

describe("a moving scene centre with an object stationary in the root frame", () => {
  const placement = placementAbout("earth", adapter);
  const times = Array.from({ length: 21 }, (_v, k) => T0 + k * 2 * DAY);
  const km = Float64Array.from(times.flatMap(() => STILL_KM));
  const samples = { timesUtcMs: times, positionsKm: km };

  it("collapses the inertial trail to one point", () => {
    const drawn = inertialTrailKm(rootFrameKm(samples, "sun", placement), placement, T0 + 20 * DAY);
    const earthFromSun = placement.resolver.stateOf("earth", T0 + 20 * DAY, "sun").positionKm;
    for (let i = 0; i < times.length; i += 1) {
      expectClose(drawn.subarray(3 * i, 3 * i + 3), [0, 1, 2].map((c) => STILL_KM[c] - earthFromSun[c]), 1e-3);
      expectClose(drawn.subarray(3 * i, 3 * i + 3), drawn.subarray(0, 3), 1e-6);
    }
  });

  it("makes the relative trail mirror the centre's own motion", () => {
    const drawn = relativeTrailKm(samples, "sun", placement);
    const spread = Math.hypot(drawn[0] - drawn[60], drawn[1] - drawn[61], drawn[2] - drawn[62]);
    expect(spread).toBeGreaterThan(1e7);
    times.forEach((time, i) => {
      const earthFromSun = placement.resolver.stateOf("earth", time, "sun").positionKm;
      // sample - centre-from-Sun at the sample time: the centre's motion, negated.
      expectClose(drawn.subarray(3 * i, 3 * i + 3), [0, 1, 2].map((c) => STILL_KM[c] - earthFromSun[c]), 1e-3);
    });
  });

  it("through views: the inertial view's vertices coincide, the relative view's do not", () => {
    const inertial = new PathView(layer({ kind: "trail", frame: "inertial" }, stationary, 11));
    const relative = new PathView(layer({ kind: "trail", frame: "relative" }, stationary, 11));
    inertial.sync(T0 + 30 * DAY, placement, trueScale);
    relative.sync(T0 + 30 * DAY, placement, trueScale);
    const dist = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    expect(dist(inertial.vertexAbsolute(0), inertial.vertexAbsolute(10))).toBeLessThan(1e-9);
    expect(dist(relative.vertexAbsolute(0), relative.vertexAbsolute(10))).toBeGreaterThan(1);
  });
});

describe("the Moon's monthly path is the Earth-Moon composition's declared orbit", () => {
  /** The sampler this Task removed from orbitPath.ts, kept here as the reference the declared path must equal. */
  function legacySampleOrbitPath(trajectory: Trajectory, centerUtcMs: number, windowMs: number, sampleCount: number) {
    const half = (sampleCount - 1) / 2;
    const timesUtcMs: number[] = [];
    const positionsKm = new Float64Array(sampleCount * 3);
    for (let index = 0; index < sampleCount; index += 1) {
      const timeUtcMs = index === half ? centerUtcMs : Math.round(centerUtcMs + ((index - half) / half) * (windowMs / 2));
      timesUtcMs.push(timeUtcMs);
      positionsKm.set(trajectory.stateAt(timeUtcMs, "earth").positionKm, index * 3);
    }
    return { timesUtcMs, positionsKm };
  }
  const placement = placementAbout("earth", adapter);
  const declared = earthMoonSystem.paths![0];
  const dates = [Date.UTC(2023, 0, 15, 3), Date.UTC(2024, 6, 1, 12), Date.UTC(2025, 2, 20, 9, 30)];
  const moon: Trajectory = { body: "moon", stateAt: (t, c = "earth") => placement.resolver.stateOf("moon", t, c) };

  it("is declared on the composition as a month-long window", () => {
    expect(declared).toEqual({ body: "moon", spanMs: SIDEREAL_MONTH_MS });
    const spec = compositionPathLayer(declared, placement.resolver);
    expect(spec).toMatchObject({ kind: "orbit", center: "earth", span: { windowMs: SIDEREAL_MONTH_MS } });
    expect(spec.object.showLabel).toBe(false); // orbit labels off by default in every demo (owner, 2026-10-18)
  });

  it.each(dates.map((d) => [new Date(d).toISOString(), d] as const))("has today's vertices and times at %s", (_label, date) => {
    const view = new PathView(compositionPathLayer(declared, placement.resolver), COMPOSITION_PATH_STYLE);
    view.sync(date, placement, readableScale, 0);
    const reference = legacySampleOrbitPath(moon, date, SIDEREAL_MONTH_MS, DEFAULT_WINDOW_SAMPLE_COUNT);
    expect(Array.from(view.timesUtcMs)).toEqual(reference.timesUtcMs);
    expect(Array.from(view.samplesKm)).toEqual(Array.from(reference.positionsKm));
    // And as drawn: scaled absolute positions are the samples through the policy and render axes (Earth-centred: nothing added).
    for (const k of [0, 45, 90, 135, 180]) {
      expect(Array.from(view.vertexAbsolute(k))).toEqual(Array.from(eqjToRenderVector(readableScale.mapPosition(reference.positionsKm.subarray(3 * k, 3 * k + 3)))));
    }
  });

  it("keeps its refresh policy: a seek rebuilds, a small move or a fast drift does not", () => {
    const view = new PathView(compositionPathLayer(declared, placement.resolver), COMPOSITION_PATH_STYLE);
    const centreTime = () => view.timesUtcMs[(view.timesUtcMs.length - 1) / 2];
    view.sync(dates[0], placement, trueScale, 1000);
    expect(centreTime()).toBe(dates[0]);
    view.sync(dates[0] + 60_000, placement, trueScale, 2000);
    expect(centreTime()).toBe(dates[0]);
    view.sync(dates[0] + 2 * 3_600_000, placement, trueScale, 1100);
    expect(centreTime()).toBe(dates[0]);
    view.sync(dates[0] + 2 * 3_600_000, placement, trueScale, 2000);
    expect(centreTime()).toBe(dates[0] + 2 * 3_600_000);
    view.sync(dates[0] + 20 * DAY, placement, trueScale, 2001);
    expect(centreTime()).toBe(dates[0] + 20 * DAY);
    expect(pathNeedsRefresh(dates[0], SIDEREAL_MONTH_MS, dates[0] + 60_000, 1000, 0)).toBe(false);
  });

  it("carries with Earth in a Moon-centred scene by the offset the resolver gives", () => {
    const moonCentred = placementAbout("moon", adapter);
    const view = new PathView(compositionPathLayer(declared, moonCentred.resolver), COMPOSITION_PATH_STYLE);
    view.sync(dates[1], moonCentred, trueScale, 0);
    const shift = moonCentred.resolver.offsetKm("earth", "moon", dates[1]);
    const km = [0, 1, 2].map((c) => view.samplesKm[3 * 90 + c] + shift[c]);
    expectClose(view.vertexAbsolute(90), eqjToRenderVector(trueScale.mapPosition(km)), 1e-9);
  });
});

describe("a tracked body's path is a relative trail", () => {
  const columbia = apollo11Mission.bodies[0];
  const { startUtcMs, endUtcMs } = columbia.trajectory.bounds;
  const times3 = [startUtcMs + 0.2 * (endUtcMs - startUtcMs), startUtcMs + 0.5 * (endUtcMs - startUtcMs), startUtcMs + 0.8 * (endUtcMs - startUtcMs)];

  it("declares its rule", () => {
    expect(TrackedBodyView.pathRule).toEqual({ kind: "trail", frame: "relative" });
  });

  it.each(["earth", "moon", "sun"] as const)("draws the same vertices as the formula it replaced (centre %s, three times)", (centre) => {
    const placement = placementAbout(centre, adapter);
    const camera = new PerspectiveCamera();
    for (const time of times3) {
      const view = new TrackedBodyView(columbia);
      const origin = new FloatingOrigin();
      view.update(time, readableScale, origin, camera, placement);
      const [travelled, future] = view.group.children.slice(0, 2) as Line[];
      const split = travelledCount(columbia.pathTimesUtcMs, time);
      const expectedAt = (i: number) => {
        const t = columbia.pathTimesUtcMs[i];
        const p = columbia.trajectory.stateAt(t).positionKm;
        const o = centre === "earth" ? [0, 0, 0] : placement.resolver.offsetKm("earth", centre, t);
        return eqjToRenderVector(readableScale.mapPosition([0, 1, 2].map((c) => p[c] + o[c])));
      };
      for (const i of [0, Math.floor(split / 2), split - 1]) {
        const position = travelled.geometry.getAttribute("position");
        const got = [position.getX(i), position.getY(i), position.getZ(i)];
        expectClose(got, expectedAt(i), 1e-4 + 1e-6 * Math.hypot(...expectedAt(i)));
      }
      const fp = future.geometry.getAttribute("position");
      const last = columbia.pathTimesUtcMs.length - 1;
      expectClose([fp.getX(last - split + 1), fp.getY(last - split + 1), fp.getZ(last - split + 1)], expectedAt(last), 1e-4 + 1e-6 * Math.hypot(...expectedAt(last)));
    }
  });

  it("is a Columbia inertial trail in a Sun-centred scene: sample + Earth-from-Sun at the sample time, minus the centre at display time", () => {
    const placement = placementAbout("sun", adapter);
    const span = { startUtcMs, endUtcMs };
    const view = new PathView(layer({ kind: "trail", frame: "inertial", span }, columbia.trajectory, 15));
    const display = times3[1];
    view.sync(display, placement, trueScale);
    view.timesUtcMs.forEach((time, i) => {
      const sample = columbia.trajectory.stateAt(time).positionKm;
      const earthFromSun = placement.resolver.stateOf("earth", time, "sun").positionKm;
      const centreFromSun = placement.resolver.stateOf("sun", display, "sun").positionKm;
      const expected = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((c) => sample[c] + earthFromSun[c] - centreFromSun[c])));
      expectClose(view.vertexAbsolute(i), expected, 1e-6);
    });
    expect(view.frame).toBe("earth");
  });
});
