// O-099 T-445: an orbit line stays on its body. The distance from the body's true position (and the true path an hour either side) to the line
// as `PathView` drew it, in the body's own radii, at true scale: across one turn from the opening time, and while playing 120 days at 3 years on
// and 5 years before. Planets read their Sun-orbit line (`sunOrbitLayer`, planet series loaded by the test setup); moons their composition line.
// Io's fits are loaded here for 2016 only (as vitest.moons.setup.ts does), so Io plays its turn and two 120-day stretches inside that year.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { JUPITER_MOON_SYSTEM, loadJupiterMoons } from "../src/core/bodies/jupiterMoons";
import { readBytes } from "../tools/import/test-io.mjs";
import { PerspectiveCamera } from "three";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import type { BodyId, CenterId } from "../src/core/body";
import { sunOrbitLayer } from "../src/api/sunOrbit";
import { compositionPathView, PathView } from "../src/app/PathView";
import { fineTimeMs, HEAD_BUDGET, HEAD_SUBSTEPS } from "../src/app/orbitLineRule";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { trueScale } from "../src/presentation/scalePolicy";
import type { Trajectory } from "../src/core/trajectory";
import { placementAbout } from "./scenePlacement";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const YEAR = 365.25 * DAY;
const T0 = Date.UTC(2026, 0, 1);
const BOUND = 0.05;
const camera = new PerspectiveCamera();

const scaled = (km: ArrayLike<number>) => eqjToRenderVector(trueScale.mapPosition([km[0]!, km[1]!, km[2]!]));
const unitsPerKm = trueScale.mapPosition([1e6, 0, 0])[0] / 1e6;

/** Distance from a point to the drawn polyline (vertices as synced, scaled absolute). */
function distanceToLine(view: PathView, p: readonly number[]): number {
  const count = view.screenReadout(camera).vertices;
  let best = Infinity;
  for (let i = 0; i + 1 < count; i += 1) {
    const a = view.vertexAbsolute(i);
    const b = view.vertexAbsolute(i + 1);
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap = [p[0]! - a[0], p[1]! - a[1], p[2]! - a[2]];
    const len2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
    const s = len2 === 0 ? 0 : Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / len2));
    best = Math.min(best, Math.hypot(ap[0] - s * ab[0], ap[1] - s * ab[1], ap[2] - s * ab[2]));
  }
  return best;
}

beforeAll(async () => {
  const fits = `${dirname(createRequire(import.meta.url).resolve("astraeus-data-jupiter/package.json"))}/data/jupiter-moons/`;
  JUPITER_MOON_SYSTEM.provideIndex(async () => JSON.parse(await readFile(`${fits}index.json`, "utf8")) as unknown);
  await loadJupiterMoons({
    window: { startUtcMs: Date.UTC(2016, 1, 10), endUtcMs: Date.UTC(2016, 11, 30) },
    bodies: ["io"],
    chunkUrls: new Proxy(
      {},
      { get: (_target, path: string) => (path.endsWith("/2016.bin") ? `${fits}${path}` : undefined) },
    ) as Record<string, string>,
    fetchBytes: async (path) => readBytes(path),
  });
});

interface Case {
  readonly id: BodyId;
  /** The opening time, and the starts of the two 120-day stretches. */
  readonly times: readonly [number, number, number];
  readonly centre: CenterId;
  readonly view: () => PathView;
  readonly body: Trajectory;
}

const sunPlacement = placementAbout("sun");
const planet = (id: BodyId): Case => {
  const layer = sunOrbitLayer(catalogue, id, T0, "")!;
  return {
    id,
    centre: "sun",
    times: [T0, T0 + 3 * YEAR, T0 - 5 * YEAR],
    view: () => new PathView(layer),
    body: layer.source,
  };
};
const moon = (id: BodyId, times: readonly [number, number, number]): Case => {
  const { parentId, orbitPeriodDays } = catalogue.get(id).definition;
  const placement = placementAbout(parentId!);
  return {
    id,
    centre: parentId!,
    times,
    view: () => compositionPathView({ body: id, spanMs: orbitPeriodDays! * DAY }, placement.resolver),
    body: { body: id, stateAt: (t, c = parentId!) => placement.resolver.stateOf(id, t, c) },
  };
};

/** The worst gap, in body radii, playing from `from` in `count` steps of `stepMs` (each frame placed, as the scene does). */
function worstGap(c: Case, from: number, stepMs: number, count: number): number {
  const view = c.view();
  const placement = c.centre === "sun" ? sunPlacement : placementAbout(c.centre);
  const radius = catalogue.get(c.id).definition.radiusKm * unitsPerKm;
  const origin = new FloatingOrigin();
  let worst = 0;
  for (let k = 0; k < count; k += 1) {
    // Off any grid: a prime number of minutes past each step.
    const t = Math.round(from + k * stepMs + ((k * 7919) % 997) * 60_000);
    view.sync(t, placement, trueScale, k * 1000);
    view.place(origin);
    for (const dt of [0, -HOUR, HOUR]) {
      const gap = distanceToLine(view, scaled(c.body.stateAt(t + dt, c.centre).positionKm)) / radius;
      worst = Math.max(worst, gap);
    }
  }
  if (process.env.GAP_LOG) console.log(`GAP ${c.id} ${new Date(from).toISOString().slice(0, 10)} ${worst.toFixed(4)}`);
  return worst;
}

