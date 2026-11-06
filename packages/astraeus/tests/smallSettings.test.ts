// O-059 T-266: the small public settings, each proved on a made-up scene that changes that one input alone (ARCH-03; Guardrails API-02: `Scene` calls reach the viewer
// through `toDefinition`, which `mount` and `AstraeusScene` both use, so one path covers both). Defaults are asserted beside each setting.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, sun, type DataSource } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { listedObjects } from "../src/shell/objectModel";

const DAY_MS = 86_400_000;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const everything: DataSource = { name: "made-up", provides: catalogue.ids() };
const objectOf = (scene: Scene, id: string) => scene.toDefinition([everything]).experience.objects.find((object) => object.id === id)!;
const pathsOf = (scene: Scene) => scene.toDefinition([everything]).composition?.paths ?? [];
const resolver = () => createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const rowsOf = (scene: Scene, id: string) => scene.toDefinition([everything]).createMetrics({ resolver: resolver(), catalogue, clock: undefined as never })(id, Date.UTC(2026, 3, 1)).map((row) => row.kind);

describe("AddBodyOptions.listed", () => {
  it("defaults to listed; false leaves the body out of the object menu until it is the selected one", () => {
    const plain = new Scene().addBody(earth).addBody(moon);
    expect(plain.bodies.map((body) => body.listed)).toEqual([true, true]);
    expect(objectOf(plain, "moon").listed).toBeUndefined();
    const hidden = new Scene().addBody(earth).addBody(moon, { listed: false });
    expect(hidden.bodies.map((body) => body.listed)).toEqual([true, false]);
    const { experience } = hidden.toDefinition([everything]);
    expect(listedObjects(experience, "earth").map((object) => object.id)).toEqual(["earth"]);
    expect(listedObjects(experience, "moon").map((object) => object.id)).toEqual(["earth", "moon"]);
  });
  it("refuses a non-boolean with bad-body", () => {
    expect(codeOf(() => new Scene().addBody(earth, { listed: "no" as never }))).toMatch(/^bad-body: addBody\("earth"\): listed must be true or false/);
  });
});

describe("AddBodyOptions.facts", () => {
  const facts = [{ label: "Made-up fact", value: "Invented" }, { label: "Second", value: "Also invented" }];
  it("shows on the info card in order and reads back from scene.bodies; absent by default", () => {
    expect(new Scene().addBody(earth).bodies[0]!.facts).toBeUndefined();
    expect(objectOf(new Scene().addBody(earth), "earth").facts).toBeUndefined();
    const scene = new Scene().addBody(earth).addBody(moon, { facts });
    expect(objectOf(scene, "moon").facts).toEqual(facts);
    expect(scene.bodies[1]!.facts).toEqual(facts);
    expect(Object.isFrozen(scene.bodies[1]!.facts![0])).toBe(true);
  });
  it("refuses a fact without both texts", () => {
    expect(codeOf(() => new Scene().addBody(earth, { facts: [{ label: "x", value: "" }] }))).toMatch(/^bad-body: .*facts must be a list/);
    expect(codeOf(() => new Scene().addBody(earth, { facts: "x" as never }))).toMatch(/^bad-body/);
  });
});

describe("AddBodyOptions.sources", () => {
  it("adds sources after the body's own on the card and in provenanceOf; none by default", () => {
    const own = catalogue.get("moon").definition.accuracy.position;
    const plain = new Scene().addBody(earth).addBody(moon);
    expect(plain.provenanceOf("moon").sources).toEqual(own.sources);
    expect(objectOf(plain, "moon").provenance).toEqual(own);
    const scene = new Scene().addBody(earth).addBody(moon, { sources: ["A made-up list, 2026", "Another made-up note"] });
    expect(scene.provenanceOf("moon").sources).toEqual([...own.sources, "A made-up list, 2026", "Another made-up note"]);
    expect(objectOf(scene, "moon").provenance!.sources).toEqual(scene.provenanceOf("moon").sources);
    expect(objectOf(scene, "moon").provenance!.accuracy).toBe(own.accuracy);
  });
  it("refuses an empty source", () => {
    expect(codeOf(() => new Scene().addBody(earth, { sources: [""] }))).toMatch(/^bad-body: .*sources must be a list of non-empty texts/);
  });
});

