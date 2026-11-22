// O-092 T-429: made-up views (ARCH-03) and the listener the disposal tests share. `owned` finds every geometry, material and texture reachable from a
// root (including a material's `map` and the textures in a shader material's uniforms); `listen` counts each one's `dispose` event.
import { Texture, type BufferGeometry, type Material, type Object3D, type ShaderMaterial } from "three";
import { Scene, earth, mars, moon, sun } from "astraeus";
import { definitionOf } from "./definitionOf";
import { DEFAULT_ORBIT_LOOK } from "../src/assets/orbitLook";
import { familiesWithPalette, validateBodySet, type BodySetLayer } from "../src/app/bodySet";
import { trackedBodiesOf, type GroupLayer, type PathLayer } from "../src/app/experienceDefinition";
import type { SkyFigureLayer } from "../src/app/skyFigures";
import type { ChebyshevEphemeris } from "../src/core/chebyshevEphemeris";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { createState, EQJ } from "../src/core/state";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { syntheticEccentricPath } from "./synthetic/syntheticEccentricDefinition";
import type { RingBand } from "../src/assets/rings";
import type { StarRow } from "../src/assets/sky";

export type Disposable = BufferGeometry | Material | Texture;

/** Every geometry, material and texture reachable from `roots`. */
export function owned(...roots: readonly Object3D[]): Set<Disposable> {
  const found = new Set<Disposable>();
  const addTexture = (value: unknown) => {
    if (value instanceof Texture) found.add(value);
  };
  for (const root of roots) {
    root.traverse((node) => {
      const drawn = node as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      if (drawn.geometry !== undefined) found.add(drawn.geometry);
      if (drawn.material === undefined) return;
      for (const material of Array.isArray(drawn.material) ? drawn.material : [drawn.material]) {
        found.add(material);
        addTexture((material as Material & { map?: unknown }).map);
        for (const uniform of Object.values((material as ShaderMaterial).uniforms ?? {})) addTexture(uniform.value);
      }
    });
  }
  return found;
}

/** Counts each object's `dispose` events from now on. */
export function listen(objects: Iterable<Disposable>): Map<Disposable, number> {
  const heard = new Map<Disposable, number>();
  for (const object of objects) {
    heard.set(object, 0);
    (object as { addEventListener(type: "dispose", fn: () => void): void }).addEventListener("dispose", () =>
      heard.set(object, heard.get(object)! + 1),
    );
  }
  return heard;
}

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });

/** A made-up path over a rolling window: with `look` it carries the orbit look (ring and arc), without it a bare line. */
export const pathLayer: PathLayer = { ...syntheticEccentricPath, sampling: undefined, span: { windowMs: 400 * DAY } };
export const ORBIT_LOOK = DEFAULT_ORBIT_LOOK;

/** A made-up two-body group, big enough that the view also builds its shader-placed (Kepler) child when `count` is large. */
export function belt(count: number): GroupLayer {
  const group = createOrbitGroup(
    {
      id: "belt",
      count,
      center: "sun",
      plane: "ecliptic-j2000",
      epochUtcMs: T0 + 100 * DAY,
      provenance,
      seed: 11,
      bounds: { startUtcMs: T0, endUtcMs: T0 + 400 * DAY },
      base: {
        semiMajorAxisKm: 4.2e8,
        eccentricity: 0.15,
        inclinationDeg: 15,
        raanDeg: 100,
        argumentOfPeriapsisDeg: 200,
        trueAnomalyDeg: 90,
      },
      spread: {
        semiMajorAxisKm: 1e8,
        eccentricity: 0.1,
        inclinationDeg: 10,
        raanDeg: 180,
        argumentOfPeriapsisDeg: 180,
        trueAnomalyDeg: 180,
      },
    },
    createOrbTwoBodyAdapter(),
  );
  return {
    group,
    color: "#7fe3c4",
    object: { id: "belt", label: "belt", description: "Made up.", knownLimitations: ["Made up."] },
  };
}

