import { describe, expect, it } from "vitest";
import horizons from "./fixtures/moon-orbits-horizons.json";
import io from "../data/orbits/io.json";
import europa from "../data/orbits/europa.json";
import ganymede from "../data/orbits/ganymede.json";
import callisto from "../data/orbits/callisto.json";
import mimas from "../data/orbits/mimas.json";
import enceladus from "../data/orbits/enceladus.json";
import tethys from "../data/orbits/tethys.json";
import dione from "../data/orbits/dione.json";
import rhea from "../data/orbits/rhea.json";
import titan from "../data/orbits/titan.json";
import iapetus from "../data/orbits/iapetus.json";
import triton from "../data/orbits/triton.json";
import charon from "../data/orbits/charon.json";
import pluto from "../data/orbits/pluto.json";
import { IO_MAX_ERROR_KM, createIoTrajectory } from "../src/core/bodies/io";
import { createMeanElementTrajectory, elementsInPoleFrame, epochUtcMsOf, siderealPeriodDaysFor, type MeanElementRecord } from "../src/core/satelliteMeanElements";

// The bodies this Task measures. Each file in data/orbits/ is the saved source; the Horizons fixture is the saved comparison.
const RECORDS = [io, europa, ganymede, callisto, mimas, enceladus, tethys, dione, rhea, titan, iapetus, triton, charon, pluto] as unknown as readonly (MeanElementRecord & {
  label: string; naifId: number; kind: string;
  source: { url: string; accessed: string; licenceNote: string };
  bodyPhysical: { meanRadiusKm: number };
  parentBody: { gmKm3S2: number; source: string };
  horizons: { command: string; centre: string };
  rotation: { model: string; poleRaDeg: { constant: number; perCentury: number }; poleDecDeg: { constant: number; perCentury: number }; primeMeridianDeg: { constant: number; perDay: number } };
  accuracy: {
    maxErrorKm: number; errorAtEpochKm: number; bodyDiameterKm: number; maxErrorDiameters: number; semiMajorAxisKm: number; maxErrorFractionOfSemiMajorAxis: number;
    class: string; knownLimitations: string[]; sampleCount: number;
    diagnosticPhase?: { meanAnomalyShiftDeg: number; epochErrorKmAfterShift: number; maxErrorKmAfterShift: number };
  };
})[];

interface HorizonsSample { jdUtc: number; utcMs: number; positionKm: number[] }
interface HorizonsBody { command: string; target: string; ephemerisSource: string; centre: string; six: HorizonsSample[]; dense: HorizonsSample[] }
const bodies = horizons.bodies as unknown as Record<string, HorizonsBody>;

const rawHorizons = import.meta.glob("./fixtures/o019-t078/o019-t078-horizons-*/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const rawKernel = Object.entries(import.meta.glob("./fixtures/o019-t078/o019-t078-iau-rotation-*/pck00011.tpc", { query: "?raw", import: "default", eager: true }))[0][1] as string;
const rawSats = Object.entries(import.meta.glob("./fixtures/o019-t078/o019-t078-sats-elem-*/sats-elem.html", { query: "?raw", import: "default", eager: true }))[0][1] as string;

const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const classify = (errorKm: number, diameterKm: number, semiMajorAxisKm: number) =>
  errorKm <= diameterKm ? "within one diameter" : errorKm <= 0.1 * semiMajorAxisKm ? "approximate demonstration" : "not usable as published";

function measure(record: MeanElementRecord, options = record.model) {
  const trajectory = createMeanElementTrajectory(record, options);
  const entry = bodies[record.id];
  const errors = [...entry.six, ...entry.dense].map((sample) => distance(trajectory.stateAt(sample.utcMs).positionKm, sample.positionKm));
  return { max: Math.max(...errors), atEpoch: distance(trajectory.stateAt(entry.six[2].utcMs).positionKm, entry.six[2].positionKm) };
}

function parseRawVectors(text: string): { jdUtc: number; positionKm: number[] }[] {
  const body = text.slice(text.indexOf("$$SOE") + 5, text.indexOf("$$EOE"));
  return body.trim().split("\n").map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    return { jdUtc: Number(cells[0]), positionKm: [Number(cells[2]), Number(cells[3]), Number(cells[4])] };
  });
}

