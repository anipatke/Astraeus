// O-059 T-268: `Scene.setMoonPanel` and `Scene.addPlaces`, proved on a made-up system (ARCH-03): a made-up swarm of dots about Earth and a body, a made-up panel and made-up places;
// each input changed alone, the reads, check, and the typed `bad-moon-panel` and `bad-places` errors. The two embedding paths are covered in twoViewers.test.ts.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type BodySetInput, type DataSource, type MoonPanelInput, type PlacesInput } from "astraeus";
import { prepareScene } from "../src/api/prepared";
import { featureColor, findFeature } from "../src/shell/bodyFeatures";
import { moonListSummary } from "../src/shell/moonFamilies";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const PROVENANCE = { sourceType: "illustrative", sources: ["Made up for a test"], accuracy: "Not real.", notes: "Invented." } as const;
const swarm = (): BodySetInput => ({
  id: "swarm",
  families: [{ id: "inner", label: "Inner swarm" }],
  members: [0, 1, 2].map((k) => ({ id: `bit-${k}`, label: `Bit ${k}`, radiusKm: 4, family: "inner", elements: { semiMajorAxisKm: 30_000 + 4_000 * k, eccentricity: 0.05, inclinationDeg: 3, raanDeg: 20, argumentOfPeriapsisDeg: 40, trueAnomalyDeg: 10 + 30 * k } })),
  provenance: PROVENANCE,
  centerGmKm3S2: 4.0e5,
});
const base = () => new Scene().addBody(earth).addBody(moon).addBodySet(swarm()).setTime(T0).setTimeline({ start: T0, end: T0 + 60 * DAY });
const panel = (extra: Partial<MoonPanelInput> = {}): MoonPanelInput => ({
  label: "Tarn",
  families: [
    { id: "big", label: "Big moons", description: "The one with a picture.", moons: [{ id: "moon" }] },
    { id: "small", label: "Small swarm", description: "Three dots.", moons: [{ id: "bit-0" }, { id: "bit-1" }, { id: "bit-2", named: false }] },
  ],
  featuredFamily: "big",
  listSource: "A made-up list",
  listDate: "2026-10-18",
  ...extra,
});
const places = (extra: Partial<PlacesInput> = {}): PlacesInput => ({
  categories: [{ key: "pit", label: "Pits", color: "#9de3a8" }, { key: "hill", label: "Hills", color: "#aabbcc" }],
  places: [
    { id: "deep", name: "Deep Pit", kind: "Pit", category: "pit", latitudeDeg: 12.3456789, longitudeDeg: -40.25, description: "A made-up pit.", details: [{ label: "Depth", value: "3 km" }] },
    { id: "high", name: "High Hill", kind: "Hill", category: "nowhere", latitudeDeg: -80, longitudeDeg: 170, description: "A made-up hill." },
  ],
  provenance: PROVENANCE,
  knownLimitations: ["Made up."],
  ...extra,
});
const picture = { url: "/made-up/moon.jpg", licence: { name: "Invented", credit: "Nobody" } } as never;
const data: DataSource = { name: "made-up-pictures", provides: [], pictures: { moon: picture } };
const experienceOf = (scene: Scene, sources: readonly DataSource[] = []) => prepareScene(scene, sources).definition.experience;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };

describe("setMoonPanel on a made-up system", () => {
  it("builds the panel list: heading, families, labels from the scene, the featured family, the source and the day", () => {
    const list = experienceOf(base().setMoonPanel(panel())).moonFamilies!;
    expect(list.planetLabel).toBe("Tarn");
    expect(list.featuredFamilyId).toBe("big");
    expect(list.listSource).toBe("A made-up list");
    expect(list.listDate).toBe("2026-10-18");
    expect(list.families.map(({ id, label, description }) => [id, label, description])).toEqual([["big", "Big moons", "The one with a picture."], ["small", "Small swarm", "Three dots."]]);
    expect(list.families[1]!.moons.map(({ id, label, named }) => [id, label, named])).toEqual([["bit-0", "Bit 0", true], ["bit-1", "Bit 1", true], ["bit-2", "Bit 2", false]]);
    expect(list.families[0]!.moons[0]).toMatchObject({ id: "moon", label: "Moon", named: true });
  });

  it("pictures come from the viewer's data: a body gets its picture only when data brings one, a dot never", () => {
    expect(experienceOf(base().setMoonPanel(panel())).moonFamilies!.families[0]!.moons[0]!.pictureUrl).toBeUndefined();
    const withData = experienceOf(base().setMoonPanel(panel()), [data]).moonFamilies!;
    expect(withData.families[0]!.moons[0]!.pictureUrl).toBe("/made-up/moon.jpg");
    expect(withData.families[1]!.moons.every((one) => one.pictureUrl === undefined)).toBe(true);
    expect(experienceOf(base().setMoonPanel(panel({ families: [{ id: "all", label: "All", description: "Dots.", moons: [{ id: "bit-0" }] }], featuredFamily: undefined })), [data]).moonFamilies!.families[0]!.moons[0]!.pictureUrl).toBeUndefined();
  });

  it("each input changed alone changes only its own part", () => {
    const plain = experienceOf(base().setMoonPanel(panel())).moonFamilies!;
    const label = experienceOf(base().setMoonPanel(panel({ label: "Elsewhere" }))).moonFamilies!;
    expect({ ...label, planetLabel: "Tarn" }).toEqual(plain);
    const featured = experienceOf(base().setMoonPanel(panel({ featuredFamily: "small" }))).moonFamilies!;
    expect({ ...featured, featuredFamilyId: "big" }).toEqual(plain);
    const source = experienceOf(base().setMoonPanel(panel({ listSource: "Another list" }))).moonFamilies!;
    expect({ ...source, listSource: "A made-up list" }).toEqual(plain);
    const date = experienceOf(base().setMoonPanel(panel({ listDate: "2026-01-02T10:00:00Z" }))).moonFamilies!;
    expect({ ...date, listDate: "2026-10-18" }).toEqual(plain);
    expect(date.listDate).toBe("2026-01-02");
    const bare = experienceOf(base().setMoonPanel(panel({ featuredFamily: undefined, listSource: undefined, listDate: undefined }))).moonFamilies!;
    expect(bare.featuredFamilyId).toBeUndefined();
    expect(bare.listSource).toBeUndefined();
    expect(bare.listDate).toBeUndefined();
  });

  it("reads: count and summary answer at once, say 'in the <source> list of <date>', and a later call replaces the panel", () => {
    const scene = base();
    expect(scene.moonPanel).toBeUndefined();
    scene.setMoonPanel(panel());
    expect(scene.moonPanel).toEqual({ count: 4, summary: "4 moons in the A made-up list list of 18 October 2026" });
    expect(scene.moonPanel!.summary).toBe(moonListSummary(4, "A made-up list", "2026-10-18"));
    expect(Object.isFrozen(scene.moonPanel)).toBe(true);
    scene.setMoonPanel(panel({ listSource: undefined, listDate: undefined, families: [{ id: "one", label: "One", description: "One.", moons: [{ id: "moon" }] }], featuredFamily: undefined }));
    expect(scene.moonPanel).toEqual({ count: 1, summary: "1 moon" });
    expect(experienceOf(scene).moonFamilies!.families).toHaveLength(1);
  });

  it("a scene with no panel has no moonFamilies, and the panel call is refused once a viewer has taken the scene", () => {
    expect(experienceOf(base()).moonFamilies).toBeUndefined();
    const scene = base();
    prepareScene(scene);
    expect(codeOf(() => scene.setMoonPanel(panel()))).toBe("scene-mounted");
  });

  it("check throws bad-moon-panel for a moon the scene does not hold, as the build does", () => {
    const scene = base().setMoonPanel(panel({ families: [{ id: "f", label: "F", description: "F.", moons: [{ id: "ghost" }] }], featuredFamily: undefined }));
    expect(codeOf(() => scene.check())).toBe("bad-moon-panel");
    expect(codeOf(() => scene.toDefinition())).toBe("bad-moon-panel");
    expect(codeOf(() => base().setMoonPanel(panel()).check())).toBe("no error");
  });
});

