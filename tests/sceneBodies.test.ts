import { describe, expect, it } from "vitest";
import { Group, PerspectiveCamera } from "three";
import { catalogue } from "../src/assets/catalogue";
import type { BodyId } from "../src/core/body";
import type { State } from "../src/core/state";
import { readableScale } from "../src/core/scalePolicy";
import type { BodyParts } from "../src/app/BodyView";
import { DEFAULT_BODY_MARKER } from "../src/app/bodyDraw";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { bodyScreenReadouts, placeBodies, swapSmallBodiesToMarkers, type BodyRefs } from "../src/app/sceneBodies";

const earth = catalogue.get("earth");
const moon = catalogue.get("moon");

function parts(): BodyParts { const sphere = new Group(); const marker = new Group(); marker.visible = false; return { sphere, marker }; }
function refs(withParts: boolean): { refs: BodyRefs; groups: Map<BodyId, Group> } {
  const groups = new Map<BodyId, Group>([["earth", new Group()], ["moon", new Group()]]);
  const orients = new Map<BodyId, Group>([["earth", new Group()], ["moon", new Group()]]);
  const partMap = new Map<BodyId, BodyParts>(withParts ? [["earth", parts()], ["moon", parts()]] : []);
  return { refs: { groups, orients, parts: partMap }, groups };
}
function camera(): PerspectiveCamera {
  const cam = new PerspectiveCamera(45, 1, 0.05, 1000);
  cam.position.set(0, 0, 10);
  cam.updateMatrixWorld();
  return cam;
}
const state = (x: number): State => ({ positionKm: [x, 0, 0], velocityKmS: [0, 0, 0], timeUtcMs: 0, frame: "EQJ", center: "earth", orientation: [0, 0, 0, 1] } as unknown as State);

describe("placeBodies", () => {
  it("puts each body at its state minus the floating origin", () => {
    const { refs: r, groups } = refs(false);
    const origin = new FloatingOrigin();
    origin.set([1, 0, 0]);
    placeBodies([earth, moon], new Map([["earth", state(0)], ["moon", state(384400)]]), r, readableScale, origin);
    const far = groups.get("moon")!.position.length();
    expect(far).toBeGreaterThan(1);
    expect(groups.get("earth")!.position.length()).toBeCloseTo(1, 6);
  });
});

describe("swapSmallBodiesToMarkers", () => {
  it("swaps a sphere for its marker when it is too small on screen, and back when it is not", () => {
    const { refs: r, groups } = refs(true);
    groups.get("earth")!.position.set(0, 0, 0);
    groups.get("moon")!.position.set(0, 0, 0);
    const cam = camera();
    const swapped = swapSmallBodiesToMarkers([earth, moon], r, cam, 45, 600, readableScale, { minSpherePx: 1e6, markerPx: 6 });
    expect(swapped).toEqual(["earth", "moon"]);
    expect(r.parts.get("earth")!.sphere.visible).toBe(false);
    expect(r.parts.get("earth")!.marker.visible).toBe(true);
    const none = swapSmallBodiesToMarkers([earth, moon], r, cam, 45, 600, readableScale, { minSpherePx: 0, markerPx: 6 });
    expect(none).toEqual([]);
    expect(r.parts.get("earth")!.sphere.visible).toBe(true);
    expect(r.parts.get("earth")!.marker.visible).toBe(false);
  });
  it("skips a body with no mounted parts", () => {
    const { refs: r } = refs(false);
    expect(swapSmallBodiesToMarkers([earth], r, camera(), 45, 600, readableScale, DEFAULT_BODY_MARKER)).toEqual([]);
  });
});

describe("bodyScreenReadouts", () => {
  it("reads a body in front of the camera as in view, centred, and drawn as its sphere", () => {
    const { refs: r } = refs(true);
    const [out] = bodyScreenReadouts([earth], r, camera(), 45, 600, readableScale);
    expect(out.id).toBe("earth");
    expect(out.as).toBe("sphere");
    expect(out.inView).toBe(true);
    expect(out.x).toBeCloseTo(0.5, 3);
    expect(out.y).toBeCloseTo(0.5, 3);
    expect(out.radiusPx).toBeGreaterThan(0);
  });
  it("reads a body behind the camera as out of view and one with both parts hidden as none", () => {
    const { refs: r, groups } = refs(true);
    groups.get("earth")!.position.set(0, 0, 50);
    const p = r.parts.get("earth")!;
    p.sphere.visible = false;
    p.marker.visible = false;
    const [out] = bodyScreenReadouts([earth], r, camera(), 45, 600, readableScale);
    expect(out.inView).toBe(false);
    expect(out.as).toBe("none");
  });
  it("reads an unmounted-parts body as a marker, a sphere when emissive, and skips one with no group", () => {
    const { refs: r } = refs(false);
    expect(bodyScreenReadouts([earth], r, camera(), 45, 600, readableScale)[0].as).toBe("marker");
    const sun = catalogue.get("sun" as BodyId);
    const emissive = { ...earth, visual: { ...earth.visual, emissive: true } };
    expect(bodyScreenReadouts([emissive], r, camera(), 45, 600, readableScale)[0].as).toBe("sphere");
    expect(sun).toBeDefined();
    expect(bodyScreenReadouts([sun], r, camera(), 45, 600, readableScale)).toEqual([]);
  });
  it("includes a glow readout for a body with a halo and honours the live look", () => {
    const { refs: r } = refs(true);
    const glowing = { ...earth, visual: { ...earth.visual, glow: { sizePx: 100, brightness: 1 } } };
    const base = bodyScreenReadouts([glowing], r, camera(), 45, 600, readableScale)[0].glow;
    expect(base).not.toBeNull();
    const off = bodyScreenReadouts([glowing], r, camera(), 45, 600, readableScale, { sizePx: 100, brightness: 0, scale: 2.5 })[0].glow;
    expect(off?.sizePx).toBe(0);
    expect(bodyScreenReadouts([earth], r, camera(), 45, 600, readableScale)[0].glow).toBeNull();
  });

  it("reads the halo as over the stream dots from afar and behind the disc once the disc is big (browser-sun.mjs)", () => {
    const { refs: r } = refs(true);
    const glowing = { ...earth, visual: { ...earth.visual, glow: { sizePx: 100, brightness: 1 } } };
    const at = (z: number) => { const cam = camera(); cam.position.set(0, 0, z); cam.updateMatrixWorld(); return bodyScreenReadouts([glowing], r, cam, 45, 600, readableScale)[0]; };
    expect(at(200).glow?.overDots).toBe(true);
    expect(at(3).glow?.overDots).toBe(false);
    expect(at(3).radiusPx).toBeGreaterThan(at(200).radiusPx);
  });
});
