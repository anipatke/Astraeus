// O-041 T-166: what a path can carry through the public API (anchors, notes, readouts) and what bodies carry, proved on a made-up path about a made-up centre, not Apollo (ARCH-03).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type Provenance, type ReadoutInput } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { infoView, PROVENANCE_STATUS } from "../src/shell/infoModel";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.UTC(2026, 3, 1);
const MIN = 60_000;
const samples = [0, 1, 2, 3].map((minute) => ({ time: T0 + minute * MIN, positionKm: [8_000 + minute * 1_000, 0, 0], velocityKmS: [2 + minute, 0, 0] }));
const probe = { id: "probe", label: "Probe", samples };
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const resolver = () => createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const metricsOf = (scene: Scene, objectId: string, timeUtcMs: number) => definitionOf(scene).createMetrics({ resolver: resolver(), catalogue, clock: undefined as never })(objectId, timeUtcMs);

describe("body readouts (O-056 T-262)", () => {
  const moonWith = (readouts: ReadoutInput[]) => new Scene().addBody(earth).addBody(moon, { readouts });
  it("draw on the body's info card by the same code as a path's, in the order given, replacing the catalogue's own rows", () => {
    const at = T0 + MIN;
    const rows = metricsOf(moonWith([{ kind: "altitude", above: "earth" }, { kind: "range" }, { kind: "distance", to: "earth" }]), "moon", at) as any[];
    expect(rows.map((row) => row.id)).toEqual(["moon-altitude-earth", "moon-range", "moon-to-earth"]);
    const away = Math.hypot(...resolver().stateOf("moon", at, "earth").positionKm);
    expect(rows[1].value).toBeCloseTo(away, 3);
    expect(rows[0].value).toBeCloseTo(away - catalogue.get("earth").definition.radiusKm, 3);
    expect(metricsOf(new Scene().addBody(earth).addBody(moon), "moon", at).map((row) => row.id)).not.toContain("moon-altitude-earth");
  });
  it("refuse a bad readout with bad-readout, and a named body the scene does not hold when the scene is built", () => {
    expect(codeOf(() => new Scene().addBody(earth).addBody(moon, { readouts: [{ kind: "temperature" } as never] }))).toMatch(/^bad-readout: addBody\("moon"\).*temperature/);
    expect(codeOf(() => new Scene().addBody(earth).addBody(moon, { readouts: "range" as never }))).toMatch(/^bad-readout: .*list/);
    expect(codeOf(() => definitionOf(new Scene().addBody(moon, { readouts: [{ kind: "distance", to: "sun" }] })))).toMatch(/^bad-readout: addBody\("moon"\).*sun.*not been added/);
  });
});

describe("anchors", () => {
  const scene = () => new Scene().addBody(earth).addBody(moon).addTrajectory({ ...probe, anchors: [{ id: "second", time: T0 + 2 * MIN }, { id: "first", time: new Date(T0 + MIN) }] });

  it("become labelled dots on the path, in time order", () => {
    const body = trackedBodiesOf(definitionOf(scene()))[0]!;
    expect(body.anchorTimesUtcMs).toEqual([T0 + MIN, T0 + 2 * MIN]);
    expect(body.anchorLabels).toEqual(["first", "second"]);
  });

  it("moved from the site's scene test (no public read of anchors): twelve anchors on a 97-sample path give twelve labels in order and 97 path times", () => {
    const many = Array.from({ length: 97 }, (_, index) => ({ time: T0 + index * 5 * MIN, positionKm: [8_000 + index, 0, 0] }));
    const body = trackedBodiesOf(definitionOf(new Scene().addBody(earth).addTrajectory({ id: "marker", label: "Marker", center: "earth", samples: many, anchors: Array.from({ length: 12 }, (_, index) => ({ id: `mark-${index + 1}`, time: T0 + (index + 1) * 40 * MIN })) })))[0]!;
    expect(body.anchorLabels).toEqual(Array.from({ length: 12 }, (_, index) => `mark-${index + 1}`));
    expect(body.pathTimesUtcMs).toHaveLength(97);
  });

  it("are none when the path names none", () => {
    expect(trackedBodiesOf(definitionOf(new Scene().addBody(earth).addTrajectory(probe)))[0]!.anchorTimesUtcMs).toEqual([]);
  });

  it.each([
    ["an anchor with no id", [{ id: "", time: T0 }]],
    ["the same id twice", [{ id: "a", time: T0 }, { id: "a", time: T0 + MIN }]],
    ["a time that is not a moment", [{ id: "a", time: "later" }]],
    ["a time before the path", [{ id: "a", time: T0 - MIN }]],
    ["a time after the path", [{ id: "a", time: T0 + 4 * MIN }]],
    ["anchors that are not a list", { id: "a" }],
  ])("refuse %s with bad-anchor", (_name, anchors) => {
    expect(codeOf(() => new Scene().addBody(earth).addTrajectory({ ...probe, anchors: anchors as never }))).toMatch(/^bad-anchor: .*probe/);
  });
});

