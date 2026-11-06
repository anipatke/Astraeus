// O-059 T-271: helpers the made-up scenes share, written on the public API's own terms (ARCH-01, ARCH-03: nothing real, nothing from the engine's inside).
import type { ElementsBodyRecord, GroupOrbitInput } from "astraeus";

export const AU_KM = 149_597_870.7;
const UNIX_EPOCH_JD = 2_440_587.5;
const DAY_MS = 86_400_000;
const RADIANS = Math.PI / 180;
/** A time as the whole-second UTC text a record asks for. */
const iso = (timeUtcMs: number): string => new Date(timeUtcMs).toISOString().replace(".000Z", "Z");

/** The Julian date of a Unix time in milliseconds. */
export const julianDateOf = (timeUtcMs: number): number => timeUtcMs / DAY_MS + UNIX_EPOCH_JD;

/** A small seeded generator (mulberry32), local so a made-up list is the same every time. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface OrbitShape {
  readonly semiMajorAxisKm: number;
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
}

/** `count` made-up orbits: each element is the base plus a uniform spread of up to the half-width, six draws per orbit so widening one spread never reshuffles the others. */
export function spreadOrbits(prefix: string, count: number, seed: number, base: OrbitShape, spread: OrbitShape): GroupOrbitInput[] {
  const random = seededRandom(seed);
  const keys = ["semiMajorAxisKm", "eccentricity", "inclinationDeg", "raanDeg", "argumentOfPeriapsisDeg"] as const;
  return Array.from({ length: count }, (_, k) => {
    const draw = (key: (typeof keys)[number]): number => base[key] + (2 * random() - 1) * spread[key];
    const orbit = { id: `${prefix}-${String(k + 1).padStart(5, "0")}`, semiMajorAxisKm: draw("semiMajorAxisKm"), eccentricity: draw("eccentricity"), inclinationDeg: draw("inclinationDeg"), raanDeg: draw("raanDeg"), argumentOfPeriapsisDeg: draw("argumentOfPeriapsisDeg") };
    random(); // the sixth draw (where on its orbit): the group places the dots itself
    return orbit;
  });
}

/** The mean anomaly (degrees) of a true anomaly on an orbit of the given eccentricity. */
export function meanAnomalyDegOf(trueAnomalyDeg: number, eccentricity: number): number {
  const nu = trueAnomalyDeg * RADIANS;
  const e = 2 * Math.atan(Math.sqrt((1 - eccentricity) / (1 + eccentricity)) * Math.tan(nu / 2));
  return (((e - eccentricity * Math.sin(e)) / RADIANS) % 360 + 360) % 360;
}

/** A made-up object on a Sun-centred orbit, as `addBodyFromElements` takes it; its elements are placed at `epochUtcMs`, which is also where its accuracy claim starts. */
export function madeUpOrbitRecord(input: { readonly id: string; readonly label: string; readonly epochUtcMs: number; readonly color: string; readonly sizePx: number; readonly what: string; readonly elements: ElementsBodyRecord["elements"] }): ElementsBodyRecord {
  const jd = julianDateOf(input.epochUtcMs);
  return {
    id: input.id,
    label: input.label,
    elements: input.elements,
    epoch: { jd, timeScale: "UTC" },
    plane: "ecliptic-j2000",
    source: { name: `Made up for the ${input.what} test`, url: "https://example.org/made-up", solution: "None; invented elements", accessed: "2026-11-07" },
    accuracy: { classification: "indicative", statement: "None claimed. A two-body orbit with elements chosen for this fixture; not a real object.", valid: { start: iso(input.epochUtcMs), end: iso(input.epochUtcMs + 365 * DAY_MS) }, limitations: ["Made up; not a real object."] },
    marker: { color: input.color, sizePx: input.sizePx },
  };
}
