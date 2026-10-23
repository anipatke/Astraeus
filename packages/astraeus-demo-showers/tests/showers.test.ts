import { describe, expect, it } from "vitest";
import { experienceWithGroups, groupsOf, mountedBodiesOf } from "../../astraeus/src/app/experienceDefinition";
import { createOrbAstronomyAdapter } from "../../astraeus/src/core/astronomyAdapter";
import { SimulationClock } from "../../astraeus/src/core/clock";
import { hiddenLabelsFrom, loopFromSearch } from "../../astraeus/src/app/App";
import { catalogue } from "../../astraeus/src/assets/catalogue";
import { createSceneResolver } from "../../astraeus/src/app/sceneLayout";
import { provenanceAt, rateAt } from "../../astraeus/src/core/timeWindow";
import { SWIFT_TUTTLE_SAMPLING } from "../../astraeus/src/core/bodies";
import {
  absentStreamObject,
  buildShowerDefinition,
  loadShowerPanelsFile,
  createActivityWindow,
  parentOrbitIdOf,
  parentSamplingOf,
  showerComposition,
  showerEntryName,
  streamIdOf,
  orbitSetSentence,
  streamLimitations,
  timelineBoundsOf,
} from "../src/experiences/showers/showerDefinition";
import { orbitSetCounts, parseMeasuredOrbits, selectOrbits, type MeasuredLoad } from "../src/experiences/showers/measuredOrbits";
import { shippedPanelsOf } from "./helpers/shippedPanels";
import perseidsFile from "../data/showers/perseids.json";
import geminidsFile from "../data/showers/geminids.json";
import { buildElementsBody } from "../../astraeus/src/core/elementsBody";
import { citedSourceOf, parseShowerSettings, ShowerSettingsError } from "../src/experiences/showers/showerSettings";
import { madeUpOrbits } from "./helpers/measuredOrbits";

const adapter = createOrbAstronomyAdapter();
const runtimeAt = (timeUtcMs: number) => ({ clock: new SimulationClock(timeUtcMs), resolver: createSceneResolver(adapter), catalogue });
const DAY_MS = 86_400_000;
const CENTRE = { id: "sun", gmKm3S2: catalogue.get("sun").definition.gmKm3S2! };

// A made-up shower: none of these values belong to any real shower. Its parent is a catalogued body only because the settings must name one.
const madeUp = {
  id: "test-drift",
  label: "Test drift",
  parentBody: "Mars (stand-in parent)",
  parentBodyId: "mars",
  orbit: {
    elements: { semiMajorAxisAu: 1.523679, eccentricity: 0.0934 },
    source: { name: "Made up for the builder test", url: "https://example.invalid/made-up", accessed: "2030-01-01" },
  },
  stream: {
    iauCode: 999,
    sources: { gmn: { source: { name: "Made up for the builder test", url: "https://example.invalid/made-up", accessed: "2030-01-01" }, months: ["203001"], licence: "CC BY 4.0", licenceUrl: "https://example.invalid/licence", ruleNote: "Made-up mapping for the builder test." } },
    seed: 11,
    quality: {
      default: "all",
      rule: { minConvergenceAngleDeg: 15, maxVelocityErrorFraction: 0.1, quote: "Made-up rule for the builder test", source: { name: "Made up", url: "https://example.invalid/made-up", accessed: "2030-01-01" } },
    },
    concentration: { fraction: 0.25, widthDeg: 30, status: "illustrative", basis: "Made-up default for the builder test." },
  },
  look: {
    streamColor: "#88ccff",
    pointSizePx: 3,
    refillAfterHours: 12,
    earthPathColor: "#7ab8ff",
    parentPathColor: "#c79bff",
    planetExaggeration: 250,
    cameraMaxFocusDistance: 3_000_000,
    cameraFar: 9_000_000,
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
  radiant: { raDeg: 120, decDeg: -20, equinox: "J2000", peakSolarLongitudeDeg: 350, source: { name: "Made up", url: "https://example.invalid/made-up", accessed: "2030-01-01" } },
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

  it("accepts the Perseids file and reads the look from it", () => {
    const settings = parseShowerSettings(perseidsFile);
    expect(settings.stream.iauCode).toBe(7);
    expect(settings.parentBodyId).toBe("swift-tuttle");
    expect(settings.look.planetExaggeration).toBe(400);
  });

  it.each([
    ["a missing source", (s: Record<string, any>) => { delete s.activity.source; }, /activity\.source/],
    ["a missing parent body", (s: Record<string, any>) => { delete s.parentBody; }, /parentBody/],
    ["a missing parent id", (s: Record<string, any>) => { delete s.parentBodyId; }, /parentBodyId/],
    ["an unbound parent orbit", (s: Record<string, any>) => { s.orbit.elements.eccentricity = 1.2; }, /orbit\.elements\.eccentricity/],
    ["a window that ends before it starts", (s: Record<string, any>) => { s.activity.endUtc = "2030-02-01T00:00:00Z"; }, /activity\.endUtc/],
    ["a peak outside the window", (s: Record<string, any>) => { s.activity.peakUtc = "2030-04-01T00:00:00Z"; }, /activity\.peakUtc/],
    ["a time without a zone", (s: Record<string, any>) => { s.activity.startUtc = "2030-03-01"; }, /activity\.startUtc/],
    ["a bad seed", (s: Record<string, any>) => { s.stream.seed = 1.5; }, /stream\.seed/],
    ["a missing IAU code", (s: Record<string, any>) => { delete s.stream.iauCode; }, /stream\.iauCode/],
    ["a fractional IAU code", (s: Record<string, any>) => { s.stream.iauCode = 7.5; }, /stream\.iauCode/],
    ["a missing GMN entry", (s: Record<string, any>) => { delete s.stream.sources.gmn; }, /stream\.sources\.gmn/],
    ["a CAMS entry (removed in O-017)", (s: Record<string, any>) => { s.stream.sources.cams = structuredClone(s.stream.sources.gmn.source); }, /stream\.sources\.cams is no longer supported/],
    ["a source choice (removed in O-017)", (s: Record<string, any>) => { s.stream.source = "cams"; }, /stream\.source is no longer a setting/],
    ["GMN months that are not YYYYMM", (s: Record<string, any>) => { s.stream.sources.gmn.months = ["2025-08"]; }, /stream\.sources\.gmn\.months/],
    ["a clump share above one", (s: Record<string, any>) => { s.stream.concentration.fraction = 1.5; }, /stream\.concentration\.fraction/],
    ["a clump of no width", (s: Record<string, any>) => { s.stream.concentration.widthDeg = 0; }, /stream\.concentration\.widthDeg/],
    ["a clump with no status", (s: Record<string, any>) => { s.stream.concentration.status = "guessed"; }, /stream\.concentration\.status/],
    ["a cited clump without its citation", (s: Record<string, any>) => { s.stream.concentration.status = "cited"; }, /stream\.concentration\.source/],
    ["a clump without its basis", (s: Record<string, any>) => { delete s.stream.concentration.basis; }, /stream\.concentration\.basis/],
    ["a radiant declination out of range", (s: Record<string, any>) => { s.radiant.decDeg = 95; }, /radiant\.decDeg/],
    ["a missing peak solar longitude", (s: Record<string, any>) => { delete s.radiant.peakSolarLongitudeDeg; }, /radiant\.peakSolarLongitudeDeg/],
    ["a zero peak rate", (s: Record<string, any>) => { s.activity.peakRate = 0; }, /activity\.peakRate/],
    ["a stream colour that is not a colour", (s: Record<string, any>) => { s.look.streamColor = "amber"; }, /look\.streamColor/],
    ["a zero dot size", (s: Record<string, any>) => { s.look.pointSizePx = 0; }, /look\.pointSizePx/],
    ["a camera far plane inside the reach", (s: Record<string, any>) => { s.look.cameraFar = 100; }, /look\.cameraFar/],
    ["planets smaller than life", (s: Record<string, any>) => { s.look.planetExaggeration = 0.5; }, /look\.planetExaggeration/],
    ["the retired stream spread", (s: Record<string, any>) => { s.stream = undefined; }, /stream/],
  ])("names the field for %s", (_what, change, field) => {
    expect(broken(change)).toThrow(ShowerSettingsError);
    expect(broken(change)).toThrow(field);
  });

  it("carries no stand-in spread or invented member count in the Perseids file", () => {
    const stream = (perseidsFile as Record<string, any>).stream;
    expect(stream.spread).toBeUndefined();
    expect(stream.memberCount).toBeUndefined();
    expect(JSON.stringify(perseidsFile)).not.toMatch(/spread/i);
  });
});

