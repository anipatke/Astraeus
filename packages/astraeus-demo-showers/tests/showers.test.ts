// The showers' settings, scene builder and story panels (rebuilt on the public API in O-042 T-176).
// Dropped with the rebuild, each for a reason: the clock-wrap and group-bounds cases of "looping playback" (engine behaviour, kept by the engine's clock and group tests; the
// shower's own part, the loop setting, stays); the whole "orbit sets" block and the `?orbits=` alternates (Decision 1: the stream always shows all orbits; the counts and the
// published rule stay as known-limit text, kept below); the parent-sampling sweep (the engine draws the comet's whole orbit now, tested on made-up elements); the "refuses a parent
// that does not circle the Sun" case (the public scene cannot tell a catalogued parent's centre; a bad parent is a `no-orbit` or `unknown-body` SceneError); the narrowed
// (activity) span's panel filter (the `?span=` option went, Decision 1); the "Whole orbit" and "Focus parent" presets (Decision 6).
import { describe, expect, it } from "vitest";
import { SceneError } from "astraeus";
import { experienceWithGroups, groupsOf, mountedBodiesOf, sunCentredOf } from "astraeus/app/experienceDefinition";
import { hiddenLabelsFrom, loopFromSearch } from "astraeus/app/App";
import { catalogue } from "astraeus/assets/catalogue";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { rateAt } from "astraeus/core/timeWindow";
import { streamIdOf, timelineBoundsOf } from "../src/experiences/showers/showerBasics";
import { loadShowerPanelsFile, rateSamplesOf } from "../src/experiences/showers/showerScene";
import { orbitCountsSentence } from "../src/experiences/showers/showerText";
import { orbitSetCounts, parseMeasuredOrbits, type MeasuredLoad } from "../src/experiences/showers/measuredOrbits";
import { shippedPanelsOf } from "./helpers/shippedPanels";
import perseidsFile from "../data/showers/perseids.json";
import geminidsFile from "../data/showers/geminids.json";
import { citedSourceOf, parseShowerSettings, ShowerSettingsError } from "../src/experiences/showers/showerSettings";
import { madeUpOrbits } from "./helpers/measuredOrbits";
import { buildShowerDefinition } from "./helpers/showerDefinition";

const adapter = createOrbAstronomyAdapter();
const DAY_MS = 86_400_000;

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