describe("moon and Pluto mean-element orbits (T-078)", () => {
  it("has one saved source per body, with citation, access date, licence note and the parent's GM", () => {
    expect(RECORDS.map((record) => record.id)).toEqual(["io", "europa", "ganymede", "callisto", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon", "pluto"]);
    for (const record of RECORDS) {
      expect(record.source.url, record.id).toMatch(/^https:\/\/ssd(-api)?\.jpl\.nasa\.gov\//);
      expect(record.source.accessed, record.id).toBe("2026-10-17");
      expect(record.source.licenceNote.length, record.id).toBeGreaterThan(20);
      expect(record.parentBody.gmKm3S2, record.id).toBeGreaterThan(0);
      expect(record.parentBody.source.length, record.id).toBeGreaterThan(20);
      expect(record.bodyPhysical.meanRadiusKm, record.id).toBeGreaterThan(0);
      expect(record.accuracy.knownLimitations.length, record.id).toBeGreaterThan(0);
    }
  });

  it("holds the table's numbers exactly as the saved JPL page prints them", () => {
    for (const record of RECORDS.filter((r) => r.kind === "moon")) {
      expect(rawSats.includes(`<td>${record.label}</td>`), record.id).toBe(true);
      const start = rawSats.indexOf(`<td>${record.label}</td>`);
      const cells = [...rawSats.slice(start, start + 2500).matchAll(/<td[^>]*>\s*([^<]*?)\s*<\/td>/g)].map((m) => m[1]);
      // cells: name, code, (links), epoch, a, e, w, M, i, node, P, ...
      const epochAt = cells.findIndex((cell) => cell === "2000-01-01.5");
      const [a, e, w, m, i, node, p] = cells.slice(epochAt + 1, epochAt + 8).map(Number);
      expect(record.elements.semiMajorAxisKm, record.id).toBe(a);
      expect(record.elements.eccentricity, record.id).toBe(e);
      expect(record.elements.argumentOfPeriapsisDeg, record.id).toBe(w);
      expect(record.elements.meanAnomalyDeg, record.id).toBe(m);
      expect(record.elements.inclinationDeg, record.id).toBe(i);
      expect(record.elements.nodeDeg, record.id).toBe(node);
      expect(record.elements.periodDays, record.id).toBe(p);
    }
  });

  it("keeps the Horizons comparison data equal to the raw responses it was parsed from", () => {
    for (const record of RECORDS) {
      const entry = bodies[record.id];
      expect(entry.command, record.id).toBe(record.horizons.command);
      expect(entry.centre, record.id).toMatch(record.id === "pluto" ? /Sun/ : new RegExp(record.parent, "i"));
      const rawSix = Object.entries(rawHorizons).find(([path]) => path.endsWith(record.id === "pluto" ? "/pluto-sun.txt" : `/${record.id}-six.txt`))![1];
      const rawDense = record.id === "pluto" ? rawSix : Object.entries(rawHorizons).find(([path]) => path.endsWith(`/${record.id}-dense.txt`))![1];
      const six = parseRawVectors(rawSix);
      const dense = parseRawVectors(rawDense);
      const expectedSix = record.id === "pluto" ? six.filter((s) => [2440423.5, 2446217.5, 2451545.0, 2455378.5, 2460310.5, 2462653.5].includes(s.jdUtc)) : six;
      expect(entry.six.map((s) => s.jdUtc), record.id).toEqual(expectedSix.map((s) => s.jdUtc));
      expect(entry.six.map((s) => s.positionKm), record.id).toEqual(expectedSix.map((s) => s.positionKm));
      expect(entry.dense.map((s) => s.positionKm), record.id).toEqual(dense.map((s) => s.positionKm));
      expect(entry.six.length + 0, record.id).toBe(6);
      expect(record.accuracy.sampleCount, record.id).toBe(record.id === "pluto" ? entry.dense.length : 6 + entry.dense.length);
    }
  });

  it("measures every body against Horizons and the recorded figures are the measured ones", () => {
    for (const record of RECORDS) {
      const { max, atEpoch } = measure(record);
      const a = record.accuracy;
      expect(a.maxErrorKm, record.id).toBe(Math.ceil(max));
      expect(a.errorAtEpochKm, record.id).toBe(Math.ceil(atEpoch));
      expect(a.bodyDiameterKm, record.id).toBeCloseTo(record.bodyPhysical.meanRadiusKm * 2, 6);
      expect(a.semiMajorAxisKm, record.id).toBe(record.elements.semiMajorAxisKm);
      expect(a.maxErrorDiameters, record.id).toBeCloseTo(max / a.bodyDiameterKm, 2);
      expect(a.maxErrorFractionOfSemiMajorAxis, record.id).toBeCloseTo(max / a.semiMajorAxisKm, 5);
      expect(a.class, record.id).toBe(classify(max, a.bodyDiameterKm, a.semiMajorAxisKm));
    }
  });

  it("classes: Charon within a diameter; the Jovian moons, Triton and Pluto approximate; the Saturn rows do not reproduce Horizons", () => {
    const byId = Object.fromEntries(RECORDS.map((record) => [record.id, record.accuracy.class]));
    expect(byId.charon).toBe("within one diameter");
    for (const id of ["io", "europa", "ganymede", "callisto", "triton", "pluto"]) expect(byId[id], id).toBe("approximate demonstration");
    for (const id of ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"]) expect(byId[id], id).toBe("not usable as published");
  });

  it("finds the Saturn rows off at the epoch itself, by a phase and not by a growing drift", () => {
    for (const record of RECORDS.filter((r) => r.parent === "saturn")) {
      expect(record.accuracy.errorAtEpochKm / record.elements.semiMajorAxisKm, record.id).toBeGreaterThan(0.05);
      const diagnostic = record.accuracy.diagnosticPhase!;
      const shifted = measure(record, { ...record.model, meanAnomalyShiftDeg: diagnostic.meanAnomalyShiftDeg });
      expect(Math.ceil(shifted.max), record.id).toBe(diagnostic.maxErrorKmAfterShift);
      expect(Math.ceil(shifted.atEpoch), record.id).toBe(diagnostic.epochErrorKmAfterShift);
    }
  });

  it("re-measures Io on the same dates: the shipped definition keeps its figure, the generic path is the better one", () => {
    const shipped = createIoTrajectory();
    const entry = bodies.io;
    const worst = Math.max(...entry.six.map((sample) => distance(shipped.stateAt(sample.utcMs).positionKm, sample.positionKm)));
    expect(Math.ceil(worst)).toBe(IO_MAX_ERROR_KM);
    const six = entry.six.map((sample) => distance(createMeanElementTrajectory(io as unknown as MeanElementRecord).stateAt(sample.utcMs).positionKm, sample.positionKm));
    expect(Math.max(...six)).toBeLessThan(worst);
    // Io's own epoch is the same instant the shipped definition uses (J2000 TDB with TT-UTC 64.184 s).
    expect(epochUtcMsOf(io as unknown as MeanElementRecord)).toBe(Date.UTC(2000, 0, 1, 12) - 64_184);
  });

  it("takes the sidereal period from the IAU rate for the synchronous rotators", () => {
    for (const record of RECORDS.filter((r) => r.kind === "moon")) {
      const period = siderealPeriodDaysFor(record, "iau-rate");
      expect(period, record.id).toBeCloseTo(360 / Math.abs(record.rotation.primeMeridianDeg.perDay), 12);
      // within 1% of the table's own P for every row (Europa differs by 0.7%)
      expect(Math.abs(period / record.elements.periodDays - 1), record.id).toBeLessThan(0.01);
    }
  });

  it("re-expresses elements given in a pole-defined plane in EQJ (made-up planes first)", () => {
    // Pole at the EQJ pole: the plane is the equator, node reference on RA 90 degrees.
    const flat = elementsInPoleFrame({ raDeg: 0, decDeg: 90 }, { inclinationDeg: 10, nodeDeg: 0, argumentOfPeriapsisDeg: 25 });
    expect(flat.inclinationDeg).toBeCloseTo(10, 9);
    expect(flat.raanDeg).toBeCloseTo(90, 9);
    expect(flat.argumentOfPeriapsisDeg).toBeCloseTo(25, 9);
    // Zero local inclination: the orbit lies in the plane; the pole fixes inclination 90 - Dec and node RA + 90 (Io's construction).
    const level = elementsInPoleFrame({ raDeg: 268.1, decDeg: 64.5 }, { inclinationDeg: 0, nodeDeg: 0, argumentOfPeriapsisDeg: 49.1 });
    expect(level.inclinationDeg).toBeCloseTo(25.5, 9);
    expect(level.raanDeg).toBeCloseTo((268.1 + 90) % 360, 9);
    expect(level.argumentOfPeriapsisDeg).toBeCloseTo(49.1, 9);
    // A retrograde orbit stays retrograde: inclination above 90.
    expect(elementsInPoleFrame({ raDeg: 0, decDeg: 90 }, { inclinationDeg: 157, nodeDeg: 10, argumentOfPeriapsisDeg: 0 }).inclinationDeg).toBeCloseTo(157, 9);
    // Degenerate: equatorial orbit in the equator keeps its in-plane angle.
    const degenerate = elementsInPoleFrame({ raDeg: 0, decDeg: 90 }, { inclinationDeg: 0, nodeDeg: 0, argumentOfPeriapsisDeg: 30 });
    expect((degenerate.raanDeg + degenerate.argumentOfPeriapsisDeg) % 360).toBeCloseTo((90 + 30) % 360, 9);
  });

  it("records the IAU rotation model of every body as the saved NAIF kernel prints it", () => {
    const last = (name: string): number[] => {
      const matches = [...rawKernel.matchAll(new RegExp(`${name}\\s*=\\s*\\(([^)]*)\\)`, "g"))];
      return matches[matches.length - 1][1].trim().split(/\s+/).map((token) => Number(token.replace(/[dD]/, "e")));
    };
    for (const record of RECORDS) {
      const naif = record.naifId;
      const ra = last(`BODY${naif}_POLE_RA`);
      const dec = last(`BODY${naif}_POLE_DEC`);
      const pm = last(`BODY${naif}_PM`);
      expect(record.rotation.poleRaDeg, record.id).toEqual({ constant: ra[0], perCentury: ra[1] });
      expect(record.rotation.poleDecDeg, record.id).toEqual({ constant: dec[0], perCentury: dec[1] });
      expect(record.rotation.primeMeridianDeg, record.id).toEqual({ constant: pm[0], perDay: pm[1] });
      expect(record.rotation.model, record.id).toContain("Archinal");
    }
  });
});