describe("setMoonPanel refuses bad input with bad-moon-panel", () => {
  const family = (extra: object = {}) => ({ id: "f", label: "F", description: "F.", moons: [{ id: "moon" }], ...extra });
  const cases: readonly [string, () => unknown][] = [
    ["no input", () => base().setMoonPanel(undefined as never)],
    ["no label", () => base().setMoonPanel(panel({ label: "" }))],
    ["no families", () => base().setMoonPanel(panel({ families: [] }))],
    ["family without id", () => base().setMoonPanel(panel({ families: [family({ id: "" })] }))],
    ["family twice", () => base().setMoonPanel(panel({ families: [family(), family()] }))],
    ["family without label", () => base().setMoonPanel(panel({ families: [family({ label: "" })] }))],
    ["family without description", () => base().setMoonPanel(panel({ families: [family({ description: "" })] }))],
    ["moons not a list", () => base().setMoonPanel(panel({ families: [family({ moons: "moon" })] }))],
    ["moon without id", () => base().setMoonPanel(panel({ families: [family({ moons: [{ id: "" }] })] }))],
    ["moon twice", () => base().setMoonPanel(panel({ families: [family({ moons: [{ id: "moon" }, { id: "moon" }] })] }))],
    ["named not a boolean", () => base().setMoonPanel(panel({ families: [family({ moons: [{ id: "moon", named: "yes" }] })] }))],
    ["featured family unknown", () => base().setMoonPanel(panel({ featuredFamily: "ghost" }))],
    ["empty list source", () => base().setMoonPanel(panel({ listSource: "" }))],
    ["list date not a moment", () => base().setMoonPanel(panel({ listDate: "last Tuesday" }))],
  ];
  it.each(cases)("%s", (_name, run) => {
    expect(codeOf(run)).toBe("bad-moon-panel");
  });
});

describe("addPlaces on a made-up system", () => {
  it("builds the body's feature set with the words, coordinates as given, the category colours and the provenance", () => {
    const sets = experienceOf(base().addPlaces("moon", places())).bodyFeatures!;
    expect(sets).toHaveLength(1);
    const set = sets[0]!;
    expect(set.bodyId).toBe("moon");
    expect(set.bodyLabel).toBe("Moon");
    expect(set.categories).toEqual([{ key: "pit", label: "Pits", color: "#9de3a8" }, { key: "hill", label: "Hills", color: "#aabbcc" }]);
    expect(set.features[0]).toEqual({ id: "deep", name: "Deep Pit", featureType: "Pit", category: "pit", latitude: 12.3456789, longitude: -40.25, description: "A made-up pit.", details: [{ label: "Depth", value: "3 km" }] });
    expect(set.features[1]).toMatchObject({ id: "high", details: [], latitude: -80, longitude: 170 });
    expect(set.provenance).toEqual(PROVENANCE);
    expect(set.knownLimitations).toEqual(["Made up."]);
    expect(featureColor(set, set.features[0]!)).toBe("#9de3a8");
    expect(featureColor(set, set.features[1]!)).toBe("#ffffff");
    expect(findFeature(sets, "moon:deep")?.feature.name).toBe("Deep Pit");
  });

  it("a body ref and a body id are the same, and more than one body can have places", () => {
    const sets = experienceOf(base().addPlaces(moon, places()).addPlaces("earth", places({ places: [places().places[0]!] }))).bodyFeatures!;
    expect(sets.map(({ bodyId, bodyLabel }) => [bodyId, bodyLabel])).toEqual([["moon", "Moon"], ["earth", "Earth"]]);
  });

  it("each input changed alone changes only its own part", () => {
    const plain = experienceOf(base().addPlaces("moon", places())).bodyFeatures![0]!;
    const noLimits = experienceOf(base().addPlaces("moon", places({ knownLimitations: undefined }))).bodyFeatures![0]!;
    expect(noLimits.knownLimitations).toBeUndefined();
    expect({ ...noLimits, knownLimitations: ["Made up."] }).toEqual(plain);
    const other = experienceOf(base().addPlaces("moon", places({ provenance: { ...PROVENANCE, sources: ["Another"] } }))).bodyFeatures![0]!;
    expect({ ...other, provenance: PROVENANCE }).toEqual(plain);
    const recoloured = experienceOf(base().addPlaces("moon", places({ categories: [{ key: "pit", label: "Pits", color: "#112233" }, { key: "hill", label: "Hills", color: "#aabbcc" }] }))).bodyFeatures![0]!;
    expect(recoloured.features).toEqual(plain.features);
    expect(recoloured.categories[0]!.color).toBe("#112233");
    const moved = experienceOf(base().addPlaces("moon", places({ places: [{ ...places().places[0]!, latitudeDeg: 30 }, places().places[1]!] }))).bodyFeatures![0]!;
    expect(moved.features[1]).toEqual(plain.features[1]);
    expect(moved.features[0]).toEqual({ ...plain.features[0]!, latitude: 30 });
  });

  it("reads: body and count in order added, fresh and frozen, answering before a build", () => {
    const scene = base();
    expect(scene.places).toEqual([]);
    scene.addPlaces("moon", places()).addPlaces("earth", places({ places: [places().places[0]!] }));
    expect(scene.places).toEqual([{ body: "moon", count: 2 }, { body: "earth", count: 1 }]);
    expect(Object.isFrozen(scene.places)).toBe(true);
    expect(scene.places).not.toBe(scene.places);
    expect(experienceOf(base()).bodyFeatures).toBeUndefined();
  });

  it("a body not in the scene is bad-places at check and build; a second call for one body is duplicate-id; a mounted scene refuses it", () => {
    const ghost = base().addPlaces("mars", places());
    expect(codeOf(() => ghost.check())).toBe("bad-places");
    expect(codeOf(() => ghost.toDefinition())).toBe("bad-places");
    expect(codeOf(() => base().addPlaces("moon", places()).addPlaces("moon", places()))).toBe("duplicate-id");
    const scene = base();
    prepareScene(scene);
    expect(codeOf(() => scene.addPlaces("moon", places()))).toBe("scene-mounted");
  });
});