describe("measured orbit files", () => {
  const good = () => structuredClone({
    provenance: { database: "d", citation: "c", source: "s", fetchedAt: "t", iauCode: 5, columns: ["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"] },
    rows: [["1", 6, 1_000_000_000_000, 3, 0.7, 20, 30, 40, 50, 40, 59, 0.4, 0]],
  });

  it("accepts a file for the named shower and converts the semi-major axis to km", () => {
    const orbits = parseMeasuredOrbits(good(), 5);
    expect(orbits.members[0].recordId).toBe("1");
    expect(orbits.members[0].elements.semiMajorAxisKm).toBeCloseTo(3 * 149_597_870.7, 3);
  });

  it.each([
    ["another shower's file", (f: any) => { f.provenance.iauCode = 4; }, /IAU shower 4, not 5/],
    ["other columns", (f: any) => { f.provenance.columns.reverse(); }, /columns/],
    ["no rows", (f: any) => { f.rows = []; }, /no rows/],
    ["a row of the wrong length", (f: any) => { f.rows[0].pop(); }, /row 0 must have 13 values/],
    ["a non-finite value", (f: any) => { f.rows[0][4] = null; }, /not a finite number/],
    ["an empty record id", (f: any) => { f.rows[0][0] = ""; }, /no record id/],
  ])("rejects %s", (_what, change, message) => {
    const file = good();
    change(file);
    expect(() => parseMeasuredOrbits(file, 5)).toThrow(message);
  });
});

