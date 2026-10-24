// @vitest-environment happy-dom
// The DOM layers the frame places over the canvas: scene labels, story markers and the ring disc. Each is driven with a real camera and a fixed
// floating origin, and the tests read what ends up on the page (hidden, text, transform, which panel a press opens).
import { PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RingBand } from "../src/assets/rings";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { drawRingTexture, RingView, ringExtentKm } from "../src/app/RingView";
import { SceneLabelLayer } from "../src/app/SceneLabels";
import { StoryMarkerLayer, type StoryMarkerSpec } from "../src/app/StoryMarkers";
import type { RenderVector } from "../src/app/renderCoordinates";

function camera(): PerspectiveCamera {
  const cam = new PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 0, 10);
  cam.lookAt(0, 0, 0);
  return cam;
}

const POSITIONS: Record<string, RenderVector | null> = { a: [0, 0, 0], b: [2, 0, 0], c: null, behind: [0, 0, 50] };
const positionFor = (id: string) => POSITIONS[id] ?? null;
let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); });
afterEach(() => { host.remove(); vi.restoreAllMocks(); });

/** A label's page rectangle follows its translate(), 40 px wide and 10 px high, so the layer's overlap rule sees real boxes. */
function stubRects(): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(this.style.transform);
    const x = m === null ? 0 : Number(m[1]);
    const y = m === null ? 0 : Number(m[2]);
    if (this.style.transform.includes("-100%")) return { left: x - 40, top: y, right: x, bottom: y + 10, width: 40, height: 10, x: x - 40, y, toJSON: () => ({}) } as DOMRect;
    return { left: x, top: y, right: x + 40, bottom: y + 10, width: 40, height: 10, x, y, toJSON: () => ({}) } as DOMRect;
  });
}

describe("SceneLabelLayer", () => {
  const objects = [
    { id: "a", label: "Alpha", color: "#ff0000", labelPriority: 1 },
    { id: "b", label: "Beta", labelMaxDistance: 5 },
    { id: "c", label: "Gamma" },
    { id: "behind", label: "Behind" },
  ];
  const labelOf = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!;

  it("shows a label per placed on-screen object, hides unplaced, hidden-by-id, behind-camera and too-far ones", () => {
    stubRects();
    const layer = new SceneLabelLayer(host, objects);
    layer.update(positionFor, camera(), 800, 600, new FloatingOrigin(), "a", new Set(["c"]));
    expect(labelOf("a").hidden).toBe(false);
    expect(labelOf("a").textContent).toBe("Alpha");
    expect(labelOf("b").hidden).toBe(true); // 10.2 away, past its labelMaxDistance of 5
    expect(labelOf("c").hidden).toBe(true); // hidden by id
    expect(labelOf("behind").hidden).toBe(true); // behind the camera
    expect([...layer.shownRects.keys()]).toEqual(["a"]);
    // The object on the view axis lands at the screen centre, 8 px to the right of its anchor point.
    expect(labelOf("a").style.transform).toContain("translate(408px, 300px)");
  });

  it("keeps the selected label first, moves the next to the left slot, puts a third above, and hides a fourth that fits nowhere", () => {
    stubRects();
    const three = [{ id: "a", label: "A", labelPriority: 5 }, { id: "b", label: "B" }, { id: "behind", label: "C", labelPriority: 1 }, { id: "c", label: "D" }];
    const layer = new SceneLabelLayer(host, three);
    layer.update(() => [0, 0, 0], camera(), 800, 600, new FloatingOrigin(), "b");
    expect(labelOf("b").style.transform).toContain("translate(408px, 300px)"); // selection outranks priority: b takes the right slot
    expect(labelOf("a").style.transform).toContain("translate(392px, 300px) translate(-100%"); // a moves to the left slot, clear by the padding
    expect(layer.shownRects.get("a")!.right).toBeLessThan(layer.shownRects.get("b")!.left - 6);
    expect(labelOf("behind").style.transform).toContain("translate(400px, 280px)"); // the third takes the slot above
    expect(labelOf("c").hidden).toBe(true); // right, left and above are all taken
    expect([...layer.shownRects.keys()].sort()).toEqual(["a", "b", "behind"]);
  });

  it("brightens only the hovered name, and clears it", () => {
    const layer = new SceneLabelLayer(host, objects);
    layer.setHover("a", 1.5);
    expect(labelOf("a").style.filter).toBe("brightness(1.5)");
    expect(labelOf("b").style.filter).toBe("");
    layer.setHover("a", 1);
    expect(labelOf("a").style.filter).toBe("");
    layer.setHover(null, 2);
    expect(labelOf("a").style.filter).toBe("");
  });

  it("removes its layer on dispose", () => {
    const layer = new SceneLabelLayer(host, objects);
    expect(host.querySelector(".scene-labels")).not.toBeNull();
    layer.dispose();
    expect(host.querySelector(".scene-labels")).toBeNull();
  });
});

