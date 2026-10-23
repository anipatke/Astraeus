import { moonDataFolder } from "./moonData";
import { readBytes } from "../tools/import/test-io.mjs";
import { describe, expect, it } from "vitest";
import { type BodySetLayer, familiesWithPalette, validateBodySet } from "../src/app/bodySet";
import { OrbitSetView } from "../src/app/OrbitSetView";
import { MARS_MOON_SYSTEM, PLUTO_MOON_SYSTEM } from "../src/core/bodies/planetMoons";
import { createMoonSystem } from "../src/core/bodies/moonSystem";
import plutoIndex from "astraeus-data-pluto/index.json";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createProvenance } from "../src/core/provenance";
import { trueScale } from "../src/core/scalePolicy";
import { placementAbout } from "./scenePlacement";

// O-039 T-133 (I-056): each moon's orbit line spans one true lap. Pluto's moons circle the Pluto-Charon balance point, so their periods come
// from the pair's GM about it and the small moons' lines are drawn about it (round to under 1%), moved to end at the moon (it is on its line).
const DAY_MS = 86_400_000;
const T_JULY = Date.UTC(2016, 6, 1);
const provenance = createProvenance({ sourceType: "ephemeris", sources: ["test"], accuracy: "none", notes: "" });

/** The true sidereal periods (days) of Pluto's moons (JPL SSD satellite mean elements). */
const TRUE_DAYS: Record<string, number> = { charon: 6.3872, styx: 20.16155, nix: 24.85463, kerberos: 32.16756, hydra: 38.20177 };

/** Pluto's system with all five moons' 2016 fits (the test setup loads only the mapped Charon). */
let loaded: ReturnType<typeof createMoonSystem> | undefined;
async function plutoSystem(window: { startUtcMs: number; endUtcMs: number }) {
  if (loaded !== undefined) return loaded;
  loaded = createMoonSystem({ ...PLUTO_MOON_SYSTEM.config, loadIndex: async () => plutoIndex });
  const root = moonDataFolder("pluto");
  const chunkUrls = new Proxy({}, { get: (_target, path: string) => (path.endsWith("/2016.bin") ? `${root}${path}` : undefined) }) as Record<string, string>;
  await loaded.load({ window, bodies: Object.keys(TRUE_DAYS), chunkUrls, fetchBytes: async (url) => readBytes(url) });
  return loaded;
}

async function plutoLayer(balance: boolean): Promise<BodySetLayer> {
  const window = { startUtcMs: Date.UTC(2016, 5, 1), endUtcMs: Date.UTC(2016, 8, 1) };
  const system = await plutoSystem(window);
  const small = ["styx", "nix", "kerberos", "hydra"];
  const group = (id: string, members: string[]) => createEphemerisGroup({ id, center: "pluto", ephemeris: system.ephemeris, members, bounds: window, provenance });
  return validateBodySet({
    id: "pluto-small-moons",
    group: group("pluto-small", small),
    members: small.map((id) => ({ id, label: id, radiusKm: 5, family: "moons" })),
    families: familiesWithPalette([{ id: "moons", label: "Moons" }]),
    bodyFamilies: { charon: "moons" },
    extraOrbits: { group: group("pluto-charon", ["charon"]), families: ["moons"] },
    centreGmKm3S2: PLUTO_MOON_SYSTEM.config.centreGmKm3S2,
    ...(balance ? { balancePoint: PLUTO_MOON_SYSTEM.config.balancePoint } : {}),
  });
}

type Point = [number, number, number];

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Point, b: Point): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point, b: Point): Point => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Point): Point => { const n = Math.hypot(...a); return [a[0] / n, a[1] / n, a[2] / n]; };

/** Solves the 3x3 system `m x = y` by Cramer's rule. */
function solve3(m: number[][], y: number[]): number[] {
  const det = (q: number[][]) => q[0][0] * (q[1][1] * q[2][2] - q[1][2] * q[2][1]) - q[0][1] * (q[1][0] * q[2][2] - q[1][2] * q[2][0]) + q[0][2] * (q[1][0] * q[2][1] - q[1][1] * q[2][0]);
  const d = det(m);
  return [0, 1, 2].map((k) => det(m.map((row, i) => row.map((v, j) => (j === k ? y[i] : v)))) / d);
}

/** The largest departure of the points from their best-fit circle (least squares in their orbit plane), as a share of its radius. */
function roundnessOf(points: readonly Point[]): number {
  const c0 = [0, 1, 2].map((k) => points.reduce((sum, p) => sum + p[k], 0) / points.length) as Point;
  let normal: Point = [0, 0, 0];
  for (let i = 0; i + 1 < points.length; i += 1) {
    const q = cross(sub(points[i], c0), sub(points[i + 1], c0));
    normal = [normal[0] + q[0], normal[1] + q[1], normal[2] + q[2]];
  }
  const n = unit(normal);
  const u = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
  const v = cross(n, u);
  const flat = points.map((p) => [dot(sub(p, c0), u), dot(sub(p, c0), v)]);
  const sums = { x: 0, y: 0, xx: 0, yy: 0, xy: 0, xz: 0, yz: 0, z: 0 };
  for (const [x, y] of flat) {
    const z = x * x + y * y;
    sums.x += x; sums.y += y; sums.xx += x * x; sums.yy += y * y; sums.xy += x * y; sums.xz += x * z; sums.yz += y * z; sums.z += z;
  }
  const [a, b, c] = solve3([[2 * sums.xx, 2 * sums.xy, sums.x], [2 * sums.xy, 2 * sums.yy, sums.y], [2 * sums.x, 2 * sums.y, flat.length]], [sums.xz, sums.yz, sums.z]);
  const radius = Math.sqrt(c + a * a + b * b);
  const centre: Point = [c0[0] + a * u[0] + b * v[0], c0[1] + a * u[1] + b * v[1], c0[2] + a * u[2] + b * v[2]];
  return Math.max(...points.map((p) => Math.abs(Math.hypot(...sub(p, centre)) - radius))) / radius;
}

