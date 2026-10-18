import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { BodySetView } from "../src/app/BodySetView";
import { membersToName, pickMember } from "../src/app/BodySetLabels";
import { DEFAULT_BODY_SET_LOOK, DEFAULT_FAMILY_PALETTE, familiesWithPalette, familyColorOf, osculatingEllipseInto, validateBodySet, type BodySetLayer } from "../src/app/bodySet";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { OrbitSetView, ORBIT_REFRESH_MS, ORBIT_SET_SAMPLES, ORBITS_PER_FRAME } from "../src/app/OrbitSetView";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { defaultDistance, focusLimits, MEMBER_MIN_DISTANCE } from "../src/app/sceneFraming";
import { bodySetMemberAbsolute } from "../src/app/sceneTargets";
import type { ChebyshevEphemeris } from "../src/core/chebyshevEphemeris";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createProvenance } from "../src/core/provenance";
import { trueScale } from "../src/core/scalePolicy";
import { createState, EQJ } from "../src/core/state";
import { placementAbout } from "./scenePlacement";

// ARCH-03: the body-set layer proven with a made-up set (two made-up bodies on circular orbits about a made-up GM), not with Jupiter's moons.
const GM = 1e5;
const RADII_KM = { alpha: 50_000, beta: 120_000 };
const omega = (r: number) => Math.sqrt(GM / r ** 3);
const T0 = Date.UTC(2016, 10, 4);
const circular = (id: "alpha" | "beta", timeUtcMs: number) => {
  const r = RADII_KM[id];
  const angle = omega(r) * ((timeUtcMs - T0) / 1000);
  const speed = Math.sqrt(GM / r);
  return { p: [r * Math.cos(angle), r * Math.sin(angle), 0], v: [-speed * Math.sin(angle), speed * Math.cos(angle), 0] };
};
let reads = 0;
const fake = {
  positionsKmInto(timeUtcMs: number, bodies: readonly string[], out: Float64Array) {
    reads += 1;
    bodies.forEach((id, i) => out.set(circular(id as "alpha" | "beta", timeUtcMs).p, 3 * i));
  },
  stateOf(id: string, timeUtcMs: number) {
    const { p, v } = circular(id as "alpha" | "beta", timeUtcMs);
    return createState({ body: id, center: "jupiter", timeUtcMs, frame: EQJ, positionKm: p, velocityKmS: v, orientation: null });
  },
} as unknown as ChebyshevEphemeris;
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const bounds = { startUtcMs: T0, endUtcMs: T0 + 14 * 86_400_000 };
const group = createEphemerisGroup({ id: "made-up-set", center: "jupiter", ephemeris: () => fake, members: ["alpha", "beta"], bounds, provenance });
const layer: BodySetLayer = validateBodySet({
  id: "made-up-set",
  group,
  members: [{ id: "alpha", label: "Alpha", radiusKm: 1, family: "near" }, { id: "beta", label: "Beta", radiusKm: 300, family: "far" }],
  families: familiesWithPalette([{ id: "near", label: "Near" }, { id: "far", label: "Far" }]),
  bodyFamilies: { io: "near" },
  centreGmKm3S2: GM,
});
const placement = placementAbout("jupiter");

describe("a curve-fit set as a point group", () => {
  it("fills every member in one call from the set, and gives a member's state with velocity", () => {
    const out = new Float64Array(6);
    reads = 0;
    group.fillPositionsKm(T0 + 3600_000, out);
    expect(reads).toBe(1);
    expect(Array.from(out.slice(3))).toEqual(circular("beta", T0 + 3600_000).p);
    expect(Array.from(group.stateAt(0, T0).positionKm)).toEqual(circular("alpha", T0).p);
    expect(Array.from(group.memberStateAt(1, T0).velocityKmS!)).toEqual(circular("beta", T0).v);
  });

  it("refuses times outside its bounds, a wrong buffer, and repeated or missing members", () => {
    expect(() => group.fillPositionsKm(T0 - 1, new Float64Array(6))).toThrow(/bounds/);
    expect(() => group.fillPositionsKm(T0, new Float64Array(5))).toThrow(/6 values/);
    expect(() => createEphemerisGroup({ id: "x", center: "c", ephemeris: () => fake, members: ["a", "a"], bounds, provenance })).toThrow(/twice/);
    expect(() => createEphemerisGroup({ id: "x", center: "c", ephemeris: () => fake, members: [], bounds, provenance })).toThrow(/no members/);
  });

  it("reads the set only when asked, so it can be declared before the chunks load", () => {
    const late = createEphemerisGroup({ id: "late", center: "c", ephemeris: () => { throw new Error("not loaded"); }, members: ["a"], bounds, provenance });
    expect(late.count).toBe(1);
    expect(() => late.fillPositionsKm(T0, new Float64Array(3))).toThrow(/not loaded/);
  });
});

