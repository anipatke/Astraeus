// Sun-centred scenes of the public API (O-042 T-174), proved on made-up configurations (ARCH-03): an orbit line for any body that circles the Sun, your own body from
// published elements, planet enlargement, a label that starts off, label reach at solar-system distances, and named errors.
import { describe, expect, it, vi } from "vitest";
import { Scene, SceneError, earth, mars, mercury, sun, type ElementsBodyRecord } from "astraeus";
import { catalogue as builtIn } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { bodyMetrics } from "../src/app/bodyMetrics";
import { sunCentredOf, visualOverridesOf } from "../src/app/experienceDefinition";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
/** A made-up comet: eccentric (0.9), a 6 AU axis, nothing from any real catalogue. */
const comet = (extra: Partial<ElementsBodyRecord> = {}): ElementsBodyRecord => ({
  id: "made-up-comet",
  label: "Made-up comet",
  elements: { semiMajorAxisAu: 6, eccentricity: 0.9, inclinationDeg: 40, ascendingNodeDeg: 100, argumentOfPerihelionDeg: 60, meanAnomalyDeg: 200 },
  epoch: { jd: 2_461_000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
  frame: "ecliptic-j2000",
  source: { name: "Invented Survey", url: "https://example.invalid/comet", solution: "Solution A", accessed: "2026-10-24" },
  accuracy: { classification: "indicative", statement: "Made up; no comparison was made.", validFromUtc: "2025-01-01T00:00:00Z", validToUtc: "2027-01-01T00:00:00Z", limitations: ["Invented for a test."] },
  marker: { color: "#ff9966", sizePx: 8 },
  ...extra,
});
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const solar = () => new Scene().addBody(sun).setTime(T0);

describe("orbit lines round the Sun", () => {
  it("draws Earth's year and a planet's turn from the bodies' own position sources", () => {
    const definition = solar().addBody(earth, { orbit: true }).addBody(mars, { orbit: true }).addBody(mercury).toDefinition();
    expect(definition.sceneLayers).toContain("sun-centred");
    const { paths } = sunCentredOf(definition);
    expect(paths.map((path) => path.object.id)).toEqual(["earth-orbit", "mars-orbit"]);
    const [year, turn] = paths.map((path) => path.span as { startUtcMs: number; endUtcMs: number });
    expect(year!.startUtcMs).toBe(T0);
    expect((year!.endUtcMs - year!.startUtcMs) / DAY).toBeGreaterThan(364);
    expect((year!.endUtcMs - year!.startUtcMs) / DAY).toBeLessThan(367);
    expect((turn!.endUtcMs - turn!.startUtcMs) / DAY).toBeGreaterThan(680);
    expect((turn!.endUtcMs - turn!.startUtcMs) / DAY).toBeLessThan(695);
    expect(paths[0]!.object).toMatchObject({ partOf: "earth", showLabel: false });
    expect(paths[0]!.object.provenance).toBeDefined();
  });

  it("closes the turn: the line ends where it began, about the Sun", () => {
    const [path] = sunCentredOf(solar().addBody(earth, { orbit: true }).toDefinition()).paths;
    const span = path!.span as { startUtcMs: number; endUtcMs: number };
    const a = path!.source.stateAt(span.startUtcMs, "sun").positionKm;
    const b = path!.source.stateAt(span.endUtcMs, "sun").positionKm;
    expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.002 * Math.hypot(a[0], a[1], a[2]));
  });

  it("adds no sun-centred layer when no body asks for one, and names the missing Sun when it is absent", () => {
    expect(solar().addBody(earth).toDefinition().sceneLayers).not.toContain("sun-centred");
    expect(codeOf(() => new Scene().addBody(earth).addBody(mars, { orbit: true }).toDefinition())).toMatch(/^no-orbit: .*about the Sun, which has not been added/);
    expect(codeOf(() => solar().addBody("sun" as never, { orbit: true }))).toMatch(/^no-orbit: .*any body that circles the Sun/);
  });
});

describe("a built-in comet", () => {
  it("draws its whole orbit from periapsis, and the line closes", () => {
    const [path] = sunCentredOf(solar().addBody("swift-tuttle", { orbit: true }).toDefinition()).paths;
    expect(path!.object.id).toBe("swift-tuttle-orbit");
    const span = path!.span as { startUtcMs: number; endUtcMs: number };
    const years = (span.endUtcMs - span.startUtcMs) / (365.25 * DAY);
    expect(years).toBeGreaterThan(125);
    expect(years).toBeLessThan(140);
    const a = path!.source.stateAt(span.startUtcMs, "sun").positionKm;
    const b = path!.source.stateAt(span.endUtcMs, "sun").positionKm;
    expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.001 * Math.hypot(a[0], a[1], a[2]));
  });
});

