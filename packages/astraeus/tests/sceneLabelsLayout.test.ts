// O-087 T-396: labels are placed by arithmetic on cached sizes, not by reading layout (ARCH-03: made-up labels).
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { projectToScreen } from "../src/app/AnchorLabels";
import { LABEL_PADDING_PX, SceneLabelLayer } from "../src/app/SceneLabels";
import type { ExperienceObject } from "../src/shell/experience";

let host: HTMLElement;
let reads: HTMLElement[];
let sizeOf: (el: HTMLElement) => { width: number; height: number };
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  reads = [];
  sizeOf = () => ({ width: 100, height: 20 });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    reads.push(this);
    const { width, height } = sizeOf(this);
    return { left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => {
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1e6);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
const make = (n: number): ExperienceObject[] =>
  Array.from(
    { length: n },
    (_, i) => ({ id: `o${i}`, label: `O${i}`, color: "#fff", labelPriority: 100 - i }) as unknown as ExperienceObject,
  );
const labelOf = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!;

/** One update; `xs` gives each object's world x on the z = 0 plane (y = 0). */
function run(layer: SceneLabelLayer, xs: Record<string, number>, page = { left: 0, top: 0 }, selected = "o0") {
  layer.update(
    (id) => [xs[id] ?? 0, 0, 0],
    camera,
    800,
    600,
    new FloatingOrigin(),
    selected,
    undefined,
    undefined,
    page,
  );
}
const shownIds = (layer: SceneLabelLayer) => [...layer.shownRects.keys()];

describe("label placement without layout reads", () => {
  it("places N labels with no label layout read once sizes are known", () => {
    const layer = new SceneLabelLayer(host, make(6));
    const xs = Object.fromEntries(make(6).map((o, i) => [o.id, i * 3]));
    run(layer, xs);
    expect(reads.length).toBeLessThanOrEqual(6);
    expect(new Set(reads).size).toBe(reads.length);
    reads.length = 0;
    for (let i = 0; i < 9; i += 1) run(layer, xs);
    expect(reads).toHaveLength(0);
    layer.dispose();
  });

  it("re-measures only the label whose size changed", () => {
    let report: ResizeObserverCallback = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const layer = new SceneLabelLayer(host, make(2));
    const pxPerUnit = projectToScreen(new Vector3(1, 0, 0), camera, 800, 600)!.x - 400;
    const xs = { o0: 0, o1: 150 / pxPerUnit }; // 150 px apart: the second label clears the first while it is 100 px wide, not at 400
    run(layer, xs);
    expect(shownIds(layer)).toEqual(["o0", "o1"]);
    reads.length = 0;
    report(
      [{ target: labelOf("o0"), contentRect: { width: 400, height: 20 } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    run(layer, xs);
    expect(reads).toHaveLength(0);
    expect(layer.shownRects.get("o0")!.right - layer.shownRects.get("o0")!.left).toBe(400);
    expect(shownIds(layer)).toEqual(["o0"]);
    layer.dispose();
  });
});

describe("matches the read-based layout", () => {
  /** The old rule written out: try (dx, dy) puts the label's top left at (x + dx - (dx < 0 ? w : 0), y + dy - h / 2) plus the page offset; the first try clear of every placed rect by the padding wins. */
  function oracle(
    points: [string, number, number][],
    page: { left: number; top: number },
    padding: (id: string) => number,
  ) {
    const placed: { id: string; left: number; top: number; right: number; bottom: number }[] = [];
    for (const [id, x, y] of points)
      for (const [dx, dy, back] of [
        [8, 0, 0],
        [-8, 0, 1],
        [0, -20, 0],
      ] as const) {
        const left = page.left + x + dx - back * 100;
        const top = page.top + y + dy - 10;
        const rect = { id, left, top, right: left + 100, bottom: top + 20 };
        const p = padding(id);
        if (
          placed.every(
            (o) =>
              !(
                rect.left < o.right + p &&
                rect.right + p > o.left &&
                rect.top < o.bottom + p &&
                rect.bottom + p > o.top
              ),
          )
        ) {
          placed.push(rect);
          break;
        }
      }
    return placed;
  }
  const screenOf = (x: number) => projectToScreen(new Vector3(x, 0, 0), camera, 800, 600)!;
  const cases: { name: string; xs: number[]; shown: number; selected?: string }[] = [
    { name: "no overlap", xs: [-6, 6], shown: 2 },
    { name: "overlap resolved by the left try", xs: [0, 0.35], shown: 2 },
    { name: "overlap resolved by the upper try", xs: [0, 0.05], shown: 2 },
    { name: "overlap hides the lower-priority label", xs: [0, 0.05, 0.1], shown: 3 },
    { name: "a selected label wins the place", xs: [0, 0.05], shown: 2, selected: "o1" },
  ];
  for (const c of cases)
    it(c.name, () => {
      const objects = make(c.xs.length);
      const layer = new SceneLabelLayer(host, objects);
      const page = { left: 30, top: 40 };
      const worldX = Object.fromEntries(objects.map((o, i) => [o.id, c.xs[i]!]));
      run(layer, worldX, page, c.selected ?? "o0");
      const order = [...objects].sort((a, b) => (b.id === c.selected ? 1 : 0) - (a.id === c.selected ? 1 : 0));
      const expected = oracle(
        order.map((o): [string, number, number] => [o.id, screenOf(worldX[o.id]!).x, screenOf(worldX[o.id]!).y]),
        page,
        () => LABEL_PADDING_PX,
      );
      expect(shownIds(layer).sort()).toEqual(expected.map((r) => r.id).sort());
      for (const r of expected)
        expect(layer.shownRects.get(r.id)).toEqual({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      for (const o of objects) expect(labelOf(o.id).hidden).toBe(!layer.shownRects.has(o.id));
      layer.dispose();
    });

  it("a label hidden by overlap needs the reappear margin to come back, with no new measure", () => {
    const objects = make(3);
    const layer = new SceneLabelLayer(host, objects);
    const unit = projectToScreen(new Vector3(1, 0, 0), camera, 800, 600)!.x - 400;
    const at = (px: number) => ({ o0: 0, o1: 0, o2: px / unit });
    run(layer, at(0)); // o0 takes the right, o1 the left, o2 finds no place
    expect(shownIds(layer)).toEqual(["o0", "o1"]);
    reads.length = 0;
    run(layer, at(110)); // clear of o0 by 10 px: more than the padding (6), less than padding + margin (20)
    expect(shownIds(layer)).toEqual(["o0", "o1"]);
    run(layer, at(130));
    expect(shownIds(layer)).toEqual(["o0", "o1", "o2"]);
    expect(reads).toHaveLength(0);
    layer.dispose();
  });
});