function pathOf(orbits: OrbitSetView, index: number): Point[] {
  return Array.from({ length: orbits.samples }, (_, i) => orbits.pointKm(index, i));
}

describe("Pluto's moon orbit lines (I-056)", () => {
  it("span one true lap each, with the period from the Pluto-Charon system mass", async () => {
    const orbits = new OrbitSetView(await plutoLayer(true));
    orbits.sync(T_JULY, placementAbout("pluto"), trueScale, true);
    const ids = ["styx", "nix", "kerberos", "hydra", "charon"];
    ids.forEach((id, index) => {
      const laps = orbits.spanMs(index) / (TRUE_DAYS[id] * DAY_MS);
      expect(Math.abs(laps - 1), `${id} laps ${laps.toFixed(3)}`).toBeLessThan(0.02);
    });
  });

  it("draws the four small moons about the balance point, under 1% from round, Charon's line round about Pluto", async () => {
    const orbits = new OrbitSetView(await plutoLayer(true));
    orbits.sync(T_JULY, placementAbout("pluto"), trueScale, true);
    for (let index = 0; index < 5; index += 1) expect(roundnessOf(pathOf(orbits, index)), `line ${index}`).toBeLessThan(0.01);
    // Without the balance point the same lines are not round (the reflex wiggle the owner saw): this is what the data change fixes.
    return plutoLayer(false).then((plain) => {
      const old = new OrbitSetView(plain);
      old.sync(T_JULY, placementAbout("pluto"), trueScale, true);
      expect(roundnessOf(pathOf(old, 0))).toBeGreaterThan(0.01);
      // And with Pluto's mass alone the laps are the wrong count (I-056's measurements: Styx 2.3 laps, Nix 0.71, Charon 1.3).
      const laps = (index: number, id: string) => old.spanMs(index) / (TRUE_DAYS[id] * DAY_MS);
      expect(laps(0, "styx")).toBeGreaterThan(2);
      expect(laps(1, "nix")).toBeLessThan(0.8);
      expect(laps(4, "charon")).toBeGreaterThan(1.2);
    });
  });

  it("keeps each moon on its own line at any time, and keeps the line round as the clock runs", async () => {
    const layer = await plutoLayer(true);
    const orbits = new OrbitSetView(layer);
    const members = [...layer.group.members, ...layer.extraOrbits!.group.members];
    for (const days of [0, 1.3, 5.9, 11.2]) {
      const t = T_JULY + days * DAY_MS;
      orbits.sync(t, placementAbout("pluto"), trueScale, true);
      members.forEach((id, index) => {
        const group = index < 4 ? layer.group : layer.extraOrbits!.group;
        const out = new Float64Array(3);
        group.memberPositionKmInto(index < 4 ? index : 0, t, out, 0);
        const head = orbits.headKm(index);
        expect(Math.hypot(head[0] - out[0], head[1] - out[1], head[2] - out[2]), `${id} head at +${days} d`).toBeLessThan(1e-6);
        // The line the body is on: its sampled points and its head, one round loop, the body among them.
        const line = [...pathOf(orbits, index), ...orbits.headPointsKm(index)];
        expect(roundnessOf(line), `${id} +${days} d`).toBeLessThan(0.012);
      });
    }
  });

  it("leaves a system without a balance point as it was: period and line from the centre's GM alone (Phobos)", async () => {
    const window = { startUtcMs: Date.UTC(2016, 5, 1), endUtcMs: Date.UTC(2016, 8, 1) };
    const layer = validateBodySet({
      id: "mars-test",
      group: createEphemerisGroup({ id: "mars-test", center: "mars", ephemeris: MARS_MOON_SYSTEM.ephemeris, members: ["phobos"], bounds: window, provenance }),
      members: [{ id: "phobos", label: "Phobos", radiusKm: 11, family: "moons" }],
      families: familiesWithPalette([{ id: "moons", label: "Moons" }]),
      centreGmKm3S2: MARS_MOON_SYSTEM.config.centreGmKm3S2,
    });
    expect(layer.balancePoint).toBeUndefined();
    const t = T_JULY;
    const orbits = new OrbitSetView(layer);
    orbits.sync(t, placementAbout("mars"), trueScale, true);
    const periodMs = MARS_MOON_SYSTEM.osculatingPeriodMs(MARS_MOON_SYSTEM.ephemeris(), "phobos", t);
    expect(periodMs / DAY_MS).toBeCloseTo(0.3189, 2);
    expect(orbits.spanMs(0)).toBeCloseTo(periodMs, -4);
    expect(roundnessOf(pathOf(orbits, 0))).toBeLessThan(0.02);
  });
});