describe("addBodyFromElements", () => {
  it("adds a made-up comet with its provenance, in the catalogue the definition carries", () => {
    const definition = solar().addBody(earth).addBodyFromElements(comet(), { description: "A comet that is not real." }).toDefinition();
    expect(definition.catalogue?.has("made-up-comet")).toBe(true);
    const object = definition.experience.objects.find((item) => item.id === "made-up-comet")!;
    expect(object).toMatchObject({ label: "Made-up comet", color: "#ff9966", description: "A comet that is not real." });
    expect(object.provenance!.sources.join(" ")).toMatch(/Invented Survey/);
    expect(object.knownLimitations!.join(" ")).toMatch(/Invented for a test/);
    expect(definition.composition!.bodies).toContain("made-up-comet");
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toContain("focus-made-up-comet");
  });

  it("draws its whole orbit smoothly: one period from periapsis, passing through the source", () => {
    const definition = solar().addBodyFromElements(comet(), { orbit: true }).toDefinition();
    const [path] = sunCentredOf(definition).paths;
    expect(path!.object.id).toBe("made-up-comet-orbit");
    expect(path!.sampling?.eccentricity).toBeCloseTo(0.9, 10);
    const span = path!.span as { startUtcMs: number; endUtcMs: number };
    const years = (span.endUtcMs - span.startUtcMs) / (365.25 * DAY);
    expect(years).toBeGreaterThan(14);
    expect(years).toBeLessThan(15.5); // 6 AU: 6^1.5 = 14.7 years
    const start = path!.source.stateAt(span.startUtcMs, "sun").positionKm;
    const peri = Math.hypot(start[0], start[1], start[2]) / 149_597_870.7;
    expect(peri).toBeCloseTo(0.6, 2); // a(1 - e): the span starts at periapsis
  });

  it("names the field of a bad record and refuses a repeated id", () => {
    expect(codeOf(() => solar().addBodyFromElements(comet({ elements: { ...comet().elements, eccentricity: 1.2 } })))).toMatch(/^bad-element: .*elements\.eccentricity/);
    expect(codeOf(() => solar().addBodyFromElements(comet({ source: { ...comet().source, url: "" } })))).toMatch(/^bad-element: .*source\.url/);
    expect(codeOf(() => solar().addBodyFromElements(comet()).addBodyFromElements(comet()))).toMatch(/^duplicate-id/);
    expect(codeOf(() => solar().addBodyFromElements(comet({ id: "earth" })))).toMatch(/^duplicate-id/);
    expect(codeOf(() => solar().addBodyFromElements(comet(), { enlarge: 0.5 }))).toMatch(/^bad-body/);
  });

  it("leaves the built-in catalogue untouched", () => {
    solar().addBodyFromElements(comet());
    expect(codeOf(() => new Scene().addBody("made-up-comet" as never))).toMatch(/^unknown-body/);
  });
});

describe("enlarge, label off and label reach", () => {
  it("enlarges a planet in the readable scale and refuses a smaller-than-life value", () => {
    const definition = solar().addBody(earth, { enlarge: 20 }).toDefinition();
    expect(visualOverridesOf(definition).get("earth")).toEqual({ exaggeration: 20 });
    expect(codeOf(() => solar().addBody(earth, { enlarge: 0.5 }))).toMatch(/^bad-body: .*enlarge 0.5 must be a number of at least 1/);
    expect(codeOf(() => solar().addBody(earth, { enlarge: Number.NaN }))).toMatch(/^bad-body/);
  });

  it("starts a label off on request and keeps the body in the menu", () => {
    const definition = solar().addBody(earth, { showLabel: false }).addBody(mars).toDefinition();
    const objects = definition.experience.objects;
    expect(objects.find((item) => item.id === "earth")!.showLabel).toBe(false);
    expect(objects.find((item) => item.id === "mars")!.showLabel).toBeUndefined();
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toContain("focus-earth");
    expect(codeOf(() => solar().addBody(earth, { showLabel: "no" as never }))).toMatch(/^bad-body/);
  });

  it("sets no label reach in a Sun-centred scene, so labels do not fade when zoomed out; an Earth-centred scene keeps its own", () => {
    for (const object of solar().addBody(earth).addBody(mars).toDefinition().experience.objects) expect(object.labelMaxDistance).toBeUndefined();
    expect(new Scene().addBody(earth).toDefinition().experience.objects[0]!.labelMaxDistance).toBe(500);
  });
});

