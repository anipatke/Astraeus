import { describe, expect, it } from "vitest";
import { groupsOf } from "../src/app/experienceDefinition";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { provenanceAt, rateAt } from "../src/core/timeWindow";
import {
  buildShowerDefinition,
  createActivityWindow,
  nodeTrueAnomalyDeg,
  showerEntryName,
  streamIdOf,
} from "../src/showers/showerDefinition";
import perseidsFile from "../data/showers/perseids.json";
import { parseShowerSettings, ShowerSettingsError } from "../src/showers/showerSettings";

const adapter = createOrbAstronomyAdapter();
const AU_KM = 149_597_870.7;
const DAY_MS = 86_400_000;

// A made-up shower: none of these values belong to any real shower.
const madeUp = {
  id: "test-drift",
  label: "Test drift",
  parentBody: "Made-up body",
  orbit: {
    plane: "ecliptic-j2000",
    elementsEpochUtc: "2030-01-01T00:00:00Z",
    elements: { semiMajorAxisAu: 3.2, eccentricity: 0.7, inclinationDeg: 25, raanDeg: 100, argumentOfPeriapsisDeg: 60 },
    source: { name: "Made up for the builder test", url: "https://example.invalid/made-up", accessed: "2030-01-01" },
  },
  stream: {
    encounterNode: "descending",
    memberCount: 300,
    seed: 11,
    spread: { semiMajorAxisAu: 0, eccentricity: 0.001, inclinationDeg: 1, raanDeg: 10, argumentOfPeriapsisDeg: 1, trueAnomalyDeg: 15 },
  },
  activity: {
    startUtc: "2030-03-01T00:00:00Z",
    endUtc: "2030-03-21T00:00:00Z",
    peakUtc: "2030-03-11T00:00:00Z",
    peakPublishedNight: "Mar 10-11, 2030",
    peakRate: 40,
    rateUnit: "things per hour",
    fallOffPerDay: 0.2,
    source: { name: "Made up for the builder test", url: "https://example.invalid/made-up", accessed: "2030-01-01" },
  },
  radiant: { raDeg: 120, decDeg: -20, source: { name: "Made up", url: "https://example.invalid/made-up", accessed: "2030-01-01" } },
};

const clone = (): Record<string, any> => structuredClone(madeUp);
const broken = (change: (s: Record<string, any>) => void) => () => {
  const s = clone();
  change(s);
  parseShowerSettings(s);
};

describe("shower settings contract", () => {
  it("accepts a complete made-up settings object", () => {
    expect(parseShowerSettings(madeUp).id).toBe("test-drift");
  });

  it.each([
    ["a missing source", (s: Record<string, any>) => { delete s.activity.source; }, /activity\.source/],
    ["a missing parent body", (s: Record<string, any>) => { delete s.parentBody; }, /parentBody/],
    ["a non-finite number", (s: Record<string, any>) => { s.orbit.elements.inclinationDeg = Number.NaN; }, /orbit\.elements\.inclinationDeg/],
    ["an unbound orbit", (s: Record<string, any>) => { s.orbit.elements.eccentricity = 1.2; }, /orbit\.elements\.eccentricity/],
    ["a window that ends before it starts", (s: Record<string, any>) => { s.activity.endUtc = "2030-02-01T00:00:00Z"; }, /activity\.endUtc/],
    ["a peak outside the window", (s: Record<string, any>) => { s.activity.peakUtc = "2030-04-01T00:00:00Z"; }, /activity\.peakUtc/],
    ["a time without a zone", (s: Record<string, any>) => { s.activity.startUtc = "2030-03-01"; }, /activity\.startUtc/],
    ["a negative spread", (s: Record<string, any>) => { s.stream.spread.raanDeg = -1; }, /stream\.spread\.raanDeg/],
    ["a bad seed", (s: Record<string, any>) => { s.stream.seed = 1.5; }, /stream\.seed/],
    ["a zero member count", (s: Record<string, any>) => { s.stream.memberCount = 0; }, /stream\.memberCount/],
    ["a radiant declination out of range", (s: Record<string, any>) => { s.radiant.decDeg = 95; }, /radiant\.decDeg/],
    ["an unknown node", (s: Record<string, any>) => { s.stream.encounterNode = "middle"; }, /stream\.encounterNode/],
    ["a zero peak rate", (s: Record<string, any>) => { s.activity.peakRate = 0; }, /activity\.peakRate/],
  ])("names the field for %s", (_what, change, field) => {
    expect(broken(change)).toThrow(ShowerSettingsError);
    expect(broken(change)).toThrow(field);
  });
});

