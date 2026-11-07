// Views a scene names (O-051 T-218), proved on made-up configurations (ARCH-03): every refusal, the membership rule, and the scene without views.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type ViewInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const panel = (id: string) => ({ id, at: { time: "2026-03-01T00:05:00Z" }, title: `Title ${id}`, body: ["A line."], provenance: { sourceType: "observed" as const, sources: ["A made-up source"], accuracy: "None claimed.", notes: "Made up." } });
const ring = { id: "ring", plane: "ecliptic-j2000" as const, orbits: [{ id: "a", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }] };
const scene = () => new Scene().addBody(earth).addBody(moon).addGroup(ring)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([{ id: "ea", label: "A event", time: T0 + 5 * MIN }, { id: "eb", label: "B event", time: T0 + 6 * MIN }, { id: "es", label: "Shared event", time: T0 + 7 * MIN }])
  .addStoryPanels([panel("qa"), panel("qb"), panel("qs")]);
const A: ViewInput = { id: "a", label: "A", objects: ["pa"], events: ["ea"], panels: ["qa"] };
const B: ViewInput = { id: "b", label: "B", objects: ["pb"], events: ["eb"], panels: ["qb"] };
const BOTH: ViewInput = { id: "both", label: "Both", objects: ["pa", "pb"], events: ["ea", "eb"], panels: ["qa", "qb"] };
const bar = { place: "top-bar" } as const;
const messageOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };

describe("Scene.setViews", () => {
  it("copies its input, so a later edit to the caller's views cannot slip past the checks (I-129 O1)", () => {
    const mine = { id: "x", label: "X", objects: ["pa"], camera: { follow: "pa" } } as { id: string; label: string; objects: string[]; camera: { follow: string } };
    const s = scene().setViews([mine], bar);
    mine.objects.push("nope"); mine.camera.follow = "nope"; mine.id = "";
    const view = definitionOf(s).views!.views[0]!;
    expect(view.id).toBe("x");
    expect(view.objects.has("pa")).toBe(true);
    expect(JSON.stringify(view.camera)).toContain("pa");
    expect(JSON.stringify(view.camera)).not.toContain("nope");
  });

  it("leaves a scene without views exactly as it was", () => {
    expect(definitionOf(scene()).views).toBeUndefined();
    expect("views" in definitionOf(scene())).toBe(false);
  });

  it("carries place, start (default the first view) and the views into the definition", () => {
    const views = definitionOf(scene().setViews([A, B], bar)).views!;
    expect(views.place).toBe("top-bar");
    expect(views.start).toBe("a");
    expect(views.views.map(({ id, label }) => [id, label])).toEqual([["a", "A"], ["b", "B"]]);
    expect(definitionOf(scene().setViews([A, B], { place: "panel", start: "b" })).views).toMatchObject({ place: "panel", start: "b" });
  });

  it("shows anything no view names in every view and anything named only where named", () => {
    const { views } = definitionOf(scene().setViews([A, B, BOTH], bar)).views!;
    const [a, b, both] = views;
    // Shared bodies and the group are named by no view.
    for (const view of views) for (const shared of ["earth", "moon", "ring"]) expect(view!.objects.has(shared)).toBe(true);
    expect([...a!.objects].filter((id) => id.startsWith("p"))).toEqual(["pa"]);
    expect([...b!.objects].filter((id) => id.startsWith("p"))).toEqual(["pb"]);
    expect([...both!.objects].filter((id) => id.startsWith("p"))).toEqual(["pa", "pb"]);
    expect([...a!.events]).toEqual(["ea", "es"]);
    expect([...both!.events]).toEqual(["ea", "eb", "es"]);
    expect([...b!.panels]).toEqual(["qb", "qs"]);
    expect([...both!.panels]).toEqual(["qa", "qb", "qs"]);
  });

  it("lets a view name a shared body to hide it from the others", () => {
    const { views } = definitionOf(scene().setViews([{ id: "near", label: "Near", objects: ["moon", "ring"] }, { id: "far", label: "Far", objects: ["earth"] }], bar)).views!;
    expect([...views[0]!.objects].sort()).toEqual(["moon", "pa", "pb", "ring"]);
    expect([...views[1]!.objects].sort()).toEqual(["earth", "pa", "pb"]);
  });

  it("may be called before or after the objects it names", () => {
    const before = new Scene().setViews([A, B], bar).addBody(earth).addTrajectory({ id: "pa", center: "earth", samples: samples(10_000) }).addTrajectory({ id: "pb", center: "earth", samples: samples(20_000) })
      .addEvents([{ id: "ea", label: "A", time: T0 + MIN }, { id: "eb", label: "B", time: T0 + 2 * MIN }]).addStoryPanels([panel("qa"), panel("qb")]);
    expect(definitionOf(before).views!.views[0]!.panels).toEqual(new Set(["qa"]));
  });

  it("resolves the camera rule per view, default stay", () => {
    const { views } = definitionOf(scene().setViews([{ ...A, camera: "start" }, { ...B, camera: { follow: "pb" } }, { ...BOTH, camera: { focus: "moon" } }, { id: "plain", label: "Plain" }], bar)).views!;
    expect(views.map((view) => view.camera)).toEqual([{ rule: "start" }, { rule: "start", framing: { follow: "pb" } }, { rule: "start", framing: { focus: "moon" } }, { rule: "stay" }]);
    expect(definitionOf(scene().setViews([{ ...A, camera: "stay" }], bar)).views!.views[0]!.camera).toEqual({ rule: "stay" });
  });

  it.each([
    ["an empty list", () => scene().setViews([], bar), /^bad-view: setViews: give a non-empty list/],
    ["no list", () => scene().setViews(undefined as never, bar), /^bad-view: setViews: give a non-empty list/],
    ["a view that is not an object", () => scene().setViews(["a"] as never, bar), /view 0 must be an object/],
    ["a view without an id", () => scene().setViews([A, { label: "x" } as never], bar), /view 1 needs a non-empty id/],
    ["a view without a label", () => scene().setViews([{ id: "x" } as never], bar), /view "x" needs a non-empty label/],
    ["a repeated view id", () => scene().setViews([A, { ...B, id: "a" }], bar), /view "a" appears twice/],
    ["a bad place", () => scene().setViews([A], { place: "sidebar" } as never), /place must be one of top-bar, panel, got "sidebar"/],
    ["no options", () => scene().setViews([A], undefined as never), /place must be one of top-bar, panel/],
    ["a start that is not a view", () => scene().setViews([A, B], { place: "panel", start: "c" }), /start "c" is not a view \(views: a, b\)/],
    ["ids that are not a list", () => scene().setViews([{ ...A, objects: "pa" as never }], bar), /view "a" objects must be a list of non-empty ids/],
    ["a camera that is not a rule", () => scene().setViews([{ ...A, camera: "orbit" as never }], bar), /view "a" camera must be "stay", "start", \{ follow: id \} or \{ focus: id \}/],
    ["a camera that follows and focuses", () => scene().setViews([{ ...A, camera: { follow: "pa", focus: "pa" } as never }], bar), /view "a" camera must be/],
  ])("refuses %s with bad-view", (_name, call, message) => { expect(messageOf(call)).toMatch(message); });

  it.each([
    ["an unknown object", { ...A, objects: ["nope"] }, /view "a" objects: "nope" is not a body, group or path \(addBody, addGroup, addTrajectory\)/],
    ["an unknown body", { ...A, objects: ["pluto"] }, /view "a" objects: "pluto" is not a body, group or path/],
    ["an unknown event", { ...A, events: ["nope"] }, /view "a" events: "nope" is not an event \(addEvents\)/],
    ["an unknown panel", { ...A, panels: ["nope"] }, /view "a" panels: "nope" is not a story panel \(addStoryPanels\)/],
    ["a camera target the scene does not hold", { ...A, camera: { follow: "nope" } }, /view "a" camera: "nope" is not shown in that view/],
    ["a camera target the view hides", { ...A, camera: { follow: "pb" } }, /view "a" camera: "pb" is not shown in that view/],
  ] as [string, ViewInput, RegExp][])("refuses %s when the scene is built", (_name, view, message) => {
    const built = scene().setViews([view, B], bar);
    expect(messageOf(() => definitionOf(built))).toMatch(new RegExp(`^bad-view: setViews: ${message.source}`));
  });

  it("takes a body and a path in the one list (a body given where a path was once required is now an object like any other)", () => {
    const built = scene().setViews([{ ...A, objects: ["moon"] }, B], bar);
    expect(() => definitionOf(built)).not.toThrow();
  });

  it("refuses a panel id when the scene has no story panels", () => {
    expect(messageOf(() => definitionOf(new Scene().addBody(earth).setViews([{ id: "a", label: "A", panels: ["qa"] }], bar)))).toMatch(/panels: "qa" is not a story panel/);
  });

  it("changes nothing else in the definition", () => {
    const plain = definitionOf(scene());
    const viewed = definitionOf(scene().setViews([A, B], bar));
    expect(viewed.experience.objects.map((object) => object.id)).toEqual(plain.experience.objects.map((object) => object.id));
    expect(viewed.experience.events).toEqual(plain.experience.events);
    expect(viewed.displaySwitches).toBeUndefined();
  });
});