describe("the shared shower builder with a made-up shower", () => {
  const settings = parseShowerSettings(madeUp);
  const loaded: MeasuredLoad = { kind: "loaded", orbits: madeUpOrbits(999, 300) };
  const definition = buildShowerDefinition(settings, loaded);
  const layer = groupsOf(definition)[0];

  it("builds a Sun-centred experience of the Sun, Earth, the planets and the parent, with one stream item", () => {
    expect(definition.sceneLayers).toEqual(["points", "sun-centred"]);
    expect(definition.composition).toEqual(showerComposition(settings));
    // The Sun, the planets and this shower's own parent (here Mars, a planet); no other shower's parent.
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter"]);
    expect(definition.sceneCenter).toBe("sun");
    expect(layer.group.center).toBe("sun");
    expect(layer.group.count).toBe(300);
    expect(layer.object.id).toBe(streamIdOf(settings));
    expect(definition.experience.cameraPresets.map((p) => p.id)).toEqual(["overview", "focus-earth", "follow-earth", "focus-parent", "whole-orbit", "focus-stream", "follow-stream"]);
    expect(definition.camera).toEqual({ maxFocusDistance: 3_000_000, far: 9_000_000 });
  });

  it("takes the look from the settings, not from code", () => {
    expect(layer.color).toBe("#88ccff");
    expect(layer.pointSizePx).toBe(3);
    expect(layer.refillAfterMs).toBe(12 * 3_600_000);
    // The parent (here Mars, a stand-in) is not enlarged: it is the comet-like body the settings name.
    expect(Object.keys(definition.visualOverrides ?? {}).sort()).toEqual(["earth", "jupiter", "mercury", "venus"]);
    expect(Object.values(definition.visualOverrides ?? {}).every((override) => override.exaggeration === 250)).toBe(true);
    const earth = experienceWithGroups(definition).objects.find((o) => o.id === "earth");
    expect(earth?.knownLimitations?.join(" ")).toMatch(/250 times larger than life/);
    expect(definition.paths?.find((p) => p.object.id === "earth-path")?.color).toBe("#7ab8ff");
  });

  it("draws the parent's whole orbit deliberately by eccentric anomaly and not through the planet loop", () => {
    const parentPath = definition.paths!.find((path) => path.object.id === parentOrbitIdOf(settings))!;
    expect(parentPath.sampling).toBeDefined();
    expect(parentPath.sampling!.eccentricity).toBeCloseTo(0.0934, 6);
    const span = parentPath.span as { startUtcMs: number; endUtcMs: number };
    expect(span.endUtcMs - span.startUtcMs).toBeCloseTo(parentPath.sampling!.periodMs, -1);
    const orbitIds = definition.paths!.map((p) => p.object.id).filter((id) => id.endsWith("-orbit"));
    expect(orbitIds.sort()).toEqual(["jupiter-orbit", "mars-orbit", "mercury-orbit", "venus-orbit"]);
    expect(orbitIds.filter((id) => id === "mars-orbit")).toHaveLength(1);
  });

  it("states what is measured, what is a drawing choice and what is not shown", () => {
    expect(layer.group.provenance.sourceType).toBe("illustrative");
    const text = streamLimitations(settings).join(" ");
    expect(text).toMatch(/position of each dot along its orbit is illustrative/i);
    expect(text).toContain(`clump near ${settings.parentBody} is a model`);
    expect(text).toMatch(/25% of the dots are placed within ±30°/);
    expect(text).toMatch(/\(illustrative defaults: Made-up default for the builder test\.\)/);
    expect(text).toContain(`band at ${settings.parentBody}'s phase, not a blob on ${settings.parentBody}`);
    expect(text).toMatch(/Parts of the stream that miss Earth are not shown/);
    expect(layer.object.knownLimitations).toEqual(streamLimitations(settings, { set: "all", counts: orbitSetCounts(loaded.orbits, settings.stream.quality.rule), provenance: loaded.orbits.provenance }));
    const window = createActivityWindow(settings);
    const peak = Date.parse(settings.activity.peakUtc);
    expect(provenanceAt(window, peak)?.sourceType).toBe("observed");
    expect(provenanceAt(window, peak - 5 * DAY_MS)?.sourceType).toBe("illustrative");
    expect(provenanceAt(window, peak + 5 * DAY_MS)?.sourceType).toBe("illustrative");
  });

  it("cites a cited clump with its source", () => {
    const cited = clone();
    cited.stream.concentration = { fraction: 0.4, widthDeg: 15, status: "cited", basis: "Made-up paper, table 2", source: { name: "Made-up paper", url: "https://example.invalid/paper", accessed: "2030-01-01" } };
    expect(streamLimitations(parseShowerSettings(cited)).join(" ")).toMatch(/cited; basis: Made-up paper, table 2/);
  });

  it("uses the same samples for the rate readout and the window curve, peaking at the published rate", () => {
    const window = definition.experience.windows?.[0];
    expect(window).toBeDefined();
    const peak = Date.parse(settings.activity.peakUtc);
    expect(rateAt(window!, peak)).toBeCloseTo(40, 6);
    expect(rateAt(window!, peak + 2 * DAY_MS)).toBeCloseTo(40 * 10 ** -0.4, 6);
    const metrics = definition.createMetrics(runtimeAt(peak))(streamIdOf(settings), peak + 2 * DAY_MS);
    const rate = metrics.find((m) => m.kind === "rate");
    expect(rate?.kind === "rate" ? rate.value : null).toBeCloseTo(rateAt(window!, peak + 2 * DAY_MS) ?? Number.NaN, 9);
    expect(metrics.find((m) => m.kind === "coordinates")).toMatchObject({ system: "radec", frame: "J2000" });
  });

  it("names an entry file by its file name", () => {
    expect(showerEntryName("../data/showers/perseids.json")).toBe("perseids");
    expect(showerEntryName("other.json")).toBe("other");
  });

  it("refuses a parent that does not circle the Sun", () => {
    const moonParent = clone();
    moonParent.parentBodyId = "moon";
    expect(() => buildShowerDefinition(parseShowerSettings(moonParent), loaded)).toThrow(/not a catalogued body that circles the Sun/);
  });
});

describe("the orbit source", () => {
  const perseids = parseShowerSettings(perseidsFile);
  const geminids = parseShowerSettings(geminidsFile);

  it("is the GMN for both showers, named with its months and licence in the settings, and offers no source switch", () => {
    expect(geminids.stream.sources.gmn).toMatchObject({ months: ["202412", "202512"], licence: "CC BY 4.0" });
    expect(perseids.stream.sources.gmn).toMatchObject({ months: ["202507", "202508"], licence: "CC BY 4.0" });
    expect(citedSourceOf(perseids).name).toContain("Global Meteor Network");
    expect(buildShowerDefinition(perseids, { kind: "absent" }, "all").alternates).toBeUndefined();
    expect(buildShowerDefinition(parseShowerSettings(madeUp), { kind: "absent" }).alternates).toBeUndefined();
  });

  it("refuses a settings file that still names CAMS, with a named error", () => {
    for (const change of [(s: Record<string, any>) => { s.stream.source = "cams"; }, (s: Record<string, any>) => { s.stream.sources.cams = structuredClone(s.stream.sources.gmn.source); }]) {
      const old = structuredClone(perseidsFile) as Record<string, any>;
      change(old);
      expect(() => parseShowerSettings(old)).toThrow(ShowerSettingsError);
      expect(() => parseShowerSettings(old)).toThrow(/stream\.source(s\.cams| is no longer a setting)/);
    }
  });

  it("says how to fetch the GMN months when they are not on this machine", () => {
    const definition = buildShowerDefinition(perseids, { kind: "absent" }, "all");
    const item = experienceWithGroups(definition).objects.find((o) => o.id === streamIdOf(perseids));
    expect(item?.description).toContain("node tools/data/fetch-meteoroid-orbits.mjs 7 --months 202507,202508");
    expect(item?.description).not.toContain("--source");
    expect(item?.provenance?.sources.join(" ")).toContain("Global Meteor Network");
  });
});

