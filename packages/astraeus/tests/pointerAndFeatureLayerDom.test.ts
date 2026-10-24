// @vitest-environment happy-dom
// The canvas pointer listeners (hover point, tap picking, detach) and the tagged-place marker layer (what shows, where, what a press does).
// Pretend page; the canvas box and the shell panels are given fixed rectangles.
import { Group, PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrbitCameraState } from "../src/app/CameraController";
import { FeatureMarkerLayer, latLonToXYZ, type FeatureHost, type FeatureMarkerSpec } from "../src/app/FeatureMarkers";
import { attachScenePointer, type PointerState } from "../src/app/scenePointer";

function fire(target: HTMLElement, type: string, init: { x: number; y: number; id?: number; kind?: string; buttons?: number }): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: init.x, clientY: init.y, pointerId: init.id ?? 1, pointerType: init.kind ?? "mouse", button: 0, buttons: init.buttons ?? 0 });
  target.dispatchEvent(event);
}

describe("attachScenePointer", () => {
  let canvas: HTMLCanvasElement;
  beforeEach(() => {
    canvas = document.createElement("canvas");
    Object.assign(canvas, { setPointerCapture: vi.fn() });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, right: 900, bottom: 650, width: 800, height: 600, x: 100, y: 50, toJSON: () => ({}) } as DOMRect);
    document.body.appendChild(canvas);
  });
  afterEach(() => { canvas.remove(); vi.restoreAllMocks(); });
  const limits = () => ({ min: 1, max: 100 });
  const stateWith = (): PointerState => ({ pickables: [{ id: "mars", x: 200, y: 150, radiusPx: 12 }], hoverPoint: null });

  it("tracks a mouse's hover point relative to the canvas, and drops it while a button is down, for touch, and on leave", () => {
    const state = stateWith();
    attachScenePointer(canvas, createOrbitCameraState(16, "earth"), state, limits, undefined);
    fire(canvas, "pointermove", { x: 130, y: 90 });
    expect(state.hoverPoint).toEqual({ x: 30, y: 40 });
    fire(canvas, "pointermove", { x: 140, y: 95, buttons: 1 });
    expect(state.hoverPoint).toBeNull();
    fire(canvas, "pointermove", { x: 130, y: 90 });
    fire(canvas, "pointermove", { x: 131, y: 91, kind: "touch" });
    expect(state.hoverPoint).toBeNull();
    fire(canvas, "pointermove", { x: 130, y: 90 });
    fire(canvas, "pointerleave", { x: 0, y: 0 });
    expect(state.hoverPoint).toBeNull();
  });

  it("reports the picked body for a tap on it, marks the canvas, and says nothing for a tap on empty sky or a drag", () => {
    const picked = vi.fn();
    attachScenePointer(canvas, createOrbitCameraState(16, "earth"), stateWith(), limits, picked);
    fire(canvas, "pointerdown", { x: 300, y: 200 }); // canvas (200, 150): on Mars
    fire(canvas, "pointerup", { x: 300, y: 200 });
    expect(picked).toHaveBeenCalledExactlyOnceWith("mars");
    expect(canvas.dataset.pickTarget).toBe("mars");
    fire(canvas, "pointerdown", { x: 700, y: 500 });
    fire(canvas, "pointerup", { x: 700, y: 500 });
    fire(canvas, "pointerdown", { x: 300, y: 200 });
    fire(canvas, "pointermove", { x: 340, y: 240, buttons: 1 });
    fire(canvas, "pointerup", { x: 340, y: 240 });
    expect(picked).toHaveBeenCalledTimes(1);
  });

  it("turns the camera on a drag and, once detached, ignores the pointer and clears the cursor and hover readout", () => {
    const orbit = createOrbitCameraState(16, "earth");
    const state = stateWith();
    const detach = attachScenePointer(canvas, orbit, state, limits, undefined);
    canvas.style.cursor = "pointer";
    canvas.dataset.pickHover = "mars";
    const before = orbit.azimuth;
    fire(canvas, "pointerdown", { x: 300, y: 200 });
    fire(canvas, "pointermove", { x: 340, y: 200, buttons: 1 });
    expect(orbit.azimuth).not.toBe(before);
    detach();
    expect(canvas.style.cursor).toBe("");
    expect(canvas.dataset.pickHover).toBeUndefined();
    const after = orbit.azimuth;
    fire(canvas, "pointermove", { x: 400, y: 200, buttons: 1 });
    fire(canvas, "pointermove", { x: 130, y: 90 });
    expect(orbit.azimuth).toBe(after);
    expect(state.hoverPoint).toBeNull();
  });
});