// I-146 (O-057 T-280): `scene.views.items[i]` reports what each view shows, the lists the viewer uses. Made-up scene (ARCH-03).
describe("scene.views objects, events and panels", () => {
  const itemsOf = (s: Scene) => s.views!.items;
  const sameAsDefinition = (s: Scene) => {
    const resolved = definitionOf(s).views!.views;
    itemsOf(s).forEach((item, i) => {
      expect(item.objects).toEqual([...resolved[i]!.objects]);
      expect(item.events).toEqual([...resolved[i]!.events]);
      expect(item.panels).toEqual([...resolved[i]!.panels]);
    });
  };

  it("reports each view's objects, events and panels: what it names plus whatever no view names", () => {
    const s = scene().setViews([A, B], bar);
    const [a, b] = itemsOf(s);
    expect(a!.objects).toEqual(["pa", "earth", "moon", "ring"]);
    expect(b!.objects).toEqual(["pb", "earth", "moon", "ring"]);
    expect(a!.events).toEqual(["ea", "es"]);
    expect(b!.events).toEqual(["eb", "es"]);
    expect(a!.panels).toEqual(["qa", "qs"]);
    expect(b!.panels).toEqual(["qb", "qs"]);
    sameAsDefinition(s);
  });

  it.each([
    ["objects", { id: "a", label: "A", objects: ["pa"] }, { id: "b", label: "B", objects: ["pb"] }, { objects: ["pa", "earth", "moon", "ring"], events: ["ea", "eb", "es"], panels: ["qa", "qb", "qs"] }],
    ["events", { id: "a", label: "A", events: ["ea"] }, { id: "b", label: "B", events: ["eb"] }, { objects: ["pa", "pb", "earth", "moon", "ring"], events: ["ea", "es"], panels: ["qa", "qb", "qs"] }],
    ["panels", { id: "a", label: "A", panels: ["qa"] }, { id: "b", label: "B", panels: ["qb"] }, { objects: ["pa", "pb", "earth", "moon", "ring"], events: ["ea", "eb", "es"], panels: ["qa", "qs"] }],
  ] as const)("each list changes alone: naming only %s", (_kind, a, b, expectedA) => {
    const s = scene().setViews([a as ViewInput, b as ViewInput], bar);
    expect({ objects: itemsOf(s)[0]!.objects, events: itemsOf(s)[0]!.events, panels: itemsOf(s)[0]!.panels }).toEqual(expectedA);
    sameAsDefinition(s);
  });

  it("shows an item no view names in every view, and a named shared body only where named", () => {
    const s = scene().setViews([{ id: "near", label: "Near", objects: ["moon", "ring"] }, { id: "far", label: "Far", objects: ["earth"] }, A], bar);
    // pb, eb, es, qb and qs are named by no view in this scene's views, so every view shows them.
    for (const item of itemsOf(s)) { expect(item.objects).toContain("pb"); expect(item.events).toContain("es"); expect(item.panels).toContain("qs"); }
    expect(itemsOf(s).map(({ objects }) => objects)).toEqual([["pb", "moon", "ring"], ["pb", "earth"], ["pa", "pb"]]);
    sameAsDefinition(s);
  });

  it("returns fresh frozen lists on every read", () => {
    const s = scene().setViews([A, B], bar);
    const first = itemsOf(s)[0]!;
    for (const list of [first.objects, first.events, first.panels]) expect(Object.isFrozen(list)).toBe(true);
    const again = itemsOf(s)[0]!;
    expect(again).not.toBe(first);
    expect(again.objects).not.toBe(first.objects);
    expect(again.events).not.toBe(first.events);
    expect(again.panels).not.toBe(first.panels);
    expect(again).toEqual(first);
  });

  it("is undefined with no views, and throws bad-view for an id the scene does not hold, as mount would", () => {
    expect(scene().views).toBeUndefined();
    expect(messageOf(() => scene().setViews([{ id: "x", label: "X", objects: ["nope"] }], bar).views)).toContain("bad-view");
  });
});