describe("addPlaces refuses bad input with bad-places", () => {
  const one = places().places[0]!;
  const withPlace = (extra: object) => places({ places: [{ ...one, ...extra }] });
  const cases: readonly [string, () => unknown][] = [
    ["no input", () => base().addPlaces("moon", undefined as never)],
    ["no body", () => base().addPlaces("" as never, places())],
    ["categories not a list", () => base().addPlaces("moon", places({ categories: "pit" as never }))],
    ["category without key", () => base().addPlaces("moon", places({ categories: [{ key: "", label: "L", color: "#fff" }] }))],
    ["category twice", () => base().addPlaces("moon", places({ categories: [{ key: "a", label: "A", color: "#fff" }, { key: "a", label: "B", color: "#fff" }] }))],
    ["category without label", () => base().addPlaces("moon", places({ categories: [{ key: "a", label: "", color: "#fff" }] }))],
    ["category colour not hex", () => base().addPlaces("moon", places({ categories: [{ key: "a", label: "A", color: "green" }] }))],
    ["no places", () => base().addPlaces("moon", places({ places: [] }))],
    ["place without id", () => base().addPlaces("moon", withPlace({ id: "" }))],
    ["place twice", () => base().addPlaces("moon", places({ places: [one, one] }))],
    ["place without name", () => base().addPlaces("moon", withPlace({ name: "" }))],
    ["place without kind", () => base().addPlaces("moon", withPlace({ kind: "" }))],
    ["place without category", () => base().addPlaces("moon", withPlace({ category: "" }))],
    ["place without description", () => base().addPlaces("moon", withPlace({ description: "" }))],
    ["latitude above 90", () => base().addPlaces("moon", withPlace({ latitudeDeg: 91 }))],
    ["latitude not a number", () => base().addPlaces("moon", withPlace({ latitudeDeg: Number.NaN }))],
    ["longitude not finite", () => base().addPlaces("moon", withPlace({ longitudeDeg: Number.POSITIVE_INFINITY }))],
    ["details not facts", () => base().addPlaces("moon", withPlace({ details: [{ label: "L", value: "" }] }))],
    ["no provenance", () => base().addPlaces("moon", places({ provenance: undefined as never }))],
    ["provenance of an unknown type", () => base().addPlaces("moon", places({ provenance: { ...PROVENANCE, sourceType: "guess" as never } }))],
    ["limits not texts", () => base().addPlaces("moon", places({ knownLimitations: [""] }))],
  ];
  it.each(cases)("%s", (_name, run) => {
    expect(codeOf(run)).toBe("bad-places");
  });
});
