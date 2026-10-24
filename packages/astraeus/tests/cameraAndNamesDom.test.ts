// @vitest-environment happy-dom
// The orbit gestures on a pretend canvas (drag, wheel, pinch, tap) and the body-set name layer (hover pick, which members are named).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attachOrbitGestures, cancelCameraTransition, createOrbitCameraState } from "../src/app/CameraController";
import { BodySetLabelLayer, membersToName, pickMember, PICK_RADIUS_PX } from "../src/app/BodySetLabels";
import type { BodySetView } from "../src/app/BodySetView";

let element: HTMLElement;
beforeEach(() => {
  element = document.createElement("div");
  document.body.appendChild(element);
  Object.assign(element, { setPointerCapture: vi.fn() });
  vi.stubGlobal("innerWidth", 1000);
  vi.stubGlobal("innerHeight", 500);
});
afterEach(() => { element.remove(); vi.unstubAllGlobals(); });

function pointer(type: string, init: { id?: number; x: number; y: number; kind?: string; button?: number }): void {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & Record<string, unknown>;
  Object.assign(event, { pointerId: init.id ?? 1, clientX: init.x, clientY: init.y, pointerType: init.kind ?? "mouse", button: init.button ?? 0 });
  element.dispatchEvent(event);
}
const limits = () => ({ min: 2, max: 100 });

describe("attachOrbitGestures", () => {
  it("a mouse drag turns the camera by the share of the window dragged and cancels a scripted move", () => {
    const state = createOrbitCameraState(16, "earth");
    state.targetDistance = 50;
    state.transition = [1, 1, 1];
    attachOrbitGestures(element, state, limits);
    const a0 = state.azimuth;
    pointer("pointerdown", { x: 100, y: 100 });
    pointer("pointermove", { x: 200, y: 150 });
    expect(state.azimuth).toBeCloseTo(a0 - (100 / 1000) * Math.PI * 2 * 1.6, 9);
    expect(state.elevation).toBeCloseTo(0.25 + (50 / 500) * Math.PI * 1.6, 9);
    expect(state.targetDistance).toBe(state.distance);
    expect(state.transition).toEqual([0, 0, 0]);
    expect(state.targetAzimuth).toBe(state.azimuth);
  });

  it("clamps elevation short of the poles and drags a touch more gently than a mouse", () => {
    const state = createOrbitCameraState(16, "earth");
    attachOrbitGestures(element, state, limits);
    pointer("pointerdown", { x: 0, y: 0 });
    pointer("pointermove", { x: 0, y: 5000 });
    expect(state.elevation).toBeCloseTo(Math.PI * 0.47, 9);
    pointer("pointermove", { x: 0, y: -50000 });
    expect(state.elevation).toBeCloseTo(-Math.PI * 0.47, 9);
    const touch = createOrbitCameraState(16, "earth");
    const detach = attachOrbitGestures(element, touch, limits);
    pointer("pointerup", { x: 0, y: 0 });
    pointer("pointerdown", { id: 7, x: 0, y: 0, kind: "touch" });
    pointer("pointermove", { id: 7, x: 100, y: 0, kind: "touch" });
    expect(touch.azimuth).toBeCloseTo(Math.PI * 1.2 - (100 / 1000) * Math.PI * 2 * 0.95, 9);
    detach();
  });

  it("the wheel zooms within the limits and stops the page from scrolling", () => {
    const state = createOrbitCameraState(16, "earth");
    attachOrbitGestures(element, state, limits);
    const wheel = new Event("wheel", { cancelable: true }) as Event & { deltaY: number };
    wheel.deltaY = 500;
    element.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(state.distance).toBeCloseTo(16 * Math.exp(500 * 0.0012), 9);
    const far = new Event("wheel", { cancelable: true }) as Event & { deltaY: number };
    far.deltaY = 1e6;
    element.dispatchEvent(far);
    expect(state.distance).toBe(100);
    far.deltaY = -1e6;
    element.dispatchEvent(far);
    expect(state.distance).toBe(2);
  });

  it("two fingers pinch: spreading zooms in, closing zooms out, and nothing turns", () => {
    const state = createOrbitCameraState(16, "earth");
    attachOrbitGestures(element, state, limits);
    const azimuth = state.azimuth;
    pointer("pointerdown", { id: 1, x: 100, y: 100, kind: "touch" });
    pointer("pointerdown", { id: 2, x: 200, y: 100, kind: "touch" });
    pointer("pointermove", { id: 2, x: 300, y: 100, kind: "touch" });
    expect(state.distance).toBeCloseTo(16 * Math.exp(-100 * 0.006), 9);
    const zoomedIn = state.distance;
    pointer("pointermove", { id: 2, x: 150, y: 100, kind: "touch" });
    expect(state.distance).toBeGreaterThan(zoomedIn);
    expect(state.azimuth).toBe(azimuth);
    pointer("pointercancel", { id: 2, x: 150, y: 100, kind: "touch" });
    pointer("pointermove", { id: 1, x: 120, y: 100, kind: "touch" });
    expect(state.azimuth).not.toBe(azimuth); // back to one finger: a drag again
  });

  it("reports a tap with its position, but not a drag, a right-click or a second finger", () => {
    const state = createOrbitCameraState(16, "earth");
    const taps: [number, number, string][] = [];
    attachOrbitGestures(element, state, limits, (x, y, kind) => taps.push([x, y, kind]));
    pointer("pointerdown", { x: 40, y: 50 });
    pointer("pointerup", { x: 41, y: 50 });
    pointer("pointerdown", { x: 40, y: 50 });
    pointer("pointermove", { x: 140, y: 50 });
    pointer("pointerup", { x: 40, y: 50 });
    pointer("pointerdown", { x: 40, y: 50, button: 2 });
    pointer("pointerup", { x: 40, y: 50, button: 2 });
    pointer("pointerdown", { id: 3, x: 10, y: 10, kind: "touch" });
    pointer("pointerup", { id: 3, x: 10, y: 10, kind: "touch" });
    expect(taps).toEqual([[41, 50, "mouse"], [10, 10, "touch"]]);
  });

  it("stops listening once detached", () => {
    const state = createOrbitCameraState(16, "earth");
    attachOrbitGestures(element, state, limits)();
    const a0 = state.azimuth;
    pointer("pointerdown", { x: 0, y: 0 });
    pointer("pointermove", { x: 300, y: 0 });
    expect(state.azimuth).toBe(a0);
  });

  it("cancelCameraTransition freezes targets at the current pose", () => {
    const state = createOrbitCameraState(16, "earth");
    state.targetAzimuth = 3;
    state.targetElevation = 1;
    state.targetDistance = 99;
    cancelCameraTransition(state);
    expect([state.targetAzimuth, state.targetElevation, state.targetDistance]).toEqual([state.azimuth, state.elevation, 16]);
  });
});