const cases: readonly Case[] = [
  planet("earth"),
  planet("mars"),
  planet("jupiter"),
  moon("moon", [T0, T0 + 3 * YEAR, T0 - 5 * YEAR]),
  moon("io", [Date.UTC(2016, 5, 1), Date.UTC(2016, 7, 1), Date.UTC(2016, 2, 1)]),
];

describe.each(cases)("the $id orbit line", (c) => {
  const turnMs = () => {
    const view = c.view();
    view.sync(c.times[0], c.centre === "sun" ? sunPlacement : placementAbout(c.centre), trueScale, 0);
    const times = view.timesUtcMs;
    return times[times.length - 1]! - times[0]!;
  };

  it("stays on the body across one turn from the opening time", () => {
    expect(worstGap(c, c.times[0], turnMs() / 60, 60)).toBeLessThan(BOUND);
  });

  it("stays on the body playing 120 days later (3 years on; Io: August 2016)", () => {
    expect(worstGap(c, c.times[1], (120 * DAY) / 40, 40)).toBeLessThan(BOUND);
  });

  it("stays on the body playing 120 days earlier (5 years before; Io: March 2016)", () => {
    expect(worstGap(c, c.times[2], (120 * DAY) / 40, 40)).toBeLessThan(BOUND);
  });
});

describe("an orbit line's turn and head", () => {
  const earthLayer = sunOrbitLayer(catalogue, "earth", T0, "")!;
  const turn = earthLayer.span as { startUtcMs: number; endUtcMs: number };
  const turnMs = turn.endUtcMs - turn.startUtcMs;

  it("re-samples a turn without moving a far point that stays in it", () => {
    const view = new PathView(earthLayer);
    view.sync(T0, sunPlacement, trueScale, 0);
    const before = new Map(view.timesUtcMs.map((t, i) => [t, Array.from(view.samplesKm.subarray(3 * i, 3 * i + 3))]));
    view.sync(T0 + 0.3 * turnMs, sunPlacement, trueScale, 1);
    const shared = view.timesUtcMs.filter((t) => before.has(t));
    expect(shared.length).toBeGreaterThan(view.timesUtcMs.length / 2);
    view.timesUtcMs.forEach((t, i) => {
      if (before.has(t)) expect(Array.from(view.samplesKm.subarray(3 * i, 3 * i + 3))).toEqual(before.get(t));
    });
  });

  it("asks the source for at most the live place and a few head points a frame, and only the live place once the head is filled", () => {
    let calls = 0;
    const source: Trajectory = {
      ...earthLayer.source,
      stateAt: (t, c) => {
        calls += 1;
        return earthLayer.source.stateAt(t, c);
      },
    };
    const view = new PathView({ ...earthLayer, source });
    const fineMs = turnMs / 360 / HEAD_SUBSTEPS;
    const start = fineTimeMs(Math.floor(T0 / fineMs), fineMs) + 60_000;
    view.sync(start, sunPlacement, trueScale, 0);
    const perFrame: number[] = [];
    for (let k = 1; k <= 20; k += 1) {
      calls = 0;
      view.sync(start + k * 60_000, sunPlacement, trueScale, k);
      perFrame.push(calls);
    }
    expect(Math.max(...perFrame)).toBeLessThanOrEqual(1 + HEAD_BUDGET);
    expect(perFrame.slice(-5)).toEqual([1, 1, 1, 1, 1]);
  });

  it("re-fits an osculating ellipse at the display time when it re-samples, spaced by eccentric anomaly", () => {
    const layer = sunOrbitLayer(catalogue, "uranus", T0, "")!;
    expect(layer.sampling).toBeDefined();
    const at = T0 - 25 * YEAR;
    const view = new PathView(layer);
    view.sync(at, sunPlacement, trueScale, 0);
    const times = view.timesUtcMs;
    const gaps = times.slice(1).map((t, i) => t - times[i]!);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(0.01 * Math.max(...gaps));
    const middle = times.findIndex((t) => t >= at);
    const series = catalogue.get("uranus").source!.create(createOrbAstronomyAdapter()).stateAt(times[middle]!, "sun");
    const drawn = view.samplesKm.subarray(3 * middle, 3 * middle + 3);
    const stale = layer.source.stateAt(times[middle]!, "sun").positionKm;
    const off = (p: ArrayLike<number>) =>
      Math.hypot(p[0]! - series.positionKm[0], p[1]! - series.positionKm[1], p[2]! - series.positionKm[2]);
    if (process.env.GAP_LOG)
      console.log(`OSC refit ${off(drawn).toFixed(0)} km, opening ellipse ${off(stale).toFixed(0)} km`);
    expect(off(drawn) * 10).toBeLessThan(off(stale));
  });
});