describe("the shower scene with a made-up shower", () => {
  const settings = parseShowerSettings(madeUp);
  const loaded: MeasuredLoad = { kind: "loaded", orbits: madeUpOrbits(999, 300) };
  const definition = buildShowerDefinition(settings, loaded);
  const layer = groupsOf(definition)[0];

  it("builds a Sun-centred scene of the Sun, Earth, the planets and the parent, with one stream item", () => {
    expect(definition.sceneLayers).toEqual(["tracked-bodies", "points", "sun-centred"]);
    // The Sun, the planets and this shower's own parent (here Mars, a planet); no other shower's parent.
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter"]);
    expect(layer.group.center).toBe("sun");
    expect(layer.group.count).toBe(300);
    expect(layer.object.id).toBe(streamIdOf(settings));
    expect(definition.experience.cameraPresets.map((p) => p.id)).toContain("focus-test-drift-stream");
    expect(definition.camera?.maxFocusDistance).toBe(3_000_000);
  });

  it("takes the look from the settings, not from code", () => {
    expect(layer.color).toBe("#88ccff");
    expect(layer.pointSizePx).toBe(3);
    expect(layer.refillAfterMs).toBe(12 * 3_600_000);
    // The parent (here Mars, a stand-in) is the comet-like body the settings name: it is not enlarged.
    expect(Object.keys(definition.visualOverrides ?? {}).sort()).toEqual(["earth", "jupiter", "mercury", "venus"]);
    expect(Object.values(definition.visualOverrides ?? {}).every((override) => override.exaggeration === 250)).toBe(true);
    expect(experienceWithGroups(definition).objects.find((o) => o.id === "earth")?.description).toMatch(/250 times larger than life/);
  });

  it("draws an orbit line for Earth, the planets and the parent, each once", () => {
    const ids = sunCentredOf(definition).paths.map((p) => p.object.id).sort();
    expect(ids).toEqual(["earth-orbit", "jupiter-orbit", "mars-orbit", "mercury-orbit", "venus-orbit"]);
  });

  it("states what is measured, what is a drawing choice and what is not shown", () => {
    expect(layer.group.provenance.sourceType).toBe("illustrative");
    const text = (layer.object.knownLimitations ?? []).join(" ");
    expect(text).toMatch(/position of each dot along its orbit is illustrative/i);
    expect(text).toMatch(/25% of the dots are drawn near/);
    expect(text).toMatch(/\(illustrative defaults: Made-up default for the builder test\.\)/);
    expect(text).toContain(`band at ${settings.parentBody}'s phase, not a blob on ${settings.parentBody}`);
    expect(text).toMatch(/Parts of the stream that miss Earth are not shown/);
    const window = definition.experience.windows![0];
    const peak = Date.parse(settings.activity.peakUtc);
    expect(window.provenance!.find((span) => peak >= span.startUtcMs && peak <= span.endUtcMs)?.provenance.sourceType).toBe("observed");
    expect(window.provenance!.find((span) => peak - 5 * DAY_MS >= span.startUtcMs && peak - 5 * DAY_MS <= span.endUtcMs)?.provenance.sourceType).toBe("illustrative");
  });

  it("cites a cited clump with its source", () => {
    const cited = clone();
    cited.stream.concentration = { fraction: 0.4, widthDeg: 15, status: "cited", basis: "Made-up paper, table 2", source: { name: "Made-up paper", url: "https://example.invalid/paper", accessed: "2030-01-01" } };
    const group = groupsOf(buildShowerDefinition(parseShowerSettings(cited), loaded))[0];
    expect((group.object.knownLimitations ?? []).join(" ")).toMatch(/cited; basis: Made-up paper, table 2/);
  });

  it("draws no clump when the settings state none (0%)", () => {
    const none = clone();
    none.stream.concentration.fraction = 0;
    const text = (groupsOf(buildShowerDefinition(parseShowerSettings(none), loaded))[0].object.knownLimitations ?? []).join(" ");
    expect(text).not.toMatch(/clump/);
  });

  it("uses the same samples for the rate readout and the window curve, peaking at the published rate", () => {
    const window = definition.experience.windows?.[0];
    expect(window).toBeDefined();
    const peak = Date.parse(settings.activity.peakUtc);
    expect(rateAt(window!, peak)).toBeCloseTo(40, 6);
    expect(rateAt(window!, peak + 2 * DAY_MS)).toBeCloseTo(40 * 10 ** -0.4, 6);
    expect(rateSamplesOf(settings).some((s) => s.time === peak && s.value === 40)).toBe(true);
    const metrics = definition.createMetrics({ clock: undefined as never, resolver: createSceneResolver(adapter), catalogue })(streamIdOf(settings), peak + 2 * DAY_MS);
    const rate = metrics.find((m) => m.kind === "rate");
    expect(rate?.kind === "rate" ? rate.value : null).toBeCloseTo(rateAt(window!, peak + 2 * DAY_MS) ?? Number.NaN, 9);
  });
});