describe("what a production build offers (I-030)", () => {
  const geminids = parseShowerSettings(geminidsFile);

  it("says in plain words that a production build has no orbits, without a fetch command", () => {
    for (const load of [{ kind: "absent" }, { kind: "invalid", problem: "wrong shower" }] as const) {
      const text = absentStreamObject(geminids, load, true).description;
      expect(text).toContain("The Geminids stream is drawn from measured meteoroid orbits.");
      expect(text).toMatch(load.kind === "absent" ? /This build does not include measured orbits for the Geminids, so no stream is drawn/ : /cannot be used \(wrong shower\), so no stream is drawn/);
      expect(text).not.toMatch(/fetch-meteoroid-orbits|Run "/);
    }
    expect(absentStreamObject(geminids, { kind: "absent" }, false).description).toMatch(/not fetched on this machine.*fetch-meteoroid-orbits\.mjs 4 --months 202412,202512/s);
  });
});

describe("a shower whose measured orbits are not on this machine", () => {
  const settings = parseShowerSettings(madeUp);
  it.each([
    ["absent", { kind: "absent" } as MeasuredLoad, /not fetched on this machine.*node tools\/data\/fetch-meteoroid-orbits\.mjs 999/s],
    ["invalid", { kind: "invalid", problem: "measured orbit file holds no rows" } as MeasuredLoad, /cannot be used: measured orbit file holds no rows/],
  ])("%s: says so, draws no stream and invents none", (_name, load, message) => {
    const definition = buildShowerDefinition(settings, load);
    expect(groupsOf(definition)).toEqual([]);
    const item = experienceWithGroups(definition).objects.find((o) => o.id === streamIdOf(settings));
    expect(item?.description).toMatch(message);
    expect(item?.provenance?.notes).toMatch(message);
    const ids = definition.experience.cameraPresets.map((p) => p.id);
    expect(ids).not.toContain("focus-stream");
    expect(ids).toContain("whole-orbit");
  });
});

describe("the parent's sampling is found from the catalogue body", () => {
  it("matches the comet's own sampling to within a minute when given the comet's published size and shape", () => {
    const settings = parseShowerSettings(perseidsFile);
    const found = parentSamplingOf(settings, Date.parse(settings.activity.peakUtc));
    expect(found.eccentricity).toBeCloseTo(SWIFT_TUTTLE_SAMPLING.eccentricity, 12);
    expect(Math.abs(found.periodMs - SWIFT_TUTTLE_SAMPLING.periodMs)).toBeLessThan(60_000);
    // Periapsis may be any past or future one: compare modulo the period.
    const gap = ((found.periapsisUtcMs - SWIFT_TUTTLE_SAMPLING.periapsisUtcMs) % found.periodMs + found.periodMs) % found.periodMs;
    expect(Math.min(gap, found.periodMs - gap)).toBeLessThan(2 * 60_000);
  });
});

describe("looping playback", () => {
  const settings = parseShowerSettings(madeUp);
  const definition = buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(999, 100) });
  const { startUtcMs, endUtcMs } = definition.experience.window;
  const clockAt = (timeUtcMs: number, rate: number, now: { ms: number }) => {
    const clock = new SimulationClock(timeUtcMs, () => now.ms);
    clock.setRate(rate);
    clock.play();
    return clock;
  };

  it("keeps the camera's up at celestial north unless the settings ask for the ecliptic", () => {
    expect(buildShowerDefinition(parseShowerSettings(madeUp), { kind: "absent" }).viewUp).toBe("equatorial");
    const up = clone();
    up.look.viewUp = "ecliptic";
    expect(buildShowerDefinition(parseShowerSettings(up), { kind: "absent" }).viewUp).toBe("ecliptic");
    expect(broken((s) => { s.look.viewUp = "sideways"; })).toThrow(/look\.viewUp/);
    expect(parseShowerSettings(perseidsFile).look.viewUp).toBe("ecliptic");
  });

  it("is off for an experience that does not ask, and on when the shower settings turn it on", () => {
    expect(buildShowerDefinition(parseShowerSettings(madeUp), { kind: "absent" }).loop).toBe(false);
    const on = clone();
    on.look.loop = true;
    expect(buildShowerDefinition(parseShowerSettings(on), { kind: "absent" }).loop).toBe(true);
    expect(broken((s) => { s.look.loop = "yes"; })).toThrow(/look\.loop/);
    expect(loopFromSearch("?loop=on", false)).toBe(true);
    expect(loopFromSearch("?loop=off", true)).toBe(false);
    expect(loopFromSearch("", true)).toBe(true);
  });

  it("wraps past the end to the same phase inside the window, and stops mattering when paused", () => {
    const now = { ms: 0 };
    const clock = clockAt(endUtcMs - 1000, 1, now);
    expect(clock.wrapWithin({ startUtcMs, endUtcMs })).toBe(false);
    now.ms = 5000;
    expect(clock.wrapWithin({ startUtcMs, endUtcMs })).toBe(true);
    expect(clock.now()).toBe(startUtcMs + 4000);
    now.ms += 10;
    expect(clock.now()).toBeGreaterThanOrEqual(startUtcMs);
    expect(clock.now()).toBeLessThanOrEqual(endUtcMs);
    clock.pause();
    clock.seek(endUtcMs + 99_000);
    expect(clock.wrapWithin({ startUtcMs, endUtcMs })).toBe(false);
    expect(clock.now()).toBe(endUtcMs + 99_000);
  });

  it("wraps backwards at a negative rate, and without wrapping the clock runs on past the end", () => {
    const now = { ms: 0 };
    const back = clockAt(startUtcMs + 1000, -1, now);
    now.ms = 3000;
    expect(back.wrapWithin({ startUtcMs, endUtcMs })).toBe(true);
    expect(back.now()).toBe(endUtcMs - 2000);
    const plain = clockAt(endUtcMs - 1000, 1, { ms: 0 });
    const later = { ms: 5000 };
    const free = clockAt(endUtcMs - 1000, 1, later);
    expect(plain.now()).toBe(endUtcMs - 1000);
    expect(free.now()).toBe(endUtcMs - 1000);
    later.ms = 9000;
    expect(free.now()).toBe(endUtcMs + 3000);
  });

  it("draws the stream at the first and last instants of the window, and nothing past the end (the cause of the disappearing stream)", () => {
    const group = groupsOf(definition)[0].group;
    const out = new Float64Array(3 * group.count);
    for (const t of [startUtcMs, endUtcMs]) {
      group.fillPositionsKm(t, out);
      expect(out.every(Number.isFinite)).toBe(true);
    }
    expect(group.bounds).toEqual({ startUtcMs, endUtcMs });
    expect(() => group.fillPositionsKm(endUtcMs + 1, out)).toThrow();
  });
});

