// O-048 T-208 (I-121): a label that lost an overlap needs a stated extra clearance to return, so crossing labels do not flicker (ARCH-02: layout only, no State).
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera } from "three";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { SceneLabelLayer, SELECTED_PRIORITY } from "../src/app/SceneLabels";
import type { ExperienceObject } from "../src/shell/experience";

let host: HTMLElement;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(this.style.transform);
    const x = m === null ? 0 : Number(m[1]) - (this.style.transform.includes("-100%") ? 400 : 0);
    const y = m === null ? 0 : Number(m[2]);
    return { left: x, top: y, right: x + 400, bottom: y + 30, width: 400, height: 30, x, y, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => { host.remove(); vi.restoreAllMocks(); });

const objects = [
  { id: "a", label: "A", color: "#fff", labelPriority: 100 },
  { id: "b", label: "B", color: "#fff", labelPriority: 10 },
] as unknown as ExperienceObject[];
const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1e6);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

/** Runs one frame per x of B (A stays at 0) and returns B's visibility per frame. */
function sweep(xs: readonly number[], selected = "a", hidden?: ReadonlySet<string>): { b: boolean[]; a: boolean[] } {
  const layer = new SceneLabelLayer(host, objects);
  const out = { a: [] as boolean[], b: [] as boolean[] };
  for (const x of xs) {
    layer.update((id) => (id === "a" ? [0, 0, 0] : [x, 0, 0]), camera, 800, 600, new FloatingOrigin(), selected, hidden);
    out.a.push(host.querySelector<HTMLElement>('[data-label-id="a"]')!.hidden === false);
    out.b.push(host.querySelector<HTMLElement>('[data-label-id="b"]')!.hidden === false);
  }
  layer.dispose();
  return out;
}
const changes = (v: readonly boolean[]) => v.slice(1).filter((x, i) => x !== v[i]).length;
// B crosses A from far left to far right in ~1px steps with 1.5px of jitter on every frame (fast playback).
const crossing = Array.from({ length: 400 }, (_, i) => -6 + i * 0.03 + (i % 2 === 0 ? 0.03 : -0.03));

describe("label overlap hysteresis", () => {
  it("changes B's visibility at most twice (hide, then show) per crossing despite jitter", () => {
    const { b } = sweep(crossing);
    expect(changes(b)).toBeLessThanOrEqual(2);
    expect(b.some((shown) => !shown)).toBe(true);
  });

  it("the selected label wins at once, even over a higher-priority label", () => {
    const { a, b } = sweep(crossing, "b");
    expect(b.every(Boolean)).toBe(true);
    expect(a.some((shown) => !shown)).toBe(true);
    expect(SELECTED_PRIORITY).toBeGreaterThan(100);
  });

  it("labels switched off hide all", () => {
    const { a, b } = sweep(crossing.slice(0, 5), "a", new Set(["a", "b"]));
    expect([...a, ...b].some(Boolean)).toBe(false);
  });
});