describe("the public path without the planet series preloaded (O-042 T-177)", () => {
  // vitest.setup.ts preloads the planet series into the module instance the other tests share. Resetting the module registry and importing "astraeus" afresh gives a second
  // instance whose planet series are NOT loaded, which is what a consumer's page has at `mount`.
  const fresh = async () => {
    vi.resetModules();
    const api = await import("astraeus");
    const series = await import("../src/core/planetSeries");
    const definitionModule = await import("../src/app/experienceDefinition");
    expect(series.planetSeriesLoaded()).toBe(false);
    return { ...api, series, sunCentredOf: definitionModule.sunCentredOf };
  };

  it("builds a Sun-centred scene with planet orbit lines, then draws the lines once prepare has loaded the series", async () => {
    const api = await fresh();
    const definition = new api.Scene().addBody(api.sun).addBody(api.mars, { orbit: true }).addBody(api.earth, { orbit: true }).setTime(T0).toDefinition();
    expect(definition.sceneLayers).toContain("sun-centred");
    await definition.prepare!();
    expect(api.series.planetSeriesLoaded()).toBe(true);
    const ids = api.sunCentredOf(definition).paths.map((path) => path.object.id);
    expect(ids.sort()).toEqual(["earth-orbit", "mars-orbit"]);
  });

  it("builds a group clumped near a planet the same way", async () => {
    const api = await fresh();
    const orbits = [0, 1, 2].map((k) => ({ id: `r${k}`, semiMajorAxisKm: 2e8 + 1e7 * k, eccentricity: 0.2, inclinationDeg: 5, raanDeg: 40 + k, argumentOfPeriapsisDeg: 70 }));
    const definition = new api.Scene().addBody(api.sun).addBody(api.mars).addGroup({ id: "swarm", orbits, center: "sun", clump: { near: "mars", fraction: 0.5, widthDeg: 20 } }).setTime(T0).toDefinition();
    expect(definition.groups).toHaveLength(0);
    await definition.prepare!();
    expect(definition.groups!.map((layer) => layer.object.id)).toEqual(["swarm"]);
  });
});

describe("the solar-system scale for an enlarged body", () => {
  const choices = (scene: Scene) => scene.toDefinition().scaleChoices;
  it("is offered second in place of the readable scale when a Sun-centred scene enlarges a body", () => {
    expect(choices(solar().addBody(earth, { enlarge: 20 }))).toEqual(["true-scale", "solar-system"]);
  });
  it("gives the card the same live Distance from Sun readout as a built-in comet (O-045 T-187)", () => {
    const definition = solar().addBody(earth).addBodyFromElements(comet()).toDefinition();
    const own = definition.catalogue!;
    const resolver = createStateResolver(own.definitions(), own.sources(), createOrbAstronomyAdapter());
    const metrics = definition.createMetrics({ resolver, catalogue: own, clock: undefined as never });
    const at = (time: number) => metrics("made-up-comet", time).find((metric) => metric.label === "Distance from Sun") as { value: number; unit: string; digits: number; context: string };
    const first = at(T0);
    expect(first).toMatchObject({ kind: "distance", id: "made-up-comet-range", unit: "km", digits: 0 });
    expect(first.context).toMatch(/^centre to centre/);
    expect(first.value).toBeGreaterThan(0.1 * 149_597_870.7);
    expect(first.value).toBeLessThan(11.4 * 149_597_870.7);
    expect(at(T0 + 100 * DAY).value).not.toBe(first.value);
    // Swift-Tuttle, built in, has the same shape of readout (its format is the model).
    const builtInResolver = createStateResolver(builtIn.definitions(), builtIn.sources(), createOrbAstronomyAdapter());
    const swift = bodyMetrics(builtInResolver, ["sun", "swift-tuttle"], ["distance"])("swift-tuttle", T0).find((metric) => metric.label === "Distance from Sun");
    expect(swift).toMatchObject({ kind: "distance", id: "swift-tuttle-range", unit: "km", digits: 0 });
  });

  it("leaves scenes without an enlarged body, and scenes not centred on the Sun, unchanged", () => {
    expect(choices(solar().addBody(earth))).toEqual(["true-scale", "readable-scale"]);
    expect(choices(new Scene().addBody(earth, { enlarge: 20 }).addBody(mars).setTime(T0))).toEqual(["true-scale", "readable-scale"]);
  });
});
