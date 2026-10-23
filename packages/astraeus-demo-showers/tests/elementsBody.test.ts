import { describe, expect, it } from "vitest";
import fixture from "./fixtures/phaethon-horizons.json";
import source from "./fixtures/phaethon-horizons-source.txt?raw";
import geminids from "../data/showers/geminids.json";
import { createSwiftTuttleTrajectory, SWIFT_TUTTLE_ELEMENTS, SWIFT_TUTTLE_EPOCH_UTC_MS, SWIFT_TUTTLE_SAMPLING } from "astraeus/core/bodies/swiftTuttle";
import {
  APPROXIMATE_LIMIT_FRACTION,
  buildElementsBody,
  classifyPositionError,
  DEFAULT_ELEMENTS_MARKER_COLOUR,
  DEFAULT_ELEMENTS_MARKER_SIZE_PX,
  ElementsBodyError,
  INDICATIVE_LIMIT_FRACTION,
  parseElementsBodyRecord,
} from "astraeus/core/elementsBody";
import { catalogue, extendCatalogue } from "astraeus/assets/catalogue";

const AU_KM = 149_597_870.7;
const CENTRE = { id: "sun", gmKm3S2: catalogue.get("sun").definition.gmKm3S2! };
const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** The accuracy block every record needs; the values here are for the tests' own bodies only. */
const ACCURACY = { classification: "approximate", statement: "A test body.", validFromUtc: "1990-01-01T00:00:00Z", validToUtc: "2030-01-01T00:00:00Z" } as const;
const SOURCE = { name: "Test source", url: "https://example.org/orbit", solution: "S1", accessed: "2026-10-16" } as const;

/** The built-in comet's published elements, written as a record: the equivalence check builds this through the generic path. */
function recordFromBuiltIn(): unknown {
  const e = SWIFT_TUTTLE_ELEMENTS;
  return {
    id: "equivalent",
    label: "Equivalent",
    elements: { semiMajorAxisAu: e.semiMajorAxisAu, eccentricity: e.eccentricity, inclinationDeg: e.inclinationDeg, ascendingNodeDeg: e.ascendingNodeDeg, argumentOfPerihelionDeg: e.argumentOfPerihelionDeg, meanAnomalyDeg: e.meanAnomalyDeg },
    epoch: { jd: e.epochJdTdb, timeScale: "TDB", ttMinusUtcSeconds: 61.184 },
    frame: "ecliptic-j2000",
    source: SOURCE,
    accuracy: ACCURACY,
  };
}