describe("the shared shower builder with a made-up shower", () => {
  const settings = parseShowerSettings(madeUp);
  const definition = buildShowerDefinition(settings);
  const layer = groupsOf(definition)[0];

  it("builds an Earth-visible, Sun-centred experience with one stream item", () => {
    expect(definition.sceneLayers).toEqual(["earth-moon", "points"]);
    expect(layer.group.center).toBe("sun");
    expect(layer.group.count).toBe(300);
    expect(layer.object.id).toBe(streamIdOf(settings));
    expect(definition.experience.cameraPresets.map((p) => p.id)).toEqual(["overview", "focus-stream", "follow-stream"]);
    expect(definition.camera?.maxFocusDistance).toBeGreaterThan(100_000);
  });

  it("states the stream is modelled and keeps published facts apart from modelled ones", () => {
    expect(layer.group.provenance.sourceType).toBe("illustrative");
    expect(layer.object.knownLimitations?.join(" ")).toMatch(/modelled spread, two-body, not observed/i);
    const window = createActivityWindow(settings);
    const peak = Date.parse(settings.activity.peakUtc);
    expect(provenanceAt(window, peak)?.sourceType).toBe("observed");
    expect(provenanceAt(window, peak - 5 * DAY_MS)?.sourceType).toBe("illustrative");
    expect(provenanceAt(window, peak + 5 * DAY_MS)?.sourceType).toBe("illustrative");
  });

  it("uses the same samples for the rate readout and the window curve, peaking at the published rate", () => {
    const window = definition.experience.windows?.[0];
    expect(window).toBeDefined();
    const peak = Date.parse(settings.activity.peakUtc);
    expect(rateAt(window!, peak)).toBeCloseTo(40, 6);
    expect(rateAt(window!, peak + 2 * DAY_MS)).toBeCloseTo(40 * 10 ** -0.4, 6);
    const moon = new MoonTrajectory(adapter);
    const metrics = definition.createMetrics({ clock: new SimulationClock(peak), adapter, moon })(streamIdOf(settings), peak + 2 * DAY_MS);
    const rate = metrics.find((m) => m.kind === "rate");
    expect(rate?.kind === "rate" ? rate.value : null).toBeCloseTo(rateAt(window!, peak + 2 * DAY_MS) ?? Number.NaN, 9);
    expect(metrics.find((m) => m.kind === "coordinates")).toMatchObject({ system: "radec" });
  });

  it("puts the base true anomaly on the chosen node", () => {
    expect(nodeTrueAnomalyDeg(60, "descending")).toBeCloseTo(120, 9);
    expect(nodeTrueAnomalyDeg(60, "ascending")).toBeCloseTo(-60, 9);
    expect(nodeTrueAnomalyDeg(200, "descending")).toBeCloseTo(-20, 9);
  });

  it("names an entry file by its file name", () => {
    expect(showerEntryName("../data/showers/perseids.json")).toBe("perseids");
    expect(showerEntryName("other.json")).toBe("other");
  });
});

describe("Perseids from its settings file", () => {
  const settings = parseShowerSettings(perseidsFile);
  const definition = buildShowerDefinition(settings);
  const { group } = groupsOf(definition)[0];
  const start = Date.parse(settings.activity.startUtc);
  const peak = Date.parse(settings.activity.peakUtc);
  const end = Date.parse(settings.activity.endUtc);

  it("cites every published fact and marks the stream modelled", () => {
    for (const source of [settings.orbit.source, settings.activity.source, settings.radiant.source]) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(group.provenance.sourceType).toBe("illustrative");
    expect(group.provenance.notes).toMatch(/modelled spread, two-body, not observed/i);
    expect(group.count).toBeGreaterThanOrEqual(10_000);
  });

  it("keeps Earth inside or beside the stream through the whole activity window", () => {
    const out = new Float64Array(3 * group.count);
    for (const t of [start, peak, end]) {
      group.fillPositionsKm(t, out);
      const earth = adapter.earthPositionFromSunKm(t);
      let nearest = Number.POSITIVE_INFINITY;
      for (let i = 0; i < group.count; i += 1) {
        nearest = Math.min(nearest, Math.hypot(out[3 * i] - earth[0], out[3 * i + 1] - earth[1], out[3 * i + 2] - earth[2]));
      }
      expect(nearest / AU_KM).toBeLessThan(0.05);
    }
  });

  it("shows the published peak and a radiant readout in the info panel's data", () => {
    const window = definition.experience.windows![0];
    expect(rateAt(window, peak)).toBe(settings.activity.peakRate);
    expect(rateAt(window, start)).toBeLessThan(1);
    const moon = new MoonTrajectory(adapter);
    const metrics = definition.createMetrics({ clock: new SimulationClock(start), adapter, moon })(streamIdOf(settings), peak);
    const radiant = metrics.find((m) => m.kind === "coordinates");
    expect(radiant?.kind === "coordinates" ? radiant.components?.map((c) => c.value) : null).toEqual([settings.radiant.raDeg, settings.radiant.decDeg]);
    expect(radiant?.context).toMatch(/Published/);
  });

  it("leaves Moon readings off the stream and on Earth only", () => {
    const moon = new MoonTrajectory(adapter);
    const metrics = definition.createMetrics({ clock: new SimulationClock(start), adapter, moon });
    expect(metrics("earth", peak).some((m) => /moon/i.test(m.label))).toBe(true);
    expect(metrics(streamIdOf(settings), peak).some((m) => /moon/i.test(m.label))).toBe(false);
  });
});
