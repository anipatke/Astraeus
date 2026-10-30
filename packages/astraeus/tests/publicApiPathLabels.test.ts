// O-046 T-192 (I-100): a path's own name follows the same label reach as a body's, proved on a made-up probe (ARCH-03).
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, moon, sun } from "astraeus";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { SceneLabelLayer } from "../src/app/SceneLabels";

const T0 = Date.UTC(2026, 3, 1);
const MIN = 60_000;
const samples = [0, 1].map((minute) => ({ time: T0 + minute * MIN, positionKm: [8_000 + minute * 1_000, 0, 0] }));
const probe = { id: "probe", label: "Probe", samples };

let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); });
afterEach(() => { host.remove(); vi.restoreAllMocks(); });

/** Which of the scene's own labels show with the camera `distance` render units from the object (both at the same place), and `hidden` ids switched off. */
function shownAt(scene: Scene, distance: number, hidden: ReadonlySet<string> = new Set()): string[] {
  const objects = scene.toDefinition().experience.objects;
  const layer = new SceneLabelLayer(host, objects);
  const camera = new PerspectiveCamera(60, 1, 0.1, 1e9);
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(this.style.transform);
    const x = m === null ? 0 : Number(m[1]) - (this.style.transform.includes("-100%") ? 40 : 0);
    const y = m === null ? 0 : Number(m[2]);
    return { left: x, top: y, right: x + 40, bottom: y + 10, width: 40, height: 10, x, y, toJSON: () => ({}) } as DOMRect;
  });
  layer.update(() => [0, 0, 0], camera, 800, 600, new FloatingOrigin(), "earth", hidden);
  const shown = objects.filter(({ id }) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!.hidden === false).map(({ id }) => id);
  layer.dispose();
  return shown;
}
const earthScene = () => new Scene().addBody(earth).addBody(moon).addTrajectory(probe);

describe("a path's label", () => {
  it("shows with the body labels in an Earth-centred scene within reach, and is hidden beyond it", () => {
    expect(shownAt(earthScene(), 50)).toContain("probe");
    expect(shownAt(earthScene(), 50)).toContain("earth");
    expect(shownAt(earthScene(), 600)).not.toContain("probe");
    expect(shownAt(earthScene(), 600)).not.toContain("earth");
  });

  it("follows the same reach as the bodies when the camera reach is raised", () => {
    const scene = earthScene();
    scene.camera.setReach(2000);
    expect(shownAt(scene, 1500)).toEqual(expect.arrayContaining(["earth", "probe"]));
    expect(shownAt(scene, 2500)).not.toContain("probe");
  });

  it("shows at any distance in a Sun-centred scene", () => {
    const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addTrajectory({ ...probe, center: "sun", samples: samples.map((s) => ({ ...s, positionKm: [1.5e8, s.positionKm[0]!, 0] })) });
    expect(shownAt(scene, 1e6)).toEqual(expect.arrayContaining(["sun", "probe"]));
  });

  it("is hidden when its label is switched off", () => {
    expect(shownAt(earthScene(), 50, new Set(["probe"]))).not.toContain("probe");
  });

  it("takes its own labelReach in place of the shared rule", () => {
    const scene = (reach: number) => new Scene().addBody(earth).addBody(moon, { labelReach: 10 }).addTrajectory({ ...probe, labelReach: reach });
    expect(shownAt(scene(4), 3)).toContain("probe");
    expect(shownAt(scene(4), 50)).not.toContain("probe");
    expect(shownAt(scene(4), 50)).toContain("earth");
    expect(shownAt(scene(4), 50)).not.toContain("moon");
    expect(shownAt(scene(4), 8)).toContain("moon");
    expect(shownAt(new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addTrajectory({ ...probe, center: "sun", labelReach: 4 }), 1e6)).not.toContain("probe");
  });

  it("refuses a bad labelReach naming the field", () => {
    const code = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
    for (const bad of [0, -1, Number.NaN, Infinity, "4" as unknown as number]) {
      expect(code(() => new Scene().addBody(earth).addTrajectory({ ...probe, labelReach: bad }))).toMatch(/^bad-trajectory: .*labelReach/);
      expect(code(() => new Scene().addBody(earth, { labelReach: bad }))).toMatch(/^bad-body: .*labelReach/);
    }
  });
});