describe("StoryMarkerLayer", () => {
  const specs: StoryMarkerSpec[] = [
    { panelId: "p2", objectId: "a", title: "Second", timeUtcMs: 200 },
    { panelId: "p1", objectId: "a", title: "First", timeUtcMs: 100 },
    { panelId: "p3", objectId: "b", title: "Solo", timeUtcMs: 50 },
    { panelId: "p4", objectId: "c", title: "Unplaced", timeUtcMs: 10 },
  ];

  it("draws one button per object with its panels, titles and labels", () => {
    const layer = new StoryMarkerLayer(host, specs, () => undefined);
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".story-marker")];
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.dataset.panelIds).toBe("p1 p2");
    expect(buttons[0]!.getAttribute("aria-label")).toBe("Open story panels: First; Second");
    expect(buttons[1]!.getAttribute("aria-label")).toBe("Open story panel: Solo");
    layer.dispose();
    expect(host.querySelector(".story-markers")).toBeNull();
  });

  it("shows a marker only where its object is on screen, offset up and right, and marks the open one pressed", () => {
    const layer = new StoryMarkerLayer(host, specs, () => undefined);
    layer.update(positionFor, camera(), 800, 600, new FloatingOrigin(), "p2", 0);
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".story-marker")];
    expect(buttons.map((b) => b.hidden)).toEqual([false, false, true]);
    expect(buttons[0]!.style.transform).toContain("translate(416px, 284px)");
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");
  });

  it("opens the panel the clock has reached, then cycles through the object's panels on repeat presses", () => {
    const opened: string[] = [];
    const layer = new StoryMarkerLayer(host, specs, (id) => opened.push(id));
    const first = host.querySelector<HTMLButtonElement>(".story-marker")!;
    layer.update(positionFor, camera(), 800, 600, new FloatingOrigin(), null, 150);
    first.click();
    layer.update(positionFor, camera(), 800, 600, new FloatingOrigin(), "p1", 150);
    first.click();
    layer.update(positionFor, camera(), 800, 600, new FloatingOrigin(), "p2", 150);
    first.click();
    expect(opened).toEqual(["p1", "p2", "p1"]);
  });

  it("a press on a marker never reaches the camera controls", () => {
    new StoryMarkerLayer(host, specs, () => undefined);
    const outer = vi.fn();
    host.addEventListener("pointerdown", outer);
    host.querySelector(".story-marker")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(outer).not.toHaveBeenCalled();
  });
});

describe("rings", () => {
  const bands: RingBand[] = [
    { id: "inner", label: "Inner", innerKm: 100, outerKm: 200, color: "#ff8000", opacity: 0.5 },
    { id: "outer", label: "Outer", innerKm: 250, outerKm: 400, color: "#0000ff", opacity: 0.8 },
  ];

  it("measures the disc from the innermost inner edge to the outermost outer edge", () => {
    expect(ringExtentKm(bands)).toEqual({ innerKm: 100, outerKm: 400 });
  });

  it("paints one annulus per band with the band's colour, and skips an empty band", () => {
    const calls: string[] = [];
    const stops: string[] = [];
    const ctx = {
      clearRect: () => calls.push("clear"),
      createRadialGradient: (_x: number, _y: number, r0: number, _x1: number, _y1: number, r1: number) => { calls.push(`grad ${r0}-${r1}`); return { addColorStop: (_o: number, c: string) => stops.push(c) }; },
      beginPath: () => undefined, arc: () => undefined, closePath: () => undefined, fill: () => calls.push("fill"),
    } as unknown as CanvasRenderingContext2D;
    drawRingTexture(ctx, [...bands, { ...bands[0]!, id: "empty", innerKm: 50, outerKm: 50 }], 400, 800);
    expect(calls).toEqual(["clear", "grad 100-200", "fill", "grad 250-400", "fill"]);
    expect(stops[1]).toBe("rgba(255,128,0,0.5)");
    expect(stops[5]).toBe("rgba(0,0,255,0.8)");
  });

  it("builds the disc at the body's scale, reports it and repaints only when the look changes", () => {
    const view = new RingView(bands, 0.01, 3);
    expect(view.mesh.name).toBe("rings");
    expect(view.mesh.layers.isEnabled(3)).toBe(true);
    expect(view.mesh.userData.outerKm).toBe(400);
    const before = view.readout();
    expect(before.shown).toBe(false); // not in a scene yet
    expect(before.bands[1]).toMatchObject({ id: "outer", innerUnits: 2.5, outerUnits: 4, color: "#0000ff", opacity: 0.8 });
    const group = new (view.mesh.constructor as new () => typeof view.mesh)();
    group.add(view.mesh);
    expect(view.readout().shown).toBe(true);
    view.setBands([{ ...bands[0]!, opacity: 0.1 }, bands[1]!]);
    expect(view.readout().bands[0]!.opacity).toBe(0.1);
    view.setBands([{ ...bands[0]!, opacity: 0.1 }, bands[1]!]);
    view.dispose();
  });
});