/** A made-up tracked body: a straight cruise about the Sun. */
export function trackedBody() {
  const samples = Array.from({ length: 11 }, (_, i) => ({
    time: T0 + i * 20 * DAY,
    positionKm: [1.2e8 + i * 1e6, 2e7 * i, 5e6],
  }));
  const scene = new Scene()
    .addBody(sun)
    .addBody(earth, { enlarge: 50 })
    .addBody(mars, { enlarge: 50 })
    .setTime(T0)
    .addTrajectory({ id: "probe", center: "sun", samples });
  return trackedBodiesOf(definitionOf(scene))[0]!;
}

/** A made-up body set: two bodies on circular orbits about a made-up GM. */
export function bodySetLayer(): BodySetLayer {
  const GM = 1e5;
  const radii: Record<string, number> = { alpha: 50_000, beta: 120_000 };
  const at = (id: string, timeUtcMs: number) => {
    const r = radii[id]!;
    const angle = Math.sqrt(GM / r ** 3) * ((timeUtcMs - T0) / 1000);
    const speed = Math.sqrt(GM / r);
    return {
      p: [r * Math.cos(angle), r * Math.sin(angle), 0],
      v: [-speed * Math.sin(angle), speed * Math.cos(angle), 0],
    };
  };
  const fake = {
    positionsKmInto(timeUtcMs: number, bodies: readonly string[], out: Float64Array) {
      bodies.forEach((id, i) => out.set(at(id, timeUtcMs).p, 3 * i));
    },
    loadedFromUtcMs: () => T0 - 5 * DAY,
    stateOf(id: string, timeUtcMs: number) {
      const { p, v } = at(id, timeUtcMs);
      return createState({
        body: id,
        center: "jupiter",
        timeUtcMs,
        plane: EQJ,
        positionKm: p,
        velocityKmS: v,
        orientation: null,
      });
    },
  } as unknown as ChebyshevEphemeris;
  return validateBodySet({
    id: "made-up-set",
    group: createEphemerisGroup({
      id: "made-up-set",
      center: "jupiter",
      ephemeris: () => fake,
      members: ["alpha", "beta"],
      bounds: { startUtcMs: T0, endUtcMs: T0 + 14 * DAY },
      provenance,
    }),
    members: [
      { id: "alpha", label: "Alpha", radiusKm: 1, family: "near" },
      { id: "beta", label: "Beta", radiusKm: 300, family: "far" },
    ],
    families: familiesWithPalette([
      { id: "near", label: "Near" },
      { id: "far", label: "Far" },
    ]),
    bodyFamilies: {},
    centreGmKm3S2: GM,
  });
}

/** Two made-up sky figures. */
export function skyFigureLayers(): readonly SkyFigureLayer[] {
  const kite = {
    id: "kite",
    label: "The Kite",
    segments: [
      [
        { raDeg: 10, decDeg: 20 },
        { raDeg: 20, decDeg: 30 },
      ],
    ],
  } as const;
  const ring = {
    id: "ring",
    label: "The Ring",
    kind: "boundary",
    points: [
      { raDeg: 0, decDeg: 0 },
      { raDeg: 20, decDeg: 0 },
      { raDeg: 10, decDeg: 15 },
    ],
  } as const;
  return definitionOf(new Scene().addBody(earth).addBody(moon).addSkyFigures([kite, ring])).skyFigures!;
}

export const RING_BANDS: RingBand[] = [
  { id: "inner", label: "Inner", innerKm: 100, outerKm: 200, color: "#ff8000", opacity: 0.5 },
  { id: "outer", label: "Outer", innerKm: 250, outerKm: 400, color: "#0000ff", opacity: 0.8 },
];

export const MADE_UP_STARS: readonly StarRow[] = [
  [0, 0, 1.0, 0.0],
  [90, 45, 3.5, 1.4],
  [200, -60, 6.0, null],
];
