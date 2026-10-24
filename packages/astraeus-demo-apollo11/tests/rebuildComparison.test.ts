// The rebuilt Apollo 11 (O-041 T-169) against the definition it replaced. tests/fixtures/apollo11-before-rebuild.json was captured from the hand-written definition
// immediately before the rebuild. Everything that should be the same is compared whole; each difference is named here with the O-041 Decision that allows it.
import { describe, expect, it } from "vitest";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { apollo11Definition as after } from "../src/experiences/apollo11/apollo11Definition";
import before from "./fixtures/apollo11-before-rebuild.json";

const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const objectsAfter = plain(after.experience.objects) as unknown as Record<string, unknown>[];
const byId = (list: readonly Record<string, unknown>[], id: string) => list.find((item) => item.id === id)!;

describe("the rebuilt Apollo 11 against the definition it replaced", () => {
  it("has the same objects, in the same order, with the same ids, labels, colours, availability and provenance", () => {
    expect(objectsAfter.map((o) => o.id)).toEqual(before.objects.map((o) => o.id));
    for (const old of before.objects) {
      const now = byId(objectsAfter, old.id);
      for (const field of ["label", "color", "availability", "provenance", "knownLimitations"].filter((f) => f !== "knownLimitations" || old.id === "earth")) expect(now[field], `${old.id}.${field}`).toEqual((old as Record<string, unknown>)[field]);
      expect(now.labelMaxDistance, `${old.id}.labelMaxDistance`).toBe(old.labelMaxDistance);
    }
  });

  it("keeps Earth's and the Columbia/Eagle label priority; the Moon's is one lower (generic ranking by order added)", () => {
    expect(objectsAfter.map((o) => o.labelPriority)).toEqual([100, 99, 80, 80]);
    expect(before.objects.map((o) => o.labelPriority)).toEqual([100, 90, 80, 80]);
  });

  it("keeps Earth's and the Moon's known limits, and the descriptions (addBody takes colour and limits, Decision 11)", () => {
    // I-091: the Moon's orientation line changed from "tidal lock, no libration" to the IAU model with libration; the speed line is unchanged.
    const moonNow = byId(objectsAfter, "moon").knownLimitations as string[];
    expect(moonNow[0]).toContain("libration terms");
    expect(moonNow.slice(1)).toEqual((before.objects[1]!.knownLimitations as string[]).slice(1));
    expect(byId(objectsAfter, "earth").description).toBe(before.objects[0]!.description);
    expect(byId(objectsAfter, "earth").knownLimitations).toEqual(before.objects[0]!.knownLimitations);
    expect(byId(objectsAfter, "moon").description).toBe(before.objects[1]!.description);
  });

  it("keeps every spacecraft known limit word for word; the path-uncertainty limit is added (Decision 9)", () => {
    for (const id of ["columbia", "eagle"]) {
      const old = before.objects.find((o) => o.id === id)!.knownLimitations as string[];
      const now = byId(objectsAfter, id).knownLimitations as string[];
      // I-091: Eagle's landing-site line used to say the drawn Moon has no libration; it is regenerated from the data and now says it follows the IAU model.
      const sameWording = (lines: string[]) => lines.map((line) => (line.startsWith("Landing site:") ? "Landing site:" : line));
      expect(sameWording(now.slice(0, old.length))).toEqual(sameWording(old));
      expect(now).toHaveLength(old.length + 1);
      expect(now[old.length]).toMatch(/^Path uncertainty: the drawn position can sit away from the position NASA's anchors imply on a coast by up to [\d,]+ km/);
      expect(now[old.length]).toMatch(/not shown as a live figure/);
    }
  });

  it("starts each spacecraft description with the old sentences and carries the mission notes after them (Decision 2: notes move into the descriptions)", () => {
    for (const id of ["columbia", "eagle"]) {
      const old = before.objects.find((o) => o.id === id)!.description as string;
      const now = byId(objectsAfter, id).description as string;
      expect(now.startsWith(old)).toBe(true);
      expect(now).toContain("round dots are NASA source anchors");
      expect(now).toContain("not to scale");
    }
    expect(byId(objectsAfter, "columbia").description).toContain("Launch and splashdown are events only");
  });

  it("writes the drawing note as plain sentences with no code left in the text (I-082)", () => {
    for (const id of ["columbia", "eagle"]) {
      const now = byId(objectsAfter, id).description as string;
      expect(now).not.toMatch(/"|\+|\n/);
      expect(now).toContain("round dots are NASA source anchors. The marker is drawn larger than the vehicle so you can see it, and is not to scale.");
    }
  });

  it("has the same events, event provenance, window, rates, opening clock, story panels, scale choice, opening view and layers", () => {
    expect(plain(after.experience.events)).toEqual(before.events);
    expect(plain(after.experience.eventProvenance)).toEqual(before.eventProvenance);
    expect(plain(after.experience.window)).toEqual(before.window);
    expect(plain(after.experience.rates)).toEqual(before.rates);
    expect(plain(after.clock)).toEqual(before.clock);
    expect(plain(after.experience.storyPanels)).toEqual(before.storyPanels);
    expect(plain(after.scaleChoices)).toEqual(before.scaleChoices);
    expect(after.scaleChoices).toEqual(["true-scale"]);
    expect(plain(after.startView)).toEqual(before.startView);
    expect(plain(after.sceneLayers)).toEqual(before.sceneLayers);
    expect(after.experience.hideTimeline).toBeUndefined();
  });

  it("draws the same Earth–Moon composition with the Moon's monthly orbit (only its internal id differs)", () => {
    const { id: _id, ...rest } = plain(after.composition) as unknown as Record<string, unknown>;
    const { id: _old, ...oldRest } = before.composition as unknown as Record<string, unknown>;
    expect(rest).toEqual(oldRest);
  });

  it("has the same tracked paths: ids, labels, colours, bounds, sample times, anchors and provenance", () => {
    const now = (after.trackedBodies ?? []).map((b) => ({
      id: b.id, label: b.label, color: b.color, bounds: b.trajectory.bounds, pathCount: b.pathTimesUtcMs.length,
      pathTimeSum: b.pathTimesUtcMs.reduce((sum, t) => sum + t, 0), anchorTimesUtcMs: b.anchorTimesUtcMs, anchorLabels: b.anchorLabels, provenance: b.provenance,
    }));
    expect(plain(now)).toEqual(before.trackedBodies);
  });

  it("camera menu: Overview plus Focus and Follow for every object (Decision 3); the old Focus items keep their ids and targets", () => {
    const presets = plain(after.experience.cameraPresets);
    expect(presets.map((p) => p.label)).toEqual(["Overview", "Focus Earth", "Follow Earth", "Focus Moon", "Follow Moon", "Focus Columbia (CSM)", "Follow Columbia (CSM)", "Focus Eagle (LM)", "Follow Eagle (LM)"]);
    for (const old of before.cameraPresets.filter((p) => p.id !== "overview")) {
      expect(presets.find((p) => p.id === old.id), old.id).toEqual(old);
    }
    expect(before.cameraPresets.find((p) => p.id === "overview")!.label).toBe("Earth–Moon overview");
    expect(presets[0]).toEqual({ id: "overview", label: "Overview", request: { kind: "overview" } });
  });

  it("opens looking at Earth (the Focus Earth item pressed) without following; before it named no menu item", () => {
    expect(before.startCameraPresetId).toBeNull();
    expect(after.experience.startCameraPresetId).toBe("focus-earth");
  });

  it("drops the Developer drawer's \"This demo\" sections (Decision 2)", () => {
    expect(before.developerSections).toEqual(["clock", "telemetry", "mission"]);
    expect(after.developerSections).toBeUndefined();
  });

  it("gives Earth and the Moon the same distance row; each spacecraft keeps range, speed and distance to the Moon with equal values and gains the two named altitudes (Decisions 2 and 9)", () => {
    const resolver = createSceneResolver(createOrbAstronomyAdapter());
    const metrics = after.createMetrics!({ resolver, clock: undefined as never, catalogue: undefined as never });
    const rows = (id: string, time: number) => plain(metrics(id, time)) as unknown as { kind: string; id: string; label: string; value?: number | null; unit?: string }[];
    for (const [index, time] of before.times.entries()) {
      expect(rows("earth", time).map((r) => ({ kind: r.kind, id: r.id, label: r.label, value: r.value, unit: r.unit }))).toEqual(before.metricRows.earth[index]!.map((r) => ({ ...r })));
      expect(rows("moon", time).map((r) => r.id)).toEqual(before.metricRows.moon[index]!.map((r) => r.id));
      for (const id of ["columbia", "eagle"] as const) {
        const old = before.metricRows[id][index]!;
        const now = rows(id, time);
        if (old.length === 0) { expect(now, `${id} at ${time}`).toEqual([]); continue; }
        // The old info card held range, speed and distance to the Moon; the altitude bars lived in the Developer drawer's telemetry cards and now join the card.
        expect(now.map((r) => r.id)).toEqual([`${id}-range`, `${id}-speed`, `${id}-to-moon`, `${id}-altitude-earth`, `${id}-altitude-moon`]);
        for (const was of old) {
          const is = now.find((r) => r.id === was.id)!;
          expect(is.kind, was.id).toBe(was.kind);
          expect(is.label, was.id).toBe(was.label);
          expect(is.value, `${was.id} at ${time}`).toBeCloseTo(was.value as number, 6);
        }
        expect(now.filter((r) => r.kind === "altitude").map((r) => r.label)).toEqual(["Altitude above Earth", "Altitude above Moon"]);
      }
    }
    expect(before.metricRows.columbia.some((r) => r.length > 0)).toBe(true);
  });
});