describe("path and body notes", () => {
  it("put the description and known limits on the path's object", () => {
    const provenance: Provenance = { sourceType: "reconstructed", sources: ["Made up"], accuracy: "None", notes: "Test." };
    const object = definitionOf(new Scene().addBody(earth).addTrajectory({ ...probe, provenance, description: "A made-up probe.", knownLimitations: ["Not real."] })).experience.objects.find((o) => o.id === "probe")!;
    expect(object).toMatchObject({ description: "A made-up probe.", knownLimitations: ["Not real."], provenance });
  });

  it("give every added body its catalogue provenance and limits, and a description when asked", () => {
    const objects = definitionOf(new Scene().addBody(earth, { description: "Home." }).addBody(moon)).experience.objects;
    const [earthObject, moonObject] = [objects[0]!, objects[1]!];
    expect(earthObject).toMatchObject({ id: "earth", label: "Earth", description: "Home.", provenance: catalogue.get("earth").definition.accuracy.position, knownLimitations: catalogue.get("earth").definition.accuracy.orientationLimitations });
    expect(moonObject.provenance).toEqual(catalogue.get("moon").definition.accuracy.position);
    expect(moonObject.description).toBeUndefined();
  });
});

describe("readouts", () => {
  const readouts: ReadoutInput[] = [{ kind: "range", marker: "moon" }, { kind: "speed" }, { kind: "distance", to: "moon" }, { kind: "altitude", above: "earth" }, { kind: "altitude", above: "moon" }];
  const scene = () => new Scene().addBody(earth).addBody(moon).addTrajectory({ ...probe, anchors: [{ id: "a", time: T0 + MIN }, { id: "b", time: T0 + 3 * MIN }], readouts });

  it("show as bars in the info card, in the order given", () => {
    const rows = metricsOf(scene(), "probe", T0 + 2 * MIN);
    expect(rows.map((row) => row.id)).toEqual(["probe-range", "probe-speed", "probe-to-moon", "probe-altitude-earth", "probe-altitude-moon"]);
    expect(rows.map((row) => row.kind)).toEqual(["distance", "speed", "relative-distance", "altitude", "altitude"]);
  });

  it("measure range from the path's centre, speed against the peak anchor speed, and altitude from the mean radius", () => {
    const [range, speed, , altitude] = metricsOf(scene(), "probe", T0 + 2 * MIN) as [any, any, any, any];
    expect(range.value).toBeCloseTo(10_000, 6);
    expect(range.markers?.[0].label).toBe("Moon now");
    expect(speed.value).toBeCloseTo(4, 9);
    expect(speed.range).toMatchObject({ min: 0, max: 5 });
    expect(altitude.value).toBeCloseTo(10_000 - catalogue.get("earth").definition.radiusKm, 6);
    expect(altitude).toMatchObject({ body: "Earth", datum: "mean radius" });
  });

  it("measure a named body through the resolver, about the path's centre", () => {
    const row = metricsOf(scene(), "probe", T0 + 2 * MIN)[2] as any;
    const away = resolver().stateOf("moon", T0 + 2 * MIN, "earth").positionKm;
    expect(row.value).toBeCloseTo(Math.hypot(10_000 - away[0], away[1], away[2]), 3);
    expect(row.to).toBe("Moon");
  });

  it("are empty for a path outside its bounds, a path with none, and any other id", () => {
    expect(metricsOf(scene(), "probe", T0 + 10 * MIN)).toEqual([]);
    expect(metricsOf(new Scene().addBody(earth).addTrajectory(probe), "probe", T0 + MIN)).toEqual([]);
    expect(metricsOf(scene(), "moon", T0 + MIN).length).toBeGreaterThan(0);
  });

  it("are refused with bad-readout for an unknown kind, a missing target, an uncatalogued body, and a body the scene does not hold", () => {
    const add = (readout: unknown) => () => new Scene().addBody(earth).addTrajectory({ ...probe, readouts: [readout as never] });
    expect(codeOf(add({ kind: "temperature" }))).toMatch(/^bad-readout: .*temperature/);
    expect(codeOf(add({ kind: "distance" }))).toMatch(/^bad-readout: .*`to`/);
    expect(codeOf(add({ kind: "altitude" }))).toMatch(/^bad-readout: .*`above`/);
    expect(codeOf(add({ kind: "distance", to: "vulcan" }))).toMatch(/^bad-readout: .*vulcan/);
    expect(codeOf(() => new Scene().addBody(earth).addTrajectory({ ...probe, readouts: "range" as never }))).toMatch(/^bad-readout: .*list/);
    expect(codeOf(() => definitionOf(add({ kind: "distance", to: "moon" })()))).toMatch(/^bad-readout: .*moon.*not been added/);
  });
});