describe("a body record is validated field by field", () => {
  const good = recordFromBuiltIn() as Record<string, any>;
  const with_ = (change: (copy: Record<string, any>) => void): unknown => {
    const copy = structuredClone(good);
    change(copy);
    return copy;
  };

  it("accepts a complete record and fills the marker defaults", () => {
    const parsed = parseElementsBodyRecord(good);
    expect(parsed.marker).toEqual({ color: DEFAULT_ELEMENTS_MARKER_COLOUR, sizePx: DEFAULT_ELEMENTS_MARKER_SIZE_PX });
    expect(parsed.accuracy.limitations).toEqual([]);
  });

  it.each([
    ["id", (c: any) => { c.id = "Not An Id"; }, /body\.id must be lower-case words/],
    ["label", (c: any) => { delete c.label; }, /body\.label is required/],
    ["elements.semiMajorAxisAu", (c: any) => { c.elements.semiMajorAxisAu = -1; }, /body\.elements\.semiMajorAxisAu must be positive/],
    ["elements.eccentricity", (c: any) => { c.elements.eccentricity = 1; }, /body\.elements\.eccentricity must be at least 0 and below 1/],
    ["elements.inclinationDeg", (c: any) => { c.elements.inclinationDeg = 200; }, /body\.elements\.inclinationDeg must be from 0 to 180/],
    ["elements.ascendingNodeDeg", (c: any) => { c.elements.ascendingNodeDeg = 360; }, /body\.elements\.ascendingNodeDeg must be at least 0 and below 360/],
    ["elements.argumentOfPerihelionDeg", (c: any) => { c.elements.argumentOfPerihelionDeg = "x"; }, /body\.elements\.argumentOfPerihelionDeg is required and must be a finite number/],
    ["neither anomaly", (c: any) => { delete c.elements.meanAnomalyDeg; }, /body\.elements must give exactly one of meanAnomalyDeg and perihelionJdTdb/],
    ["both anomalies", (c: any) => { c.elements.perihelionJdTdb = 2448968.5; }, /body\.elements must give exactly one of meanAnomalyDeg and perihelionJdTdb/],
    ["elements.meanAnomalyDeg", (c: any) => { c.elements.meanAnomalyDeg = 400; }, /body\.elements\.meanAnomalyDeg must be at least 0 and below 360/],
    ["epoch.jd", (c: any) => { c.epoch.jd = Number.NaN; }, /body\.epoch\.jd is required and must be a finite number/],
    ["epoch.timeScale", (c: any) => { c.epoch.timeScale = "GPS"; }, /body\.epoch\.timeScale must be "TDB", "TT" or "UTC"/],
    ["epoch.ttMinusUtcSeconds missing", (c: any) => { delete c.epoch.ttMinusUtcSeconds; }, /body\.epoch\.ttMinusUtcSeconds is required/],
    ["epoch.ttMinusUtcSeconds range", (c: any) => { c.epoch.ttMinusUtcSeconds = 5; }, /body\.epoch\.ttMinusUtcSeconds must be from 32 to 120/],
    ["epoch.ttMinusUtcSeconds on UTC", (c: any) => { c.epoch.timeScale = "UTC"; }, /body\.epoch\.ttMinusUtcSeconds must be absent/],
    ["frame", (c: any) => { c.frame = "equatorial"; }, /body\.frame must be "ecliptic-j2000"/],
    ["source.url", (c: any) => { delete c.source.url; }, /body\.source\.url is required/],
    ["source.solution", (c: any) => { c.source.solution = ""; }, /body\.source\.solution is required/],
    ["radius.km", (c: any) => { c.radius = { km: 0, source: "s" }; }, /body\.radius\.km must be positive/],
    ["radius.source", (c: any) => { c.radius = { km: 1 }; }, /body\.radius\.source is required/],
    ["accuracy.classification", (c: any) => { c.accuracy.classification = "exact"; }, /body\.accuracy\.classification must be "approximate" or "indicative"/],
    ["accuracy.statement", (c: any) => { delete c.accuracy.statement; }, /body\.accuracy\.statement is required/],
    ["accuracy.validFromUtc", (c: any) => { c.accuracy.validFromUtc = "1990"; }, /body\.accuracy\.validFromUtc must be an ISO-8601 UTC time/],
    ["accuracy.validToUtc order", (c: any) => { c.accuracy.validToUtc = "1980-01-01T00:00:00Z"; }, /body\.accuracy\.validToUtc must be after accuracy\.validFromUtc/],
    ["accuracy.limitations", (c: any) => { c.accuracy.limitations = [1]; }, /body\.accuracy\.limitations must be a list of non-empty text/],
    ["marker.color", (c: any) => { c.marker = { color: "red" }; }, /body\.marker\.color must be a colour like #9fe3ff/],
    ["marker.sizePx", (c: any) => { c.marker = { sizePx: 0 }; }, /body\.marker\.sizePx must be above zero/],
  ])("names %s when it is wrong", (_field, change, message) => {
    const bad = with_(change);
    expect(() => parseElementsBodyRecord(bad)).toThrow(ElementsBodyError);
    expect(() => parseElementsBodyRecord(bad)).toThrow(message);
  });
});

describe("a record gives the same positions as the hand-written source it was copied from", () => {
  const generic = buildElementsBody(parseElementsBodyRecord(recordFromBuiltIn()), CENTRE).create();
  const written = createSwiftTuttleTrajectory();
  const dates = [Date.UTC(1990, 0, 1), Date.UTC(1995, 9, 10), Date.UTC(2000, 5, 1), Date.UTC(2026, 7, 13), Date.UTC(2100, 0, 1)];

  it("agrees to 1e-9 relative at five dates (it is in fact identical)", () => {
    for (const t of dates) {
      const a = generic.stateAt(t, "sun").positionKm;
      const b = written.stateAt(t, "sun").positionKm;
      expect(distance(a, b) / Math.hypot(...b)).toBeLessThan(1e-9);
    }
  });

  it("puts the epoch and the periapsis where the hand-written source does", () => {
    const built = buildElementsBody(parseElementsBodyRecord(recordFromBuiltIn()), CENTRE);
    expect(built.epochUtcMs).toBe(SWIFT_TUTTLE_EPOCH_UTC_MS);
    expect(built.sampling.periapsisUtcMs).toBe(SWIFT_TUTTLE_SAMPLING.periapsisUtcMs);
    expect(Math.abs(built.sampling.periodMs - SWIFT_TUTTLE_SAMPLING.periodMs)).toBeLessThan(1);
  });

  it("takes a perihelion time in place of the mean anomaly and reaches the same place", () => {
    const base = recordFromBuiltIn() as Record<string, any>;
    const alt = structuredClone(base);
    delete alt.elements.meanAnomalyDeg;
    alt.elements.perihelionJdTdb = SWIFT_TUTTLE_ELEMENTS.perihelionJdTdb;
    const t = Date.UTC(2026, 7, 13);
    const a = buildElementsBody(parseElementsBodyRecord(alt), CENTRE).create().stateAt(t, "sun").positionKm;
    const b = written.stateAt(t, "sun").positionKm;
    // The published perihelion time and mean anomaly agree to the rounding SBDB prints (the two-body period is also the model's own).
    expect(distance(a, b) / Math.hypot(...b)).toBeLessThan(1e-4);
  });
});

describe("the parent a settings file defines, against JPL Horizons", () => {
  const record = parseElementsBodyRecord((geminids as { parentElements: unknown }).parentElements, "parentElements");
  const body = buildElementsBody(record, CENTRE);
  const trajectory = body.create();
  const rows = fixture.samples.map((sample) => {
    const model = trajectory.stateAt(sample.utcMs, "sun").positionKm;
    const range = Math.hypot(...sample.positionKm);
    return { label: sample.label, utcMs: sample.utcMs, errorKm: distance(model, sample.positionKm), fraction: distance(model, sample.positionKm) / range, rangeAu: range / AU_KM };
  });
  const worstKm = rows.reduce((a, b) => (b.errorKm > a.errorKm ? b : a));
  const worstFraction = rows.reduce((a, b) => (b.fraction > a.fraction ? b : a));

  it("archives the raw responses beside the fixture and names the solution", () => {
    const [, sbdbText, horizonsText] = source.split(/^==== QUERY .*====\n/m);
    const sbdb = JSON.parse(sbdbText) as { object: { fullname: string }; orbit: { epoch: string; sb_used: string; elements: { name: string; value: string }[] } };
    const element = (name: string): number => Number(sbdb.orbit.elements.find((candidate) => candidate.name === name)!.value);
    expect(sbdb.orbit.sb_used).toBe("SB441-N16");
    expect(record.source.solution).toContain("SB441-N16");
    expect(Number(sbdb.orbit.epoch)).toBe(record.epoch.jd);
    expect(element("a")).toBe(record.elements.semiMajorAxisAu);
    expect(element("e")).toBe(record.elements.eccentricity);
    expect(element("i")).toBe(record.elements.inclinationDeg);
    expect(element("om")).toBe(record.elements.ascendingNodeDeg);
    expect(element("w")).toBe(record.elements.argumentOfPerihelionDeg);
    expect(element("ma")).toBe(record.elements.meanAnomalyDeg);
    expect(horizonsText).toContain("Target body name: 3200 Phaethon (1983 TB)");
    expect(horizonsText).toContain("Center body name: Sun (10)");
    expect(horizonsText).toMatch(/RAD=\s*3\.125/);
    expect(record.radius?.km).toBe(3.125);
    expect(fixture.rawFile).toBe("phaethon-horizons-source.txt");
    expect(fixture.center).toMatch(/500@10/);
  });

  it("converts the TDB epoch to UTC with the stated TT minus UTC (69.184 s in 2026)", () => {
    expect(record.epoch.ttMinusUtcSeconds).toBe(69.184);
    expect(body.epochUtcMs).toBe(Math.round((2461200.5 - 2440587.5) * 86_400_000) - 69_184);
  });

  it("is compared at eight dates spanning several orbits about the December 2026 peak", () => {
    expect(rows).toHaveLength(8);
    const periodDays = body.sampling.periodMs / 86_400_000;
    expect((rows[7].utcMs - rows[0].utcMs) / 86_400_000 / periodDays).toBeGreaterThan(8);
    expect(rows.some((row) => /^2026-Dec-14/.test(row.label))).toBe(true);
    // O-024 T-092 extended the validity back to the Showers year's start, from the second comparison (tests/showersYearHorizons.test.ts).
    expect(record.accuracy.validFromUtc).toBe("2019-09-21T00:00:00Z");
    expect(record.accuracy.validToUtc).toBe("2032-12-14T00:00:00Z");
  });

  it("matches Horizons at its own epoch to within a few hundred km (the time-scale conversion is right)", () => {
    const atEpoch = rows.find((row) => /^2026-Jun-09/.test(row.label))!;
    expect(atEpoch.errorKm).toBeLessThan(500);
  });

  it("has a maximum Sun-centred error of 935,344 km (2.18% of its distance) at 2020-12-14, which the accuracy statement records", () => {
    expect(worstKm.label).toMatch(/^2020-Dec-14/);
    expect(Math.ceil(worstKm.errorKm)).toBe(935_344);
    expect(worstFraction.label).toMatch(/^2020-Dec-14/);
    expect(worstFraction.fraction).toBeCloseTo(0.0218, 4);
    expect(record.accuracy.statement).toContain("935,344 km");
    expect(record.accuracy.statement).toContain("2.18%");
  });

  it("classifies the position as indicative, not approximate, and the record says so", () => {
    expect(worstFraction.fraction).toBeGreaterThan(APPROXIMATE_LIMIT_FRACTION);
    expect(worstFraction.fraction).toBeLessThan(INDICATIVE_LIMIT_FRACTION);
    expect(classifyPositionError(worstFraction.fraction)).toBe("indicative");
    expect(record.accuracy.classification).toBe("indicative");
    expect(classifyPositionError(0.005)).toBe("approximate");
    expect(classifyPositionError(0.2)).toBeNull();
  });

  it("states two-body, no perturbations, no non-gravitational forces and names the small perihelion as the weak point", () => {
    const text = `${record.accuracy.statement} ${body.definition.accuracy.orientationLimitations.join(" ")}`;
    expect(text).toMatch(/two-body/);
    expect(text).toMatch(/no planetary perturbations and no non-gravitational forces/);
    expect(text).toMatch(/small perihelion distance \(q about 0\.14 AU\) is the weak point/);
  });

  it("reaches the published perihelion and aphelion distances", () => {
    const sbdb = JSON.parse(source.split(/^==== QUERY .*====\n/m)[1]) as { orbit: { elements: { name: string; value: string }[] } };
    const element = (name: string): number => Number(sbdb.orbit.elements.find((candidate) => candidate.name === name)!.value);
    const perihelion = trajectory.stateAt(body.sampling.periapsisUtcMs, "sun").positionKm;
    expect(Math.hypot(...perihelion) / AU_KM).toBeCloseTo(element("q"), 5);
    const aphelion = trajectory.stateAt(Math.round(body.sampling.periapsisUtcMs + body.sampling.periodMs / 2), "sun").positionKm;
    expect(Math.hypot(...aphelion) / AU_KM).toBeCloseTo(element("ad"), 4);
  });
});

describe("a per-experience catalogue", () => {
  const record = parseElementsBodyRecord((geminids as { parentElements: unknown }).parentElements, "parentElements");

  it("holds the built-in bodies plus the record's, and leaves the built-in catalogue unchanged", () => {
    const before = catalogue.ids().join(",");
    const extended = extendCatalogue(catalogue, [record]);
    expect(extended.has(record.id)).toBe(true);
    expect(catalogue.has(record.id)).toBe(false);
    expect(catalogue.ids().join(",")).toBe(before);
    expect(extended.ids().slice(0, catalogue.ids().length)).toEqual(catalogue.ids());
    const asset = extended.get(record.id);
    expect(asset.definition.parentId).toBe("sun");
    expect(asset.visual.kind).toBe("marker");
    expect(asset.visual.material.color).toBe(record.marker.color);
    expect(asset.visual.marker?.sizePx).toBe(record.marker.sizePx);
    expect(asset.source?.body).toBe(record.id);
  });

  it("takes the marker colour and size from the record", () => {
    const styled = parseElementsBodyRecord({ ...structuredClone(record), marker: { color: "#ff8800", sizePx: 11 } });
    const asset = extendCatalogue(catalogue, [styled]).get(styled.id);
    expect(asset.visual.material.color).toBe("#ff8800");
    expect(asset.visual.marker?.sizePx).toBe(11);
  });

  it("returns the base catalogue for no records and refuses an id the base already holds", () => {
    expect(extendCatalogue(catalogue, [])).toBe(catalogue);
    expect(() => extendCatalogue(catalogue, [{ ...record, id: "earth" }])).toThrow(/duplicate body id "earth"/);
  });
});

describe("the name check", () => {
  const files = import.meta.glob("../../astraeus/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

  it("finds the asteroid's name nowhere in src: it exists only in its settings file", () => {
    const named = Object.entries(files).filter(([, text]) => /phaethon|geminid/i.test(text)).map(([path]) => path);
    expect(named).toEqual([]);
  });

  it("finds no body or shower name in the generic builder", () => {
    expect(files["../../astraeus/src/core/elementsBody.ts"]).not.toMatch(/phaethon|swift|tuttle|109P|perseid|geminid/i);
  });
});
