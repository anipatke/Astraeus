// Views a scene names (O-051 T-218), proved on made-up configurations (ARCH-03): every refusal, the membership rule, and the scene without views.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type ViewInput } from "astraeus";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const panel = (id: string) => ({ id, at: { utc: "2026-03-01T00:05:00Z" }, title: `Title ${id}`, body: ["A line."], badge: "observed", sources: ["A made-up source"] });
const ring = { id: "ring", orbits: [{ id: "a", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }] };
const scene = () => new Scene().addBody(earth).addBody(moon).addGroup(ring)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([{ id: "ea", label: "A event", time: T0 + 5 * MIN }, { id: "eb", label: "B event", time: T0 + 6 * MIN }, { id: "es", label: "Shared event", time: T0 + 7 * MIN }])
  .addStoryPanels({ panels: [panel("qa"), panel("qb"), panel("qs")] });
const A: ViewInput = { id: "a", label: "A", paths: ["pa"], events: ["ea"], panels: ["qa"] };
const B: ViewInput = { id: "b", label: "B", paths: ["pb"], events: ["eb"], panels: ["qb"] };
const BOTH: ViewInput = { id: "both", label: "Both", paths: ["pa", "pb"], events: ["ea", "eb"], panels: ["qa", "qb"] };
const bar = { place: "top-bar" } as const;
const messageOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };

describe("Scene.setViews", () => {
  it("leaves a scene without views exactly as it was", () => {
    expect(scene().toDefinition().views).toBeUndefined();
    expect("views" in scene().toDefinition()).toBe(false);
  });

  it("carries place, start (default the first view) and the views into the definition", () => {
    const views = scene().setViews([A, B], bar).toDefinition().views!;
    expect(views.place).toBe("top-bar");
    expect(views.start).toBe("a");
    expect(views.views.map(({ id, label }) => [id, label])).toEqual([["a", "A"], ["b", "B"]]);
    expect(scene().setViews([A, B], { place: "panel", start: "b" }).toDefinition().views).toMatchObject({ place: "panel", start: "b" });
  });

  it("shows anything no view names in every view and anything named only where named", () => {
    const { views } = scene().setViews([A, B, BOTH], bar).toDefinition().views!;
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
    const { views } = scene().setViews([{ id: "near", label: "Near", bodies: ["moon", "ring"] }, { id: "far", label: "Far", bodies: ["earth"] }], bar).toDefinition().views!;
    expect([...views[0]!.objects].sort()).toEqual(["moon", "pa", "pb", "ring"]);
    expect([...views[1]!.objects].sort()).toEqual(["earth", "pa", "pb"]);
  });

  it("may be called before or after the objects it names", () => {
    const before = new Scene().setViews([A, B], bar).addBody(earth).addTrajectory({ id: "pa", center: "earth", samples: samples(10_000) }).addTrajectory({ id: "pb", center: "earth", samples: samples(20_000) })
      .addEvents([{ id: "ea", label: "A", time: T0 + MIN }, { id: "eb", label: "B", time: T0 + 2 * MIN }]).addStoryPanels({ panels: [panel("qa"), panel("qb")] });
    expect(before.toDefinition().views!.views[0]!.panels).toEqual(new Set(["qa"]));
  });

  it("resolves the camera rule per view, default stay", () => {
    const { views } = scene().setViews([{ ...A, camera: "start" }, { ...B, camera: { follow: "pb" } }, { ...BOTH, camera: { focus: "moon" } }, { id: "plain", label: "Plain" }], bar).toDefinition().views!;
    expect(views.map((view) => view.camera)).toEqual([{ rule: "start" }, { rule: "start", framing: { follow: "pb" } }, { rule: "start", framing: { focus: "moon" } }, { rule: "stay" }]);
    expect(scene().setViews([{ ...A, camera: "stay" }], bar).toDefinition().views!.views[0]!.camera).toEqual({ rule: "stay" });
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
    ["ids that are not a list", () => scene().setViews([{ ...A, paths: "pa" as never }], bar), /view "a" paths must be a list of non-empty ids/],
    ["a camera that is not a rule", () => scene().setViews([{ ...A, camera: "orbit" as never }], bar), /view "a" camera must be "stay", "start", \{ follow: id \} or \{ focus: id \}/],
    ["a camera that follows and focuses", () => scene().setViews([{ ...A, camera: { follow: "pa", focus: "pa" } as never }], bar), /view "a" camera must be/],
  ])("refuses %s with bad-view", (_name, call, message) => { expect(messageOf(call)).toMatch(message); });

  it.each([
    ["an unknown path", { ...A, paths: ["nope"] }, /view "a" paths: "nope" is not a path \(addTrajectory\)/],
    ["a body given as a path", { ...A, paths: ["moon"] }, /view "a" paths: "moon" is not a path/],
    ["an unknown body", { ...A, bodies: ["pluto"] }, /view "a" bodies: "pluto" is not a body or group/],
    ["an unknown event", { ...A, events: ["nope"] }, /view "a" events: "nope" is not an event \(addEvents\)/],
    ["an unknown panel", { ...A, panels: ["nope"] }, /view "a" panels: "nope" is not a story panel \(addStoryPanels\)/],
    ["a camera target the scene does not hold", { ...A, camera: { follow: "nope" } }, /view "a" camera: "nope" is not shown in that view/],
    ["a camera target the view hides", { ...A, camera: { follow: "pb" } }, /view "a" camera: "pb" is not shown in that view/],
  ] as [string, ViewInput, RegExp][])("refuses %s when the scene is built", (_name, view, message) => {
    const built = scene().setViews([view, B], bar);
    expect(messageOf(() => built.toDefinition())).toMatch(new RegExp(`^bad-view: setViews: ${message.source}`));
  });

  it("refuses a panel id when the scene has no story panels", () => {
    expect(messageOf(() => new Scene().addBody(earth).setViews([{ id: "a", label: "A", panels: ["qa"] }], bar).toDefinition())).toMatch(/panels: "qa" is not a story panel/);
  });

  it("changes nothing else in the definition", () => {
    const plain = scene().toDefinition();
    const viewed = scene().setViews([A, B], bar).toDefinition();
    expect(viewed.experience.objects.map((object) => object.id)).toEqual(plain.experience.objects.map((object) => object.id));
    expect(viewed.experience.events).toEqual(plain.experience.events);
    expect(viewed.displaySwitches).toBeUndefined();
  });
});