describe("the orbit sets", () => {
  const settings = parseShowerSettings(madeUp);
  const orbits = madeUpOrbits(999, 200);
  const rule = settings.stream.quality.rule;
  // madeUpOrbits: Q is 8 for every 4th member (cut); the velocity error is 9 km/s, over 10% of 59, for every 5th (cut).
  const expectedCut = Array.from({ length: 200 }, (_, k) => k).filter((k) => k % 4 === 0 || k % 5 === 0).length;

  it("counts both sets and selects the reliable one in file order", () => {
    const counts = orbitSetCounts(orbits, rule);
    expect(counts).toEqual({ all: 200, cut: expectedCut, reliable: 200 - expectedCut });
    const reliable = selectOrbits(orbits, "reliable", rule);
    expect(reliable.members).toHaveLength(counts.reliable);
    expect(reliable.members.every((m) => Number(m.recordId.split("-")[2]) % 4 !== 0 && Number(m.recordId.split("-")[2]) % 5 !== 0)).toBe(true);
    expect(selectOrbits(orbits, "all", rule)).toBe(orbits);
  });

  it("keeps a record that sits exactly on the thresholds, and cuts one just outside", () => {
    const edge = (q: number, sigma: number) => orbitSetCounts({ ...orbits, members: orbits.members.slice(0, 1), quality: [{ convergenceAngleDeg: q, velocityKmS: 50, velocityErrorKmS: sigma }] }, rule).reliable;
    expect(edge(15, 5)).toBe(1);
    expect(edge(14.99, 5)).toBe(0);
    expect(edge(15, 5.01)).toBe(0);
  });

  it("draws the chosen set, says which, with its count and the cited rule, and offers the other for comparison", () => {
    const loaded: MeasuredLoad = { kind: "loaded", orbits };
    const all = buildShowerDefinition(settings, loaded);
    const reliable = buildShowerDefinition(settings, loaded, "reliable");
    const counts = orbitSetCounts(orbits, rule);
    expect(groupsOf(all)[0].group.count).toBe(200);
    expect(groupsOf(reliable)[0].group.count).toBe(counts.reliable);
    const text = (groupsOf(reliable)[0].object.knownLimitations ?? []).join(" ");
    expect(text).toMatch(new RegExp(`Orbit set shown: reliable orbits only \\(${counts.reliable} of 200 bound orbits`));
    expect(text).toMatch(/Qc \(the maximum convergence angle between the stations that saw the meteor\) at least 15° and the Vgeo sigma at most 10% of Vgeo/);
    expect(text).toMatch(/The cut is the published rule: Made-up rule for the builder test/);
    expect(text).toMatch(/GMN has no double-entry flag/);
    expect(orbitSetSentence(settings, "all", counts)).toMatch(/Orbit set shown: all orbits \(200 of 200/);
    expect(groupsOf(reliable)[0].group.provenance.notes).toMatch(new RegExp(`${counts.reliable} orbits drawn \\(reliable set\\)`));
    expect(all.alternates?.map((a) => [a.param, a.value, a.active])).toEqual([["orbits", "all", true], ["orbits", "reliable", false]]);
    expect(reliable.alternates?.map((a) => a.active)).toEqual([false, true]);
    expect(buildShowerDefinition(settings, { kind: "absent" }).alternates).toBeUndefined();
  });

  it.each([
    ["a bad default set", (s: Record<string, any>) => { s.stream.quality.default = "some"; }, /stream\.quality\.default/],
    ["a missing rule", (s: Record<string, any>) => { delete s.stream.quality.rule; }, /stream\.quality\.rule/],
    ["a zero error fraction", (s: Record<string, any>) => { s.stream.quality.rule.maxVelocityErrorFraction = 0; }, /maxVelocityErrorFraction/],
    ["an angle over 90", (s: Record<string, any>) => { s.stream.quality.rule.minConvergenceAngleDeg = 91; }, /minConvergenceAngleDeg/],
    ["a rule with no quotation", (s: Record<string, any>) => { delete s.stream.quality.rule.quote; }, /stream\.quality\.rule\.quote/],
  ])("names the field for %s", (_what, change, field) => {
    expect(broken(change)).toThrow(field);
  });
});

describe("the timeline span", () => {
  const settings = parseShowerSettings(madeUp);
  it("is the activity window unless the settings ask for a year", () => {
    expect(settings.timeline.span).toBe("activity");
    expect(timelineBoundsOf(settings)).toEqual({ startUtcMs: Date.parse(settings.activity.startUtc), endUtcMs: Date.parse(settings.activity.endUtc) });
  });

  it("is one year centred on the peak for a year, with the stream, the clock and the activity window all inside it", () => {
    const yearly = clone();
    yearly.timeline = { span: "year", rateSecondsPerSecond: 604_800 };
    const parsed = parseShowerSettings(yearly);
    const { startUtcMs, endUtcMs } = timelineBoundsOf(parsed);
    expect((endUtcMs - startUtcMs) / DAY_MS).toBeCloseTo(365.256363, 3);
    const peak = Date.parse(parsed.activity.peakUtc);
    expect((peak - startUtcMs) / (endUtcMs - startUtcMs)).toBeCloseTo(0.5, 3);
    const definition = buildShowerDefinition(parsed, { kind: "loaded", orbits: madeUpOrbits(999, 50) });
    expect(definition.experience.window).toEqual({ startUtcMs, endUtcMs });
    expect(definition.clock).toEqual({ startUtcMs, rate: 604_800 });
    expect(definition.experience.rates).toContain(604_800);
    const group = groupsOf(definition)[0].group;
    expect(group.bounds).toEqual({ startUtcMs, endUtcMs });
    const out = new Float64Array(3 * group.count);
    for (const t of [startUtcMs, peak, endUtcMs]) { group.fillPositionsKm(t, out); expect(out.every(Number.isFinite)).toBe(true); }
    const window = definition.experience.windows![0];
    expect(window.startUtcMs).toBe(Date.parse(parsed.activity.startUtc));
    expect(window.endUtcMs).toBe(Date.parse(parsed.activity.endUtc));
    expect(rateAt(window, startUtcMs + 5 * DAY_MS)).toBeNull();
    expect(rateAt(window, peak)).toBeCloseTo(40, 6);
    expect(definition.experience.events.map((e) => e.timeUtcMs)).toEqual([window.startUtcMs, peak, window.endUtcMs]);
    expect(Date.parse(parsed.activity.startUtc)).toBeGreaterThan(startUtcMs);
    expect(Date.parse(parsed.activity.endUtc)).toBeLessThan(endUtcMs);
  });

  it("names the field for a bad span or rate", () => {
    expect(broken((s) => { s.timeline = { span: "decade" }; })).toThrow(/timeline\.span/);
    expect(broken((s) => { s.timeline = { span: "year", rateSecondsPerSecond: 0 }; })).toThrow(/timeline\.rateSecondsPerSecond/);
    expect(parseShowerSettings(perseidsFile).timeline).toEqual({ span: "year", rateSecondsPerSecond: 604_800, yearStartUtc: "2019-09-21T00:00:00Z" });
  });

  // O-024 T-092: a year that starts on a given date instead of being centred on the peak (made-up settings: the capability is generic).
  it("starts the year at the settings' year start when given: the clock, the timeline and the stream all begin there", () => {
    const yearly = clone();
    yearly.timeline = { span: "year", rateSecondsPerSecond: 604_800, yearStartUtc: "2030-01-15T00:00:00Z" };
    const parsed = parseShowerSettings(yearly);
    const startUtcMs = Date.parse("2030-01-15T00:00:00Z");
    const endUtcMs = startUtcMs + Math.round(365.256363 * DAY_MS);
    expect(timelineBoundsOf(parsed)).toEqual({ startUtcMs, endUtcMs });
    const definition = buildShowerDefinition(parsed, { kind: "loaded", orbits: madeUpOrbits(999, 50) });
    expect(definition.experience.window).toEqual({ startUtcMs, endUtcMs });
    expect(definition.clock).toEqual({ startUtcMs, rate: 604_800 });
    expect(groupsOf(definition)[0].group.bounds).toEqual({ startUtcMs, endUtcMs });
    // The narrowed view still spans the activity window, whatever the year start.
    const narrowed = parseShowerSettings({ ...yearly, timeline: { ...yearly.timeline, span: "activity" } });
    expect(timelineBoundsOf(narrowed)).toEqual({ startUtcMs: Date.parse(narrowed.activity.startUtc), endUtcMs: Date.parse(narrowed.activity.endUtc) });
  });

  it.each([
    ["a year start after the activity begins", "2030-03-02T00:00:00Z"],
    ["a year that ends before the activity ends", "2029-03-01T00:00:00Z"],
    ["a year start that is not a UTC time", "2030-01-15"],
  ])("names the field for %s", (_what, yearStartUtc) => {
    expect(broken((s) => { s.timeline = { span: "year", yearStartUtc }; })).toThrow(/timeline\.yearStartUtc/);
  });

  it.each([
    ["Perseids", perseidsFile],
    ["Geminids", geminidsFile],
  ])("%s: the year runs from 21 September 2019 with the peak inside it, and the narrowed view is the 2019-2020 activity window", (_name, file) => {
    const parsed = parseShowerSettings(file);
    const { startUtcMs, endUtcMs } = timelineBoundsOf(parsed);
    expect(new Date(startUtcMs).toISOString()).toBe("2019-09-21T00:00:00.000Z");
    expect(new Date(endUtcMs).toISOString()).toBe("2020-09-20T06:09:09.763Z");
    expect(buildShowerDefinition(parsed, { kind: "absent" }).clock.startUtcMs).toBe(startUtcMs);
    const peak = Date.parse(parsed.activity.peakUtc);
    expect(peak).toBeGreaterThan(startUtcMs);
    expect(peak).toBeLessThan(endUtcMs);
    const narrowed = buildShowerDefinition(parseShowerSettings({ ...file, timeline: { ...file.timeline, span: "activity" } }), { kind: "absent" });
    expect(narrowed.experience.window).toEqual({ startUtcMs: Date.parse(parsed.activity.startUtc), endUtcMs: Date.parse(parsed.activity.endUtc) });
    expect(narrowed.clock.startUtcMs).toBe(Date.parse(parsed.activity.startUtc));
  });

  it("pins the published 2019-2020 values: Geminids 4-17 December 2019 (IMO 2019), Perseids 17 July - 24 August 2020 (IMO 2020), peaks at the IAU MDC solar longitudes", () => {
    const gem = parseShowerSettings(geminidsFile).activity;
    const per = parseShowerSettings(perseidsFile).activity;
    expect([gem.startUtc, gem.endUtc, gem.peakUtc]).toEqual(["2019-12-04T00:00:00Z", "2019-12-18T00:00:00Z", "2019-12-14T04:33:33Z"]);
    expect([per.startUtc, per.endUtc, per.peakUtc]).toEqual(["2020-07-17T00:00:00Z", "2020-08-25T00:00:00Z", "2020-08-12T15:41:56Z"]);
    expect(gem.source.name).toMatch(/2019 Meteor Shower Calendar/);
    expect(per.source.name).toMatch(/2020 Meteor Shower Calendar/);
    // Inside IMO's published peak periods: 2019 December 14 02h-23h UT; 2020 August 12 13h-16h UT.
    expect(Date.parse(gem.peakUtc)).toBeGreaterThanOrEqual(Date.parse("2019-12-14T02:00:00Z"));
    expect(Date.parse(gem.peakUtc)).toBeLessThanOrEqual(Date.parse("2019-12-14T23:00:00Z"));
    expect(Date.parse(per.peakUtc)).toBeGreaterThanOrEqual(Date.parse("2020-08-12T13:00:00Z"));
    expect(Date.parse(per.peakUtc)).toBeLessThanOrEqual(Date.parse("2020-08-12T16:00:00Z"));
  });
});

describe("object labels as settings", () => {
  const settings = parseShowerSettings(madeUp);
  it("show every label unless the settings file says otherwise, and keep the object listed and selectable", () => {
    expect(settings.labels).toEqual({});
    const off = clone();
    off.labels = { sun: false, earth: true };
    const parsed = parseShowerSettings(off);
    const definition = buildShowerDefinition(parsed, { kind: "absent" });
    const objects = definition.experience.objects;
    expect(objects.find((o) => o.id === "sun")?.showLabel).toBe(false);
    expect(objects.find((o) => o.id === "earth")?.showLabel).toBe(true);
    expect(objects.find((o) => o.id === "mars")?.showLabel).toBeUndefined();
    expect(objects.map((o) => o.id)).toContain("sun");
    expect(perseidsFile.labels).toEqual({ sun: false });
    expect(broken((s) => { s.labels = { sun: "no" }; })).toThrow(/labels\.sun/);
  });

  it("start from the objects' own settings and take ?labels= over them", () => {
    const objects = [{ id: "sun", showLabel: false }, { id: "earth", showLabel: true }, { id: "mars" }];
    expect([...hiddenLabelsFrom("", objects)]).toEqual(["sun"]);
    expect([...hiddenLabelsFrom("?labels=sun:on,earth:off", objects)]).toEqual(["earth"]);
    expect([...hiddenLabelsFrom("?labels=mars:off,bad,:on,earth:maybe", objects)].sort()).toEqual(["mars", "sun"]);
  });
});

describe("a parent defined in the settings file", () => {
  const defined = structuredClone(geminidsFile) as Record<string, any>;
  const parent = (): Record<string, any> => structuredClone(defined);
  const parsed = parseShowerSettings(defined);
  const definition = buildShowerDefinition(parsed, { kind: "loaded", orbits: madeUpOrbits(77, 120) });

  it("is given by exactly one of a catalogued id or its published elements", () => {
    const both = parent();
    both.parentBodyId = "mars";
    expect(() => parseShowerSettings(both)).toThrow(/parentBodyId and parentElements: exactly one must be given/);
    const neither = parent();
    delete neither.parentElements;
    expect(() => parseShowerSettings(neither)).toThrow(/parentBodyId and parentElements: exactly one must be given/);
    expect(parseShowerSettings(perseidsFile).parentElements).toBeUndefined();
    expect(parsed.parentBodyId).toBe(parsed.parentElements?.id);
  });

  it("names the field of a bad parent value", () => {
    const bad = parent();
    bad.parentElements.elements.eccentricity = 1.2;
    expect(() => parseShowerSettings(bad)).toThrow(/parentElements\.elements\.eccentricity must be at least 0 and below 1/);
    const missing = parent();
    delete missing.parentElements.source.solution;
    expect(() => parseShowerSettings(missing)).toThrow(/parentElements\.source\.solution is required/);
    expect(() => parseShowerSettings(bad)).toThrow(ShowerSettingsError);
  });

  it("must agree with the orbit size and shape the file states once more", () => {
    const off = parent();
    off.orbit.elements.semiMajorAxisAu = 1.3;
    expect(() => parseShowerSettings(off)).toThrow(/orbit\.elements\.semiMajorAxisAu must equal parentElements\.elements\.semiMajorAxisAu/);
  });

  it("adds the parent to the experience's own catalogue and leaves the built-in one alone", () => {
    expect(catalogue.has(parsed.parentBodyId)).toBe(false);
    expect(definition.catalogue?.has(parsed.parentBodyId)).toBe(true);
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", parsed.parentBodyId]);
    expect(mountedBodiesOf(definition)).not.toContain("swift-tuttle");
    expect(definition.composition?.bodies).toContain(parsed.parentBodyId);
    expect(showerComposition(parsed).bodies).toContain(parsed.parentBodyId);
  });

  it("draws the parent's whole orbit like a catalogued one and does not repeat it among the planets' orbits", () => {
    const ids = (definition.paths ?? []).map((path) => path.object.id);
    expect(ids).toContain(parentOrbitIdOf(parsed));
    expect(ids.filter((id) => id === parentOrbitIdOf(parsed))).toHaveLength(1);
    const whole = definition.paths!.find((path) => path.object.id === parentOrbitIdOf(parsed))!;
    expect(whole.sampling?.eccentricity).toBe(parsed.parentElements!.elements.eccentricity);
    expect(whole.object.provenance?.accuracy).toMatch(/^indicative: /);
    const span = whole.span as { startUtcMs: number; endUtcMs: number };
    const spanDays = (span.endUtcMs - span.startUtcMs) / DAY_MS;
    expect(spanDays).toBeGreaterThan(520);
    expect(spanDays).toBeLessThan(527);
  });

  it("puts the parent's own periapsis where the sweep finds it", () => {
    const sampled = parentSamplingOf(parsed, Date.parse(parsed.activity.peakUtc));
    const built = buildElementsBody(parsed.parentElements!, CENTRE);
    const period = built.sampling.periodMs;
    const offset = (((sampled.periapsisUtcMs - built.sampling.periapsisUtcMs) % period) + period) % period;
    expect(Math.min(offset, period - offset)).toBeLessThan(60_000);
  });

  it("labels the camera preset generically, not as a comet", () => {
    const labels = definition.experience.cameraPresets.map((preset) => preset.label);
    expect(labels).toContain("Focus parent");
    expect(labels.join(" ")).not.toMatch(/comet/i);
    expect(definition.experience.cameraPresets.find((preset) => preset.id === "focus-parent")?.request).toEqual({ kind: "focus", target: parsed.parentBodyId });
  });

  it("gives the parent's shell item the record's own provenance and limits", () => {
    const item = definition.experience.objects.find((object) => object.id === parsed.parentBodyId)!;
    expect(item.label).toBe(parsed.parentElements!.label);
    expect(item.color).toBe(parsed.parentElements!.marker.color);
    expect(item.provenance?.accuracy).toMatch(/^indicative: /);
    expect(item.knownLimitations?.join(" ")).toMatch(/no planetary perturbations and no non-gravitational forces/);
  });

  it("resolves from the scene's own resolver, and the planets' orbit list is unchanged", () => {
    const resolver = createSceneResolver(adapter, definition.catalogue);
    const t = Date.parse(parsed.activity.peakUtc);
    const state = resolver.stateOf(parsed.parentBodyId, t, "sun");
    expect(Math.hypot(...state.positionKm) / 149_597_870.7).toBeGreaterThan(0.1);
    expect(() => createSceneResolver(adapter).stateOf(parsed.parentBodyId, t, "sun")).toThrow();
    const orbitIds = (definition.paths ?? []).map((path) => path.object.id).filter((id) => id.endsWith("-orbit"));
    expect(orbitIds.sort()).toEqual(["jupiter-orbit", "mars-orbit", "mercury-orbit", "phaethon-orbit", "venus-orbit"]);
  });

  it("leaves Perseids with its own comet and the same four planets, and no other shower's parent", () => {
    const perseids = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "absent" });
    expect(mountedBodiesOf(perseids)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", "swift-tuttle"]);
    expect(mountedBodiesOf(perseids)).not.toContain("phaethon");
  });

  it("leaves Perseids with its catalogued parent and no extension", () => {
    const perseids = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "absent" });
    expect(perseids.catalogue).toBeUndefined();
    expect(perseids.experience.cameraPresets.find((preset) => preset.id === "focus-parent")?.label).toBe("Focus parent");
  });
});