const screens = [
  { x: 10, y: 10, visible: true, radiusPx: 5, distance: 30 },
  { x: 100, y: 100, visible: true, radiusPx: 10, distance: 10 },
  { x: 102, y: 100, visible: false, radiusPx: 20, distance: 1 },
  { x: 300, y: 300, visible: true, radiusPx: 8, distance: 20 },
];

describe("body-set names", () => {
  it("picks the nearest visible member within the radius", () => {
    expect(pickMember({ screen: screens }, 101, 101)).toBe(1); // the hidden one at (102,100) is skipped
    expect(pickMember({ screen: screens }, 100 + PICK_RADIUS_PX + 1, 100)).toBeNull();
    expect(pickMember({ screen: screens }, 12, 10)).toBe(0);
  });

  it("names the hovered member, then the nearest big-enough balls up to the cap", () => {
    const look = { labelNearPx: 12, labelNearMax: 1 };
    expect(membersToName({ screen: screens }, look, null)).toEqual([1]); // radius 10 -> 20 px across, nearest of the big ones
    expect(membersToName({ screen: screens }, look, 0)).toEqual([0, 1]);
    expect(membersToName({ screen: screens }, look, 2)).toEqual([1]); // an invisible member cannot be hovered
    expect(membersToName({ screen: screens }, { labelNearPx: 12, labelNearMax: 5 }, null)).toEqual([1, 3]);
  });

  function layerOf() {
    const view = { layer: { members: [0, 1, 2, 3].map((i) => ({ id: `m${i}`, label: `Member ${i}` })) }, screen: screens, drawn: true } as unknown as BodySetView;
    const canvas = document.createElement("canvas");
    const host = document.createElement("div");
    host.appendChild(canvas);
    document.body.appendChild(host);
    const layer = new BodySetLabelLayer(host, canvas, view);
    const label = (id: string) => host.querySelector<HTMLElement>(`[data-body-set-label="${id}"]`)!;
    return { layer, canvas, host, label, view };
  }
  const hover = (canvas: HTMLCanvasElement, x: number, y: number, kind = "mouse") => {
    const event = new Event("pointermove") as Event & Record<string, unknown>;
    Object.assign(event, { clientX: x, clientY: y, pointerType: kind });
    canvas.dispatchEvent(event);
  };
  const look = { labelNearPx: 12, labelNearMax: 1 } as never;

  it("shows the near member's name beside its dot and publishes the count", () => {
    const { layer, canvas, label } = layerOf();
    layer.update(look);
    expect(label("m1").hidden).toBe(false);
    expect(label("m1").textContent).toBe("Member 1");
    expect(label("m1").style.transform).toContain("translate(114px, 100px)"); // x + radius 10 + 4
    expect(label("m0").hidden).toBe(true);
    expect(canvas.dataset.bodySetNamed).toBe("1");
    expect(canvas.dataset.bodySetHover).toBe("");
  });

  it("names a hovered member, brightens it, and forgets it on leave; touch does not hover", () => {
    const { layer, canvas, label } = layerOf();
    hover(canvas, 10, 10, "touch");
    expect(layer.hovered).toBeNull();
    hover(canvas, 11, 10);
    expect(layer.hovered).toBe("m0");
    layer.update(look, 1.4);
    expect(label("m0").hidden).toBe(false);
    expect(label("m0").style.filter).toBe("brightness(1.4)");
    expect(label("m0").style.transform).toContain("translate(19px, 10px)"); // x 10 + max(6, radius 5 + 4)
    expect(canvas.dataset.bodySetHover).toBe("m0");
    canvas.dispatchEvent(new Event("pointerleave"));
    layer.update(look);
    expect(layer.hovered).toBeNull();
    expect(label("m0").hidden).toBe(true);
  });

  it("names nothing while the set is outside its bounds, and cleans up on dispose", () => {
    const { layer, canvas, host, view } = layerOf();
    (view as unknown as { drawn: boolean }).drawn = false;
    layer.update(look);
    expect(canvas.dataset.bodySetNamed).toBe("0");
    layer.dispose();
    expect(host.querySelector(".body-set-labels")).toBeNull();
    expect(canvas.dataset.bodySetNamed).toBeUndefined();
    hover(canvas, 10, 10);
    expect(layer.hovered).toBeNull();
  });
});