describe("the orbit source", () => {
  const perseids = parseShowerSettings(perseidsFile);
  const geminids = parseShowerSettings(geminidsFile);

  it("is the GMN for both showers, named with its months and licence in the settings, and offers no source or orbit-set switch", () => {
    expect(geminids.stream.sources.gmn).toMatchObject({ months: ["202412", "202512"], licence: "CC BY 4.0" });
    expect(perseids.stream.sources.gmn).toMatchObject({ months: ["202507", "202508"], licence: "CC BY 4.0" });
    expect(citedSourceOf(perseids).name).toContain("Global Meteor Network");
    expect(buildShowerDefinition(perseids, { kind: "absent" }).alternates).toBeUndefined();
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
});

describe("a shower whose measured orbits are not on this machine", () => {
  const settings = parseShowerSettings(madeUp);
  it.each([
    ["absent", { kind: "absent" } as MeasuredLoad, /not fetched on this machine.*node packages\/astraeus-demo-showers\/tools\/data\/fetch-meteoroid-orbits\.mjs 999/s],
    ["invalid", { kind: "invalid", problem: "measured orbit file holds no rows" } as MeasuredLoad, /cannot be used: measured orbit file holds no rows/],
  ])("%s: says so in the Sun's description (the dev-only item became a note), draws no stream and invents none", (_name, load, message) => {
    const definition = buildShowerDefinition(settings, load);
    expect(groupsOf(definition)).toEqual([]);
    const sun = experienceWithGroups(definition).objects.find((o) => o.id === "sun");
    expect(sun?.description).toMatch(message);
    expect(definition.experience.cameraPresets.map((p) => p.id)).not.toContain(`focus-${streamIdOf(settings)}`);
  });
});

describe("the published orbit counts", () => {
  const settings = parseShowerSettings(madeUp);
  const orbits = madeUpOrbits(999, 200);
  const rule = settings.stream.quality.rule;
  // madeUpOrbits: Q is 8 for every 4th member (cut); the velocity error is 9 km/s, over 10% of 59, for every 5th (cut).
  const expectedCut = Array.from({ length: 200 }, (_, k) => k).filter((k) => k % 4 === 0 || k % 5 === 0).length;

  it("counts the orbits that pass the published cut, keeping a record exactly on the thresholds and cutting one just outside", () => {
    expect(orbitSetCounts(orbits, rule)).toEqual({ all: 200, cut: expectedCut, reliable: 200 - expectedCut });
    const edge = (q: number, sigma: number) => orbitSetCounts({ ...orbits, members: orbits.members.slice(0, 1), quality: [{ convergenceAngleDeg: q, velocityKmS: 50, velocityErrorKmS: sigma }] }, rule).reliable;
    expect(edge(15, 5)).toBe(1);
    expect(edge(14.99, 5)).toBe(0);
    expect(edge(15, 5.01)).toBe(0);
  });

  it("draws every orbit and says in the stream's known limits how many pass the published rule", () => {
    const definition = buildShowerDefinition(settings, { kind: "loaded", orbits });
    const counts = orbitSetCounts(orbits, rule);
    expect(groupsOf(definition)[0].group.count).toBe(200);
    const text = (groupsOf(definition)[0].object.knownLimitations ?? []).join(" ");
    expect(text).toMatch(new RegExp(`Orbit set shown: all orbits \\(200 bound orbits; the reliable set, .*, has ${counts.reliable} and cuts ${counts.cut}\\)`));
    expect(text).toMatch(/Qc \(the maximum convergence angle between the stations that saw the meteor\) at least 15° and the Vgeo sigma at most 10% of Vgeo/);
    expect(text).toMatch(/The cut is the published rule: Made-up rule for the builder test/);
    expect(text).toMatch(/GMN has no double-entry flag/);
    expect(orbitCountsSentence(settings, { all: 5, reliable: null, cut: null })).toMatch(/Orbit set shown: all orbits \(5 bound orbits\)\. This file carries no per-orbit quality columns/);
    expect(groupsOf(definition)[0].group.provenance.notes).toMatch(/200 orbits drawn \(all orbits\)/);
  });

  it.each([
    ["a missing rule", (s: Record<string, any>) => { delete s.stream.quality.rule; }, /stream\.quality\.rule/],
    ["a zero error fraction", (s: Record<string, any>) => { s.stream.quality.rule.maxVelocityErrorFraction = 0; }, /maxVelocityErrorFraction/],
    ["an angle over 90", (s: Record<string, any>) => { s.stream.quality.rule.minConvergenceAngleDeg = 91; }, /minConvergenceAngleDeg/],
    ["a rule with no quotation", (s: Record<string, any>) => { delete s.stream.quality.rule.quote; }, /stream\.quality\.rule\.quote/],
  ])("names the field for %s", (_what, change, field) => {
    expect(broken(change)).toThrow(field);
  });
});

describe("the camera and playback settings", () => {
  it("keeps the camera's up at celestial north unless the settings ask for the ecliptic", () => {
    expect(buildShowerDefinition(parseShowerSettings(madeUp), { kind: "absent" }).viewUp).toBe("equatorial");
    const up = clone();
    up.look.viewUp = "ecliptic";
    expect(buildShowerDefinition(parseShowerSettings(up), { kind: "absent" }).viewUp).toBe("ecliptic");
    expect(broken((s) => { s.look.viewUp = "sideways"; })).toThrow(/look\.viewUp/);
    expect(parseShowerSettings(perseidsFile).look.viewUp).toBe("ecliptic");
  });

  it("is off for an experience that does not ask, and on when the shower settings turn it on", () => {
    expect(buildShowerDefinition(parseShowerSettings(madeUp), { kind: "absent" }).loop).toBeFalsy();
    const on = clone();
    on.look.loop = true;
    expect(buildShowerDefinition(parseShowerSettings(on), { kind: "absent" }).loop).toBe(true);
    expect(broken((s) => { s.look.loop = "yes"; })).toThrow(/look\.loop/);
    expect(loopFromSearch("?loop=on", false)).toBe(true);
    expect(loopFromSearch("?loop=off", true)).toBe(false);
    expect(loopFromSearch("", true)).toBe(true);
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
    // The activity span still spans the activity window, whatever the year start.
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
    // The activity span (no panels outside it are filtered any more: the `?span=` option went, Decision 1).
    const { story: _story, ...noStory } = file as Record<string, unknown>;
    const narrowed = buildShowerDefinition(parseShowerSettings({ ...noStory, timeline: { ...file.timeline, span: "activity" } }), { kind: "absent" });
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

  it("names the field of a bad parent value: the settings check the identity, the scene names the rest", () => {
    const missing = parent();
    delete missing.parentElements.id;
    expect(() => parseShowerSettings(missing)).toThrow(/parentElements\.id/);
    expect(() => parseShowerSettings(missing)).toThrow(ShowerSettingsError);
    const bad = parent();
    bad.parentElements.elements.eccentricity = 1.2;
    bad.orbit.elements.eccentricity = 1.2;
    expect(() => parseShowerSettings(bad)).toThrow(/orbit\.elements\.eccentricity/);
    const noSolution = parent();
    delete noSolution.parentElements.source.solution;
    const error = (() => { try { buildShowerDefinition(parseShowerSettings(noSolution), { kind: "absent" }); } catch (e) { return e; } })();
    expect(error).toBeInstanceOf(SceneError);
    expect((error as SceneError).code).toBe("bad-element");
    expect((error as Error).message).toMatch(/source\.solution is required/);
  });

  it("must agree with the orbit size and shape the file states once more", () => {
    const off = parent();
    off.orbit.elements.semiMajorAxisAu = 1.3;
    expect(() => parseShowerSettings(off)).toThrow(/orbit\.elements\.semiMajorAxisAu must equal parentElements\.elements\.semiMajorAxisAu/);
  });

  it("adds the parent to the scene's own catalogue and leaves the built-in one alone", () => {
    expect(catalogue.has(parsed.parentBodyId)).toBe(false);
    expect(definition.catalogue?.has(parsed.parentBodyId)).toBe(true);
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", parsed.parentBodyId]);
    expect(mountedBodiesOf(definition)).not.toContain("swift-tuttle");
    expect(definition.composition?.bodies).toContain(parsed.parentBodyId);
  });

  it("draws the parent's whole orbit from its periapsis like a catalogued one, once", () => {
    const ids = (definition.paths ?? []).map((path) => path.object.id);
    expect(ids.filter((id) => id === `${parsed.parentBodyId}-orbit`)).toHaveLength(1);
    const whole = definition.paths!.find((path) => path.object.id === `${parsed.parentBodyId}-orbit`)!;
    expect(whole.sampling?.eccentricity).toBe(parsed.parentElements!.elements.eccentricity);
    expect(whole.object.provenance?.accuracy).toMatch(/^indicative: /);
    const span = whole.span as { startUtcMs: number; endUtcMs: number };
    const spanDays = (span.endUtcMs - span.startUtcMs) / DAY_MS;
    expect(spanDays).toBeGreaterThan(520);
    expect(spanDays).toBeLessThan(527);
  });

  it("labels the camera preset by the parent's name, not as a comet", () => {
    const labels = definition.experience.cameraPresets.map((preset) => preset.label);
    expect(labels).toContain(`Focus ${parsed.parentElements!.label}`);
    expect(labels.join(" ")).not.toMatch(/comet/i);
    expect(definition.experience.cameraPresets.find((preset) => preset.id === `focus-${parsed.parentBodyId}`)?.request).toEqual({ kind: "focus", target: parsed.parentBodyId });
  });

  it("gives the parent's shell item the record's own provenance and limits", () => {
    const item = definition.experience.objects.find((object) => object.id === parsed.parentBodyId)!;
    expect(item.label).toBe(parsed.parentElements!.label);
    expect(item.provenance?.accuracy).toMatch(/^indicative: /);
    expect(item.knownLimitations?.join(" ")).toMatch(/no planetary perturbations and no non-gravitational forces/);
  });

  it("resolves from the scene's own catalogue and from no other, and the orbit lines are Earth's, the four planets' and the parent's", () => {
    const resolver = createSceneResolver(adapter, definition.catalogue);
    const t = Date.parse(parsed.activity.peakUtc);
    const state = resolver.stateOf(parsed.parentBodyId, t, "sun");
    expect(Math.hypot(...state.positionKm) / 149_597_870.7).toBeGreaterThan(0.1);
    expect(() => createSceneResolver(adapter).stateOf(parsed.parentBodyId, t, "sun")).toThrow();
    const orbitIds = (definition.paths ?? []).map((path) => path.object.id).filter((id) => id.endsWith("-orbit"));
    expect(orbitIds.sort()).toEqual(["earth-orbit", "jupiter-orbit", "mars-orbit", "mercury-orbit", "phaethon-orbit", "venus-orbit"]);
  });

  it("leaves Perseids with its own comet and the same four planets, and no other shower's parent", () => {
    const perseids = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "absent" });
    expect(mountedBodiesOf(perseids)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", "swift-tuttle"]);
    expect(mountedBodiesOf(perseids)).not.toContain("phaethon");
  });

  it("leaves Perseids with its catalogued parent and no extension", () => {
    const perseids = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "absent" });
    expect(perseids.catalogue).toBeUndefined();
    expect(perseids.experience.cameraPresets.find((preset) => preset.id === "focus-swift-tuttle")?.label).toBe("Focus 109P/Swift-Tuttle");
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
    const set = buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(7, 20) }, shippedPanelsOf(settings)).experience.storyPanels!;
    expect(set.panels.map((p) => [p.id, p.badge, p.objectId])).toEqual([
      ["stream-shape", "illustrative", "perseids-stream"],
      ["earth-crossing", "observed", "earth"],
      ["swift-tuttle", "modelled", "swift-tuttle"],
    ]);
    expect(set.panels[1]!.timeUtcMs).toBe(Date.parse(perseidsFile.activity.peakUtc));
    for (const p of set.panels) expect(p.sources.length).toBeGreaterThan(0);
  });

  it("keeps a panel inside the year timeline and rejects one outside it", () => {
    const early = panel({ id: "early", at: { utc: "2030-01-01T00:00:00Z" } });
    const wide = { ...withPanels({ panels: [early, panel()] }), timeline: { span: "year", rateSecondsPerSecond: 604_800 } };
    expect(build(wide).experience.storyPanels!.panels.map((p) => p.id)).toEqual(["early", "crossing"]);
    const far = { ...wide, story: { panels: { panels: [panel({ at: { utc: "2031-01-01T00:00:00Z" } })] } } };
    expect(() => build(far)).toThrow(/crossing: at falls outside the timeline window/);
  });

  it("drops a panel's link to the stream when no stream is drawn, and keeps the panel", () => {
    const set = build(withPanels({ panels: [panel({ object: "test-drift-stream" })] })).experience.storyPanels!;
    expect(set.panels.map((p) => [p.id, p.objectId])).toEqual([["crossing", undefined]]);
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
    expect(buildShowerDefinition(settings, { kind: "absent" }, handed).experience.storyPanels!.panels.map((p) => p.id)).toEqual(["crossing"]);
    expect(() => buildShowerDefinition(settings, { kind: "absent" }, { panels: [panel({ object: "ghost" })] })).toThrow(/crossing: object names "ghost"/);
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
    expect(() => build(withPanels({ panels: [entry] }))).toThrow(SceneError);
    expect(() => build(withPanels({ panels: [entry] }))).toThrow(message);
  });
});