describe("story panels carried by shower settings (O-015 / T-062, ARCH-03)", () => {
  const panel = (change: Record<string, unknown> = {}) => ({
    id: "crossing", at: { event: "test-drift-peak" }, object: "earth", title: "Made-up crossing", body: ["Made-up sentence."], badge: "illustrative", sources: ["Made-up source"], ...change,
  });
  const withPanels = (panels: unknown): Record<string, any> => ({ ...clone(), story: { panels } });
  const build = (settings: Record<string, any>, load: MeasuredLoad = { kind: "absent" }) => buildShowerDefinition(parseShowerSettings(settings), load);

  it("lets any shower file carry inline panels with no code, resolving event times and objects", () => {
    const set = build(withPanels({ pauseSeconds: 3, panels: [panel(), panel({ id: "start", at: { utc: "2030-03-02T00:00:00Z" }, object: "test-drift-stream" })] }), { kind: "loaded", orbits: madeUpOrbits(999, 50) }).experience.storyPanels!;
    expect(set.pauseSeconds).toBe(3);
    expect(set.panels.map((p) => p.id)).toEqual(["start", "crossing"]);
    expect(set.panels[1]!.timeUtcMs).toBe(Date.parse("2030-03-11T00:00:00Z"));
  });

  it("carries no panels unless the settings name them", () => {
    expect(build(clone()).experience.storyPanels).toBeUndefined();
    // The Geminids now carry their own story (T-089); a shower without a story block still has none.
    const { story: _story, ...geminidsWithoutStory } = geminidsFile as Record<string, unknown>;
    expect(buildShowerDefinition(parseShowerSettings(geminidsWithoutStory), { kind: "absent" }).experience.storyPanels).toBeUndefined();
  });

  it("reads a panels file by the path the settings name", () => {
    const settings = parseShowerSettings(perseidsFile);
    expect(settings.story?.panels).toBe("data/stories/perseids/panels.json");
    const set = buildShowerDefinition(settings, { kind: "absent" }, undefined, shippedPanelsOf(settings)).experience.storyPanels!;
    expect(set.panels.map((p) => [p.id, p.badge, p.objectId])).toEqual([
      ["stream-shape", "illustrative", "perseids-stream"],
      ["earth-crossing", "observed", "earth"],
      ["swift-tuttle", "modelled", "swift-tuttle"],
    ]);
    expect(set.panels[1]!.timeUtcMs).toBe(Date.parse(perseidsFile.activity.peakUtc));
    for (const p of set.panels) expect(p.sources.length).toBeGreaterThan(0);
  });

  it("leaves out panels outside a narrowed (activity) span without throwing, but still rejects ones outside the full year", () => {
    const early = panel({ id: "early", at: { utc: "2030-01-01T00:00:00Z" } });
    const base = withPanels({ panels: [early, panel()] });
    const narrowed = { ...base, timeline: { span: "activity", rateSecondsPerSecond: 86_400 } };
    const wide = { ...base, timeline: { span: "year", rateSecondsPerSecond: 604_800 } };
    expect(build(narrowed).experience.storyPanels!.panels.map((p) => p.id)).toEqual(["crossing"]);
    expect(build(wide).experience.storyPanels!.panels.map((p) => p.id)).toEqual(["early", "crossing"]);
    const far = { ...narrowed, story: { panels: { panels: [panel({ at: { utc: "2031-01-01T00:00:00Z" } })] } } };
    expect(() => build(far)).toThrow(/crossing: at falls outside the timeline window/);
  });

  it.each([
    ["a path outside a story folder", withPanels("data/showers/perseids.json"), /story\.panels must be a path like data\/stories/],
    ["panels that are not a list", withPanels({ panels: "x" }), /story\.panels\.panels/],
    ["a story that is not an object", { ...clone(), story: "panels" }, /story is required and must be an object/],
  ])("names the field for %s", (_what, settings, message) => {
    expect(() => build(settings as Record<string, any>)).toThrow(ShowerSettingsError);
    expect(() => build(settings as Record<string, any>)).toThrow(message);
  });

  it("builds a shower from the panels it is handed, and a made-up shower gains panels from settings alone (T-152, ARCH-03)", () => {
    const handed = { panels: [panel()] };
    const settings = parseShowerSettings({ ...clone(), story: { panels: "data/stories/made-up/panels.json" } });
    expect(buildShowerDefinition(settings, { kind: "absent" }).experience.storyPanels).toBeUndefined();
    expect(buildShowerDefinition(settings, { kind: "absent" }, undefined, handed).experience.storyPanels!.panels.map((p) => p.id)).toEqual(["crossing"]);
    expect(() => buildShowerDefinition(settings, { kind: "absent" }, undefined, { panels: [panel({ object: "ghost" })] })).toThrow(/story\.panels: .*crossing: object names "ghost"/);
  });

  it("loads only the panels file the settings name, and says so when the project has none (T-152)", async () => {
    const loaded: string[] = [];
    const lookup = { "../data/stories/a/panels.json": async () => { loaded.push("a"); return { a: 1 }; }, "../data/stories/b/panels.json": async () => { loaded.push("b"); return { b: 1 }; } };
    const named = (path: string) => parseShowerSettings({ ...clone(), story: { panels: path } });
    expect(await loadShowerPanelsFile(named("data/stories/b/panels.json"), lookup)).toEqual({ b: 1 });
    expect(loaded).toEqual(["b"]);
    expect(await loadShowerPanelsFile(parseShowerSettings({ ...clone(), story: { panels: { panels: [] } } }), lookup)).toBeUndefined();
    await expect(loadShowerPanelsFile(named("data/stories/nothing/panels.json"), lookup)).rejects.toThrow(/story\.panels names "data\/stories\/nothing\/panels\.json", which is not a panels file/);
    await expect(loadShowerPanelsFile(named("data/stories/nothing/panels.json"), lookup)).rejects.toThrow(ShowerSettingsError);
  });

  it.each([
    ["an unknown object", panel({ object: "ghost" }), /crossing: object names "ghost"/],
    ["an unknown event", panel({ at: { event: "nope" } }), /crossing: at\.event names "nope"/],
    ["a time outside the timeline", panel({ at: { utc: "2031-01-01T00:00:00Z" } }), /crossing: at falls outside the timeline window/],
    ["no sources", panel({ sources: [] }), /crossing: sources must be one or more/],
  ])("names the panel and field for %s", (_what, entry, message) => {
    expect(() => build(withPanels({ panels: [entry] }))).toThrow(ShowerSettingsError);
    expect(() => build(withPanels({ panels: [entry] }))).toThrow(message);
  });
});