describe("body set checks and colours", () => {
  it("gives families the colour-blind-safe palette in order and lets the live look recolour one", () => {
    expect(layer.families.map((family) => family.color)).toEqual(DEFAULT_FAMILY_PALETTE.slice(0, 2));
    expect(familyColorOf(layer, DEFAULT_BODY_SET_LOOK, "far")).toBe(DEFAULT_FAMILY_PALETTE[1]);
    expect(familyColorOf(layer, { ...DEFAULT_BODY_SET_LOOK, familyColors: { far: "#123456" } }, "far")).toBe("#123456");
    expect(new Set(DEFAULT_FAMILY_PALETTE).size).toBe(DEFAULT_FAMILY_PALETTE.length);
  });

  it("refuses a member in no family, a member list unlike the group's, an unknown body family and a non-positive GM", () => {
    expect(() => validateBodySet({ ...layer, members: [layer.members[0], { ...layer.members[1], family: "nowhere" }] })).toThrow(/unknown family/);
    expect(() => validateBodySet({ ...layer, members: [layer.members[1], layer.members[0]] })).toThrow(/group's/);
    expect(() => validateBodySet({ ...layer, bodyFamilies: { io: "nowhere" } })).toThrow(/unknown family/);
    expect(() => validateBodySet({ ...layer, centreGmKm3S2: 0 })).toThrow(/GM/);
  });
});

describe("osculating ellipse", () => {
  it("is the circle for a circular state, and passes through the body for an eccentric one", () => {
    const out = new Float64Array(3 * 64);
    const r = 100_000;
    expect(osculatingEllipseInto([r, 0, 0], [0, Math.sqrt(GM / r), 0], GM, 64, out)).toBeCloseTo(r, 6);
    for (let i = 0; i < 64; i += 1) expect(Math.hypot(out[3 * i], out[3 * i + 1], out[3 * i + 2])).toBeCloseTo(r, 3);
    // Faster than circular at 100,000 km, tilted: an ellipse with e about 0.44, periapsis at the body.
    const v = [0, 1.2 * Math.sqrt(GM / r) * Math.cos(0.3), 1.2 * Math.sqrt(GM / r) * Math.sin(0.3)];
    const a = osculatingEllipseInto([r, 0, 0], v, GM, 64, out);
    expect(a).toBeCloseTo(1 / (2 / r - (1.44 * GM) / r / GM), 3);
    expect(Math.hypot(out[0] - r, out[1], out[2])).toBeLessThan(1e-6);
  });

  it("draws nothing for an unbound state", () => {
    const out = new Float64Array(3 * 8).fill(7);
    expect(osculatingEllipseInto([1e5, 0, 0], [0, 10, 0], GM, 8, out)).toBe(0);
    expect(Array.from(out).every((value) => value === 0)).toBe(true);
  });
});

function camera(atUnits: [number, number, number], lookAt: [number, number, number]): PerspectiveCamera {
  const cam = new PerspectiveCamera(45, 1280 / 800, 1e-4, 1e5);
  cam.position.set(...atUnits);
  cam.lookAt(...lookAt);
  cam.updateMatrixWorld(true);
  return cam;
}

describe("body set dots and balls", () => {
  it("places every member through the scale policy from the set's centre, camera-relative in Float64", () => {
    const view = new BodySetView(layer);
    view.sync(T0, placement, trueScale, placement.resolver);
    const expected = eqjToRenderVector(trueScale.mapPosition(circular("beta", T0).p));
    expect(view.memberAbsolute("beta")!.map((v, k) => v - expected[k]).every((d) => Math.abs(d) < 1e-9)).toBe(true);
    expect(view.memberRadiusUnits("beta")).toBeCloseTo(trueScale.mapRadius(300), 12);
    expect(bodySetMemberAbsolute({ bodySetViews: [view] }, "alpha")).toEqual(view.memberAbsolute("alpha"));
    expect(bodySetMemberAbsolute({ bodySetViews: [view] }, "io")).toBeNull();
  });

  it("measures each member on screen: a 300 km ball close up is wide, a 1 km one far away is a dot", () => {
    const view = new BodySetView(layer);
    view.sync(T0, placement, trueScale, placement.resolver);
    const beta = view.memberAbsolute("beta")!;
    const origin = new FloatingOrigin();
    origin.set(beta);
    const cam = camera([0, 0, 0.5], [0, 0, 0]);
    view.place(origin, cam, 1280, 800, DEFAULT_BODY_SET_LOOK, true);
    const [alpha, betaScreen] = view.screen;
    expect(betaScreen.visible).toBe(true);
    expect(betaScreen.x).toBeCloseTo(640, 0);
    expect(betaScreen.radiusPx).toBeGreaterThan(DEFAULT_BODY_SET_LOOK.dotPx);
    expect(alpha.radiusPx).toBeLessThan(1);
    // Names: the near ball (beta) is named, the distant dot (alpha) is not unless hovered.
    expect(membersToName(view, DEFAULT_BODY_SET_LOOK, null, null)).toEqual([1]);
    expect(pickMember(view, 642, 401)).toBe(1);
    expect(pickMember(view, 100, 100)).toBeNull();
  });

  it("draws nothing outside the set's bounds", () => {
    const view = new BodySetView(layer);
    view.sync(T0 - 86_400_000, placement, trueScale, placement.resolver);
    expect(view.drawn).toBe(false);
  });
});

describe("body set orbit lines", () => {
  it("computes every ellipse at the first sync, then the stale ones a few per frame in turn, and colours by family from the live look", () => {
    const orbits = new OrbitSetView(layer, 32);
    orbits.sync(T0, placement, trueScale, true);
    expect(orbits.computed).toBe(2);
    expect(orbits.semiMajorKm(1)).toBeCloseTo(RADII_KM.beta, 3);
    const p = orbits.pointKm(0, 0);
    expect(Math.hypot(...p)).toBeCloseTo(RADII_KM.alpha, 3);
    // A minute on, nothing is stale yet; past the refresh time each ellipse is recomputed, a few per frame.
    orbits.sync(T0 + 60_000, placement, trueScale, true);
    expect(orbits.computed).toBe(2);
    orbits.sync(T0 + ORBIT_REFRESH_MS + 60_000, placement, trueScale, true);
    expect(orbits.computed).toBe(2 + Math.min(ORBITS_PER_FRAME, 2));
    orbits.place(new FloatingOrigin(), { ...DEFAULT_BODY_SET_LOOK, familyColors: { near: "#ff0000" } }, true);
    expect(orbits.colorOfFamily(0)).toBe("#ff0000");
    expect(orbits.colorOfFamily(1)).toBe(DEFAULT_FAMILY_PALETTE[1]);
    expect(ORBIT_SET_SAMPLES).toBeGreaterThanOrEqual(64);
  });

  it("adds the orbit lines of bodies drawn elsewhere to the same batch, with their families", () => {
    const extraGroup = createEphemerisGroup({ id: "extra", center: "jupiter", ephemeris: () => fake, members: ["beta"], bounds, provenance });
    const withExtra = validateBodySet({ ...layer, extraOrbits: { group: extraGroup, families: ["near"] } });
    const orbits = new OrbitSetView(withExtra, 16);
    expect(orbits.count).toBe(3);
    orbits.sync(T0, placement, trueScale, true);
    expect(orbits.semiMajorKm(2)).toBeCloseTo(RADII_KM.beta, 3);
    expect(() => validateBodySet({ ...layer, extraOrbits: { group: extraGroup, families: ["nowhere"] } })).toThrow(/unknown family/);
    expect(() => validateBodySet({ ...layer, extraOrbits: { group: extraGroup, families: [] } })).toThrow(/one family per body/);
  });

  it("is hidden when switched off", () => {
    const orbits = new OrbitSetView(layer, 16);
    orbits.sync(T0, placement, trueScale, false);
    expect(orbits.computed).toBe(0);
  });
});

describe("framing a body-set member", () => {
  it("lets the camera come close to a member's ball but never inside it or the near clipping distance", () => {
    const frame = { centre: "jupiter", span: 100, memberRadius: (id: string) => (id === "beta" ? 0.05 : id === "alpha" ? 1e-4 : null) };
    expect(focusLimits("beta", frame, trueScale, {}).min).toBeCloseTo(0.08, 9);
    expect(focusLimits("alpha", frame, trueScale, {}).min).toBe(MEMBER_MIN_DISTANCE);
    expect(defaultDistance("beta", frame, trueScale)).toBeCloseTo(0.2, 9);
    expect(defaultDistance("alpha", frame, trueScale)).toBe(2 * MEMBER_MIN_DISTANCE);
  });
});
