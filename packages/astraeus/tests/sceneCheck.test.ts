// @vitest-environment happy-dom
// O-056 T-259: `scene.check()` throws exactly what `mount` throws for a build fault, one row per code the build can throw synchronously (O-056 Success Condition 2).
// `mount` and `<AstraeusScene>` both go through `prepareScene`, so a row also covers the component. Made-up scenes only (ARCH-03).
import { describe, expect, it } from "vitest";
import { Scene, earth, io, jupiter, moon, sun, type DataSource } from "astraeus";
import { mount } from "../src/api/mount";
import { prepareScene } from "../src/api/prepared";

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const base = () => new Scene().addBody(earth).addBody(moon);
const path = (id: string) => ({ id, center: "earth", samples: [0, 1, 2].map((i) => ({ time: T0 + i * DAY, positionKm: [4e4 + i * 1e3, 0, 0] })) });
const orbit = { id: "r", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 };

type Row = readonly [code: string, scene: () => Scene, data: readonly DataSource[]];
const ROWS: readonly Row[] = [
  ["empty-scene", () => new Scene(), []],
  ["missing-data", () => new Scene().addBody(sun).addBody(jupiter).addBody(io), [{ name: "made-up", provides: ["europa"] }]],
  ["bad-view", () => base().setViews([{ id: "a", label: "A", objects: ["ghost"] }], { place: "panel" }), []],
  ["bad-event", () => base().addEvents([{ id: "e", label: "E", time: T0, object: "ghost" }]), []],
  ["bad-group", () => base().addGroup({ plane: "ecliptic-j2000", id: "g", orbits: [orbit], center: "mars" }), []],
  ["bad-body-set", () => base().addBodySet({ id: "s", families: [{ id: "f", label: "F" }], members: [{ id: "x", family: "ghost", label: "X", radiusKm: 1 }], provenance: { sourceType: "illustrative", sources: ["Invented"], accuracy: "None.", notes: "" } }), []],
  ["bad-moon-panel", () => base().setMoonPanel({ label: "P", families: [{ id: "f", label: "F", description: "F.", moons: [{ id: "ghost" }] }] }), []],
  ["bad-places", () => base().addPlaces("ghost", { categories: [], places: [{ id: "p", name: "P", kind: "K", category: "c", latitudeDeg: 0, longitudeDeg: 0, description: "D" }], provenance: { sourceType: "illustrative", sources: ["Invented"], accuracy: "None.", notes: "" } }), []],
  ["bad-scale", () => base().setScale({ id: "solar-system" } as never), []],
  ["bad-readout", () => base().addTrajectory({ ...path("p"), readouts: [{ kind: "distance", to: "ghost" }] }), []],
  ["bad-timeline", () => base().addTrajectory(path("p")).addEvents([{ id: "e", label: "E", time: T0 }]).setTimeline({ start: T0, end: T0 + DAY, pacing: [{ near: { type: "ghost", withinSeconds: 5 }, rate: 1 }] }), []],
  ["bad-panels", () => base().addTrajectory(path("p")).addStoryPanels({ panels: [{ id: "q", at: { event: "ghost" }, title: "Q", body: ["Made up."], badge: "illustrative", sources: ["Invented"] }] }), []],
];

/** What a call throws, as its constructor, code and message; "no error" if it returns. */
const thrown = (call: () => unknown): unknown => {
  try { call(); } catch (error) { return { name: (error as Error).name, code: (error as { code?: string }).code, message: (error as Error).message }; }
  return "no error";
};

describe("Scene.check against the paths that build a scene", () => {
  it.each(ROWS)("%s: check, mount and prepareScene throw the same error", (code, make, data) => {
    const viaCheck = thrown(() => make().check({ data }));
    expect(viaCheck).toMatchObject({ name: "SceneError", code });
    expect(thrown(() => mount(document.createElement("div"), make(), { data }))).toEqual(viaCheck);
    expect(thrown(() => prepareScene(make(), data))).toEqual(viaCheck);
  });

  it("a scene that builds passes check, and check leaves it editable while a build freezes it", () => {
    const scene = base();
    expect(thrown(() => scene.check())).toBe("no error");
    expect(() => scene.setTime(T0)).not.toThrow();
    prepareScene(scene);
    expect(thrown(() => scene.setTime(T0))).toMatchObject({ code: "scene-mounted" });
  });
});