describe("FeatureMarkerLayer", () => {
  const specs: FeatureMarkerSpec[] = [
    { key: "io:near", bodyId: "io", name: "Near Crater", color: "#ff0000", latitude: 0, longitude: -90 },
    { key: "io:far", bodyId: "io", name: "Far Crater", color: "#00ff00", latitude: 0, longitude: 90 },
    { key: "moon:edge", bodyId: "moon", name: "Moon Spot", color: "#0000ff", latitude: 0, longitude: -90 },
  ];
  const camera = new PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  const sphere = new Group();
  const hostOf = (bodyId: string): FeatureHost | null => (bodyId === "io" ? { sphere, radius: 1 } : null);
  let host: HTMLElement;
  beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); });
  afterEach(() => { host.remove(); vi.restoreAllMocks(); });
  const button = (key: string) => host.querySelector<HTMLButtonElement>(`[data-feature-key="${key}"]`)!;

  it("builds one named, hidden button per place and shows only the near-side place of a drawn body, at its screen spot", () => {
    const layer = new FeatureMarkerLayer(host, specs, vi.fn());
    expect([...host.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Near Crater", "Far Crater", "Moon Spot"]);
    expect(host.querySelectorAll("button[hidden]")).toHaveLength(3);
    const readout = layer.update(hostOf, camera, 45, 800, 800, null, 1)!;
    expect(button("io:near").hidden).toBe(false);
    expect(button("io:far").hidden).toBe(true); // far side
    expect(button("moon:edge").hidden).toBe(true); // body not drawn as a sphere
    expect(button("io:near").style.transform).toBe("translate(400px, 400px) translate(-50%, -50%)");
    expect(readout).toEqual({ total: 3, shown: [{ key: "io:near", x: 0.5, y: 0.5 }] });
    expect(button("io:near").style.getPropertyValue("--feature-color")).toBe("#ff0000");
  });

  it("returns a readout only when it changed, and marks the selected place pressed", () => {
    const layer = new FeatureMarkerLayer(host, specs, vi.fn());
    expect(layer.update(hostOf, camera, 45, 800, 800, null, 1)).not.toBeNull();
    expect(layer.update(hostOf, camera, 45, 800, 800, null, 1)).toBeNull();
    expect(button("io:near").getAttribute("aria-pressed")).toBe("false");
    layer.update(hostOf, camera, 45, 800, 800, "io:near", 1);
    expect(button("io:near").getAttribute("aria-pressed")).toBe("true");
    expect(button("io:far").getAttribute("aria-pressed")).toBe("false");
  });

  it("hides every place of a body narrower than the setting, and re-places them when the drawn radius changes", () => {
    const layer = new FeatureMarkerLayer(host, specs, vi.fn());
    layer.update(hostOf, camera, 45, 800, 800, null, 1);
    layer.update(hostOf, camera, 45, 800, 800, null, 5000);
    expect(button("io:near").hidden).toBe(true);
    const bigger = (id: string): FeatureHost | null => (id === "io" ? { sphere, radius: 2 } : null);
    layer.update(bigger, camera, 45, 800, 800, null, 1);
    expect(button("io:near").hidden).toBe(false);
    expect(latLonToXYZ(0, -90, 2.04)[2]).toBeCloseTo(2.04, 9);
  });

  it("flags a place near the canvas edge so its name flips, and hides a place under a shell panel", () => {
    const layer = new FeatureMarkerLayer(host, specs, vi.fn());
    const shifted = new Group();
    shifted.position.set(-1.4, 0, 0); // moves the body left on screen
    layer.update((id) => (id === "io" ? { sphere: shifted, radius: 1 } : null), camera, 45, 800, 800, null, 1);
    expect(button("io:near").dataset.edgeX).toBe("left");
    expect(button("io:near").dataset.edgeY).toBe("");
    // A panel over the middle of the layer covers the near place at the next measure.
    const panel = document.createElement("div");
    panel.className = "info-panel";
    document.body.appendChild(panel);
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 800, bottom: 800, width: 800, height: 800, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
    vi.spyOn(performance, "now").mockReturnValue(1e9);
    layer.update(hostOf, camera, 45, 800, 800, null, 1);
    expect(button("io:near").hidden).toBe(true);
    panel.remove();
  });

  it("tells the caller which place was pressed without letting the press reach the camera, and removes itself on dispose", () => {
    const pressed = vi.fn();
    const layer = new FeatureMarkerLayer(host, specs, pressed);
    const reachedHost = vi.fn();
    host.addEventListener("pointerdown", reachedHost);
    host.addEventListener("click", reachedHost);
    button("io:near").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    button("io:near").click();
    expect(pressed).toHaveBeenCalledExactlyOnceWith("io:near");
    expect(reachedHost).not.toHaveBeenCalled();
    layer.dispose();
    expect(host.querySelector(".feature-markers")).toBeNull();
  });
});