describe("AddBodyOptions.labelPriority", () => {
  it("defaults to 100 minus the body's place in the scene; a given number replaces it", () => {
    const priorities = (scene: Scene) => ["earth", "moon"].map((id) => objectOf(scene, id).labelPriority);
    expect(priorities(new Scene().addBody(earth).addBody(moon))).toEqual([100, 99]);
    expect(priorities(new Scene().addBody(earth).addBody(moon, { labelPriority: 250 }))).toEqual([100, 250]);
  });
  it("refuses a number that is not finite", () => {
    expect(codeOf(() => new Scene().addBody(earth, { labelPriority: Number.NaN }))).toMatch(/^bad-body: .*labelPriority/);
  });
});

describe("AddBodyOptions.orbit as a lap", () => {
  it("draws a moon with no period on record from the lap given, and refuses orbit: true for it", () => {
    expect(codeOf(() => new Scene().addBody("mars").addBody("phobos", { orbit: true }))).toMatch(/^no-orbit/);
    const lap = (orbit: { lapDays: number; fades?: boolean }) => pathsOf(new Scene().addBody("mars").addBody("phobos", { orbit }));
    expect(lap({ lapDays: 0.5 })).toEqual([{ body: "phobos", spanMs: 0.5 * DAY_MS, look: { endFadeOn: false } }]);
    expect(lap({ lapDays: 0.5, fades: true })).toEqual([{ body: "phobos", spanMs: 0.5 * DAY_MS }]);
    expect(new Scene().addBody("mars").addBody("phobos", { orbit: { lapDays: 0.5 } }).bodies[1]!.orbit).toBe(true);
  });
  it("replaces the period of a moon that has one, and `fades` absent follows the moon's own rule (the Moon's line fades)", () => {
    const own = pathsOf(new Scene().addBody("earth").addBody("moon", { orbit: true }))[0]!;
    const lap = pathsOf(new Scene().addBody("earth").addBody("moon", { orbit: { lapDays: 10 } }))[0]!;
    expect(lap.spanMs).toBe(10 * DAY_MS);
    expect(own.spanMs).not.toBe(lap.spanMs);
    expect(lap.look).toEqual(own.look);
    expect(pathsOf(new Scene().addBody("earth").addBody("moon", { orbit: { lapDays: 10, fades: false } }))[0]!.look).toEqual({ endFadeOn: false });
  });
  it("is checked: a bad lap or fades is bad-body, a body that circles the Sun is no-orbit, and the parent must be in the scene", () => {
    expect(codeOf(() => new Scene().addBody(earth).addBody(moon, { orbit: { lapDays: 0 } }))).toMatch(/^bad-body: .*lapDays/);
    expect(codeOf(() => new Scene().addBody(earth).addBody(moon, { orbit: { lapDays: 1, fades: 1 as never } }))).toMatch(/^bad-body: .*fades/);
    expect(codeOf(() => new Scene().addBody(sun).addBody(earth, { orbit: { lapDays: 365 } }))).toMatch(/^no-orbit: .*lap form/);
    expect(codeOf(() => new Scene().addBody(moon, { orbit: { lapDays: 10 } }).toDefinition([everything]))).toMatch(/^no-orbit: .*about earth/);
  });
});

describe("Scene.setBodyReadouts", () => {
  const scene = () => new Scene().addBody(earth).addBody(moon);
  it("defaults to the distance row; the kinds given replace it, in order", () => {
    const base = rowsOf(scene(), "moon");
    expect(base.length).toBeGreaterThan(0);
    expect(new Set(base)).toEqual(new Set(["distance"]));
    expect(rowsOf(scene().setBodyReadouts(["distance"]), "moon")).toEqual(base);
    expect(rowsOf(scene().setBodyReadouts(["distance", "phase", "coordinates"]), "moon")).toEqual([...base, "phase", "coordinates"]);
    expect(rowsOf(scene().setBodyReadouts(["phase"]), "moon")).toEqual(["phase"]);
    expect(rowsOf(scene().setBodyReadouts([]), "moon")).toEqual([]);
  });
  it("refuses an unknown kind with bad-readout", () => {
    expect(codeOf(() => scene().setBodyReadouts(["temperature" as never]))).toMatch(/^bad-readout: setBodyReadouts/);
    expect(codeOf(() => scene().setBodyReadouts("distance" as never))).toMatch(/^bad-readout/);
  });
});