describe("provenance by time span on a path (I-113)", () => {
  const observed: Provenance = { sourceType: "observed", sources: ["Made-up tracking"], accuracy: "Test", notes: "Test." };
  const modelled: Provenance = { sourceType: "reconstructed", sources: ["Made-up model"], accuracy: "Test", notes: "Test." };
  const spans = [
    { start: T0, end: T0 + MIN, provenance: observed },
    { start: T0 + MIN, end: T0 + 2 * MIN, provenance: modelled },
    { start: T0 + 2 * MIN, end: T0 + 3 * MIN, provenance: observed },
  ];
  const view = (at: number, input: object = { provenanceSpans: spans }) => infoView(definitionOf(new Scene().addBody(earth).addTrajectory({ ...probe, ...input })).experience, { kind: "object", id: "probe" }, at)!.provenance!;

  it("shows each stretch's own label as time moves", () => {
    expect(view(T0 + 0.5 * MIN).status).toBe(PROVENANCE_STATUS.observed);
    expect(view(T0 + 1.5 * MIN).status).toBe(PROVENANCE_STATUS.reconstructed);
    expect(view(T0 + 2.5 * MIN).sources).toEqual(["Made-up tracking"]);
  });

  it("falls back to the path's single provenance, else the illustrative default, in a gap", () => {
    const gap = [spans[0]!];
    expect(view(T0 + 2 * MIN, { provenanceSpans: gap, provenance: modelled }).sources).toEqual(["Made-up model"]);
    expect(view(T0 + 2 * MIN, { provenanceSpans: gap }).status).toBe(PROVENANCE_STATUS.illustrative);
  });

  it("is unchanged when no spans are given", () => {
    expect(view(T0 + MIN, { provenance: modelled }).sources).toEqual(["Made-up model"]);
  });

  it.each([
    ["overlapping spans", [spans[0]!, { ...spans[1]!, start: T0 + 0.5 * MIN }]],
    ["spans out of order", [spans[1]!, spans[0]!]],
    ["a span outside the path", [{ ...spans[0]!, end: T0 + 9 * MIN }]],
    ["a span that ends before it starts", [{ ...spans[0]!, end: T0 - MIN }]],
    ["a bad time", [{ ...spans[0]!, start: "later" }]],
    ["a bad provenance", [{ ...spans[0]!, provenance: { sourceType: "magic" } }]],
    ["spans that are not a list", { start: T0 }],
  ])("refuse %s with bad-trajectory naming the path", (_name, provenanceSpans) => {
    expect(codeOf(() => new Scene().addBody(earth).addTrajectory({ ...probe, provenanceSpans: provenanceSpans as never }))).toMatch(/^bad-trajectory: .*probe.*provenanceSpans/);
  });
});