describe("SceneCamera.setReach { farEarthRadii }", () => {
  const far = (scene: Scene) => scene.toDefinition([everything]).camera;
  it("defaults the far plane to 2.5 times the reach; farEarthRadii sets it", () => {
    expect(far(new Scene().addBody(earth).addBody(moon))).toBeUndefined();
    const scene = new Scene().addBody(earth).addBody(moon);
    scene.camera.setReach(100);
    expect(far(scene)).toEqual({ maxFocusDistance: 100, far: 250 });
    const wide = new Scene().addBody(earth).addBody(moon);
    wide.camera.setReach(100, { farEarthRadii: 700 });
    expect(far(wide)).toEqual({ maxFocusDistance: 100, far: 700 });
  });
  it("refuses a far plane nearer than the reach, and fitOrbit forgets it", () => {
    expect(codeOf(() => new Scene().addBody(earth).camera.setReach(100, { farEarthRadii: 50 }))).toMatch(/^bad-camera: .*farEarthRadii/);
    const scene = new Scene().addBody(sun).addBody(earth);
    scene.camera.setReach(100, { farEarthRadii: 700 }).fitOrbit("earth");
    expect(scene.camera.farEarthRadii).toBeUndefined();
  });
});

describe("SceneCamera.setStartView", () => {
  const pose = { focus: "moon", azimuthDeg: 20, elevationDeg: 30, distance: 12 };
  const scene = () => new Scene().addBody(earth).addBody(moon);
  it("opens at the pose with no camera button pressed; none by default", () => {
    expect(scene().toDefinition([everything]).startView).toBeUndefined();
    const built = scene();
    built.camera.setStartView(pose);
    const definition = built.toDefinition([everything]);
    expect(definition.startView).toEqual(pose);
    expect(definition.experience.startCameraPresetId).toBeUndefined();
  });
  it("is last-wins with follow and lookAt", () => {
    const built = scene();
    built.camera.setStartView(pose).follow("earth");
    expect(built.toDefinition([everything]).experience.startCameraPresetId).toBe("follow-earth");
    expect(built.toDefinition([everything]).startView?.focus).toBe("earth");
    const back = scene();
    back.camera.lookAt("earth").setStartView(pose);
    const definition = back.toDefinition([everything]);
    expect(definition.experience.startCameraPresetId).toBeUndefined();
    expect(definition.startView).toEqual(pose);
  });
  it("is checked: an unknown focus is unknown-body, a bad angle or distance is bad-camera", () => {
    expect(codeOf(() => scene().camera.setStartView({ ...pose, focus: "mars" }))).toMatch(/^unknown-body: camera.setStartView/);
    expect(codeOf(() => scene().camera.setStartView({ ...pose, elevationDeg: 95 }))).toMatch(/^bad-camera: .*elevationDeg/);
    expect(codeOf(() => scene().camera.setStartView({ ...pose, distance: 0 }))).toMatch(/^bad-camera: .*distance/);
  });
});

describe("SceneCamera.setFollowChoices", () => {
  const follows = (scene: Scene) => scene.toDefinition([everything]).experience.cameraPresets.filter((preset) => preset.id.startsWith("follow-")).map((preset) => preset.id);
  const focuses = (scene: Scene) => scene.toDefinition([everything]).experience.cameraPresets.filter((preset) => preset.id.startsWith("focus-")).map((preset) => preset.id);
  const scene = () => new Scene().addBody(earth).addBody(moon);
  it("offers Follow on every body by default; the list given keeps Focus on all and Follow on the listed only", () => {
    expect(follows(scene())).toEqual(["follow-earth", "follow-moon"]);
    const some = scene();
    some.camera.setFollowChoices([moon]);
    expect(follows(some)).toEqual(["follow-moon"]);
    expect(focuses(some)).toEqual(["focus-earth", "focus-moon"]);
    const none = scene();
    none.camera.setFollowChoices([]);
    expect(follows(none)).toEqual([]);
  });
  it("is checked: an unknown id is unknown-body; an opening follow of an unlisted object is bad-camera when built", () => {
    expect(codeOf(() => scene().camera.setFollowChoices(["mars"]))).toMatch(/^unknown-body: camera.setFollowChoices/);
    const built = scene();
    built.camera.follow("earth").setFollowChoices(["moon"]);
    expect(codeOf(() => built.toDefinition([everything]))).toMatch(/^bad-camera: .*follows "earth"/);
  });
});

describe("SceneBodyRead.texture", () => {
  it("is the picture and licence the engine ships for the body, absent for a flat-coloured body", () => {
    const bodies = new Scene().addBody(earth).addBody(moon).bodies;
    expect(bodies[0]!.texture?.licence).toBeDefined();
    expect(bodies[0]!.texture).toBe(catalogue.get("earth").visual.texture);
    expect(new Scene().addBody("mars").addBody("phobos").bodies[1]!.texture).toBeUndefined();
  });
});
