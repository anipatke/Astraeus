import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GM } from "@lizard-isana/orb/kepler";
import { experienceWithGroups, groupsOf } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { SimulationClock } from "../src/core/clock";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { trueScale } from "../src/core/scalePolicy";
import { AstraeusShell } from "../src/shell/AstraeusShell";
import { findCameraPreset } from "../src/shell/objectModel";
import { LISTED_LOOK, LISTED_MEMBER_COUNT, syntheticListedDefinition, syntheticListedLayer } from "../src/synthetic/syntheticListedDefinition";
import { placementAbout } from "./scenePlacement";
import { FRAME_BUDGET_MS, FrameStats } from "../src/app/frameStats";
import { createListedOrbitGroup, type ListedMember, type ListedOrbitGroupInput } from "../src/core/listedOrbitGroup";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { GroupBoundsError, GroupCountError, GroupElementsError } from "../src/core/pointGroup";
import { createProvenance } from "../src/core/provenance";
import { createTwoBodyTrajectory } from "../src/core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";

const adapter = createOrbTwoBodyAdapter();
const REFERENCE = Date.UTC(2027, 7, 13);
const DAY = 86_400_000;
const RADIANS = Math.PI / 180;
const AU_KM = 149_597_870.7;

const provenance = createProvenance({
  sourceType: "observed",
  sources: ["made-up list for contract tests"],
  accuracy: "none; invented orbits",
  notes: "Invented for contract tests.",
});

// A tiny deterministic generator for made-up members, independent of the code under test.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function madeUpMembers(count: number, seed = 5): ListedMember[] {
  const r = lcg(seed);
  return Array.from({ length: count }, (_, k) => ({
    recordId: `rec-${k}`,
    epochUtcMs: Date.UTC(2010 + (k % 10), k % 12, 1 + (k % 27)),
    elements: {
      semiMajorAxisKm: (2 + 20 * r()) * AU_KM,
      eccentricity: 0.3 + 0.65 * r(),
      inclinationDeg: 180 * r(),
      raanDeg: 360 * r(),
      argumentOfPeriapsisDeg: 360 * r(),
    },
  }));
}

const baseInput = (members: ListedMember[], extra: Partial<ListedOrbitGroupInput> = {}): ListedOrbitGroupInput => ({
  id: "listed-test",
  center: "sun",
  plane: "ecliptic-j2000",
  members,
  phase: { referenceUtcMs: REFERENCE, seed: 11 },
  provenance,
  ...extra,
});

// Independent Kepler solver (bisection) so the oracle shares no code with the implementation.
function trueAnomalyDeg(meanDeg: number, e: number): number {
  const m = ((meanDeg % 360) + 360) % 360 * RADIANS;
  let lo = 0;
  let hi = 2 * Math.PI;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (mid - e * Math.sin(mid) < m) lo = mid; else hi = mid;
  }
  const E = (lo + hi) / 2;
  return (2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)) / RADIANS + 360) % 360;
}

function fill(group: { count: number; fillPositionsKm(t: number, out: Float64Array): void }, t: number): Float64Array {
  const out = new Float64Array(3 * group.count);
  group.fillPositionsKm(t, out);
  return out;
}

describe("listed orbit group (T-052 Done When 1)", () => {
  const members = madeUpMembers(60);
  const group = createListedOrbitGroup(baseInput(members), adapter);

  it("declares the group contract, and reads each member's record id from its State", () => {
    expect(group).toMatchObject({ id: "listed-test", count: 60, center: "sun", frame: "EQJ" });
    const state = group.stateAt(7, REFERENCE + DAY);
    expect(state.body).toBe("listed-test:rec-7");
    expect(group.recordIdAt(7)).toBe("rec-7");
    expect(state).toMatchObject({ center: "sun", frame: "EQJ", orientation: null });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("puts every member where a single-member two-body trajectory with the same elements puts it, to 1e-6 km", () => {
    for (const offsetDays of [0, 37, -200, 1500]) {
      const t = REFERENCE + offsetDays * DAY;
      const out = fill(group, t);
      members.forEach((member, i) => {
        const oracle = createTwoBodyTrajectory({
          body: `oracle-${i}`,
          plane: "ecliptic-j2000",
          epochUtcMs: REFERENCE,
          elements: { ...member.elements, trueAnomalyDeg: trueAnomalyDeg(group.meanAnomalyDegAt(i), member.elements.eccentricity) },
        }, adapter).stateAt(t).positionKm;
        // 1e-6 km, or 1e-13 of the position (the Kepler solve is good to about 4e-14 rad for e near 0.95, which times a Sun-scale distance is a few km·1e-6) when that is larger (a Sun-centred position is ~1e9 km,
        // where one ulp is already ~5e-7 km); the Earth-centred test below holds the plain 1e-6 km.
        const tolerance = Math.max(1e-6, 1e-13 * Math.hypot(oracle[0], oracle[1], oracle[2]));
        for (let k = 0; k < 3; k++) expect(Math.abs(out[3 * i + k] - oracle[k])).toBeLessThan(tolerance);
        if (i % 20 === 0) expect([...group.stateAt(i, t).positionKm]).toEqual([...out.subarray(3 * i, 3 * i + 3)]);
      });
    }
  });

  it("agrees to the plain 1e-6 km about a planet, where positions are small", () => {
    const r = lcg(2);
    const near: ListedMember[] = Array.from({ length: 40 }, (_, k) => ({
      recordId: `n-${k}`,
      epochUtcMs: REFERENCE - k * DAY,
      elements: { semiMajorAxisKm: 8000 + 20_000 * r(), eccentricity: 0.4 * r(), inclinationDeg: 180 * r(), raanDeg: 360 * r(), argumentOfPeriapsisDeg: 360 * r() },
    }));
    const planetGroup = createListedOrbitGroup(baseInput(near, { center: "earth", plane: "EQJ" }), adapter);
    const t = REFERENCE + 3 * 3_600_000;
    const out = fill(planetGroup, t);
    near.forEach((member, i) => {
      const oracle = createTwoBodyTrajectory({
        body: `o-${i}`, center: "earth", plane: "EQJ", epochUtcMs: REFERENCE,
        elements: { ...member.elements, trueAnomalyDeg: trueAnomalyDeg(planetGroup.meanAnomalyDegAt(i), member.elements.eccentricity) },
      }, adapter).stateAt(t).positionKm;
      for (let k = 0; k < 3; k++) expect(Math.abs(out[3 * i + k] - oracle[k])).toBeLessThan(1e-6);
    });
  });

  it("keeps the record's epoch as the record's time: it does not move the dot", () => {
    const shifted = members.map((m) => ({ ...m, epochUtcMs: m.epochUtcMs + 123 * DAY }));
    const other = createListedOrbitGroup(baseInput(shifted), adapter);
    expect([...fill(other, REFERENCE + 5 * DAY)]).toEqual([...fill(group, REFERENCE + 5 * DAY)]);
  });

  it("enforces bounds and the fill buffer size", () => {
    const bounded = createListedOrbitGroup(baseInput(members, { bounds: { startUtcMs: REFERENCE, endUtcMs: REFERENCE + DAY } }), adapter);
    expect(() => bounded.fillPositionsKm(REFERENCE + 2 * DAY, new Float64Array(180))).toThrow(GroupBoundsError);
    expect(() => bounded.stateAt(0, REFERENCE - 1)).toThrow(GroupBoundsError);
    expect(() => group.fillPositionsKm(REFERENCE, new Float64Array(5))).toThrow(/fill buffer/);
    expect(() => group.stateAt(60, REFERENCE)).toThrow(RangeError);
  });
});

describe("listed orbit group validation (T-052 Done When 2)", () => {
  const one = madeUpMembers(3);
  const withMember = (index: number, patch: (m: ListedMember) => ListedMember) =>
    one.map((m, i) => (i === index ? patch(m) : m));
  const make = (list: ListedMember[]) => () => createListedOrbitGroup(baseInput(list), adapter);

  it("names the member and the field for non-finite elements", () => {
    for (const key of ["semiMajorAxisKm", "eccentricity", "inclinationDeg", "raanDeg", "argumentOfPeriapsisDeg"] as const) {
      for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
        const list = withMember(1, (m) => ({ ...m, elements: { ...m.elements, [key]: bad } }));
        expect(make(list)).toThrow(GroupElementsError);
        expect(make(list)).toThrow(new RegExp(`member 1 \\(record "rec-1"\\): ${key} must be finite`));
      }
    }
  });

  it("rejects unbound, hyperbolic and out-of-range elements, naming the member", () => {
    const e1 = withMember(2, (m) => ({ ...m, elements: { ...m.elements, eccentricity: 1 } }));
    expect(make(e1)).toThrow(/member 2 \(record "rec-2"\): eccentricity must be at least 0 and below 1/);
    const neg = withMember(0, (m) => ({ ...m, elements: { ...m.elements, eccentricity: -0.1 } }));
    expect(make(neg)).toThrow(/member 0 \(record "rec-0"\): eccentricity/);
    const sentinel = withMember(0, (m) => ({ ...m, elements: { ...m.elements, semiMajorAxisKm: -5 * AU_KM } }));
    expect(make(sentinel)).toThrow(/member 0 \(record "rec-0"\): semiMajorAxisKm must be positive/);
    const incl = withMember(1, (m) => ({ ...m, elements: { ...m.elements, inclinationDeg: 181 } }));
    expect(make(incl)).toThrow(/member 1 \(record "rec-1"\): inclinationDeg/);
  });

  it("rejects an empty list, a duplicate record id, a blank record id and a bad epoch", () => {
    expect(make([])).toThrow(GroupCountError);
    expect(make([])).toThrow(/list is empty/);
    expect(make([one[0], { ...one[1], recordId: "rec-0" }])).toThrow(/member 1 \(record "rec-0"\): duplicate recordId/);
    expect(make(withMember(2, (m) => ({ ...m, recordId: "" })))).toThrow(/member 2 .*recordId must be a non-empty string/);
    expect(make(withMember(0, (m) => ({ ...m, epochUtcMs: 1.5 })))).toThrow(/member 0 \(record "rec-0"\): epochUtcMs/);
  });

  it("rejects a bad phase", () => {
    const bad = (phase: ListedOrbitGroupInput["phase"]) => () => createListedOrbitGroup(baseInput(one, { phase }), adapter);
    expect(bad({ referenceUtcMs: REFERENCE, seed: -1 })).toThrow(GroupElementsError);
    const around = createTwoBodyTrajectory({ body: "p", plane: "ecliptic-j2000", epochUtcMs: REFERENCE, elements: { semiMajorAxisKm: 3 * AU_KM, eccentricity: 0.5, inclinationDeg: 10, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 } }, adapter);
    expect(bad({ referenceUtcMs: REFERENCE, concentration: { around, fraction: 1.5, widthDeg: 10 } })).toThrow(/fraction/);
    expect(bad({ referenceUtcMs: REFERENCE, concentration: { around, fraction: 0.5, widthDeg: 0 } })).toThrow(/widthDeg/);
  });
});

describe("listed orbit group phase rule (T-052 Done When 3)", () => {
  const members = madeUpMembers(400, 9);

  it("spreads mean anomalies evenly and deterministically, whatever the list order", () => {
    const a = createListedOrbitGroup(baseInput(members), adapter);
    const b = createListedOrbitGroup(baseInput(members), adapter);
    const anomalies = Array.from({ length: a.count }, (_, i) => a.meanAnomalyDegAt(i));
    expect(anomalies).toEqual(Array.from({ length: b.count }, (_, i) => b.meanAnomalyDegAt(i)));
    const sorted = [...anomalies].sort((x, y) => x - y);
    sorted.forEach((m, k) => expect(m).toBeCloseTo((360 * (k + 0.5)) / 400, 9));
    // A different seed deals the same slots to different members.
    const c = createListedOrbitGroup(baseInput(members, { phase: { referenceUtcMs: REFERENCE, seed: 12 } }), adapter);
    expect(Array.from({ length: c.count }, (_, i) => c.meanAnomalyDegAt(i))).not.toEqual(anomalies);
    // Neighbours in the list are not neighbours on the orbit.
    const adjacent = anomalies.slice(1).filter((m, i) => Math.abs(m - anomalies[i]) < 3).length;
    expect(adjacent).toBeLessThan(20);
  });

  it("draws each member on its own measured ellipse at five times (relative distance < 1e-6)", () => {
    const group = createListedOrbitGroup(baseInput(members, { plane: "EQJ" }), adapter);
    for (const offsetDays of [0, 11, 160, -420, 3000]) {
      const out = fill(group, REFERENCE + offsetDays * DAY);
      members.forEach((member, i) => {
        const { semiMajorAxisKm: a, eccentricity: e } = member.elements;
        const [O, inc, w] = [member.elements.raanDeg, member.elements.inclinationDeg, member.elements.argumentOfPeriapsisDeg].map((d) => d * RADIANS);
        // Into the orbit plane: undo Rz(O), then Rx(inc), then Rz(w).
        let [x, y, z] = [out[3 * i], out[3 * i + 1], out[3 * i + 2]];
        [x, y] = [Math.cos(O) * x + Math.sin(O) * y, -Math.sin(O) * x + Math.cos(O) * y];
        [y, z] = [Math.cos(inc) * y + Math.sin(inc) * z, -Math.sin(inc) * y + Math.cos(inc) * z];
        [x, y] = [Math.cos(w) * x + Math.sin(w) * y, -Math.sin(w) * x + Math.cos(w) * y];
        const b = a * Math.sqrt(1 - e * e);
        const residual = Math.hypot((x + a * e) / a, y / b) - 1;
        expect(Math.abs(residual)).toBeLessThan(1e-6);
        expect(Math.abs(z) / a).toBeLessThan(1e-6);
      });
    }
  });

  it("marks the position along each orbit illustrative and the elements as listed, keeping the sources", () => {
    const group = createListedOrbitGroup(baseInput(members), adapter);
    expect(group.provenance.sourceType).toBe("illustrative");
    expect(group.provenance.sources).toEqual(["made-up list for contract tests"]);
    expect(group.provenance.accuracy).toMatch(/Orbit elements are as listed \(observed\); the position along each orbit is illustrative/);
    expect(group.provenance.notes).toMatch(/position along the orbit.*illustrative.*two-body/s);
    expect(group.provenance.notes).not.toMatch(/model, not a measurement/);
  });

  describe("with a concentration near a reference body", () => {
    const parentElements = { semiMajorAxisKm: 26.1 * AU_KM, eccentricity: 0.96, inclinationDeg: 113, raanDeg: 139, argumentOfPeriapsisDeg: 153 };
    const parentEpoch = REFERENCE - 700 * DAY;
    const parent = createTwoBodyTrajectory({
      body: "made-up-parent",
      plane: "ecliptic-j2000",
      epochUtcMs: parentEpoch,
      elements: { ...parentElements, trueAnomalyDeg: 40 },
    }, adapter);
    // Independent expected mean anomaly: M at the epoch from the true anomaly, advanced by the mean motion.
    const e = parentElements.eccentricity;
    const E0 = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(20 * RADIANS), Math.sqrt(1 + e) * Math.cos(20 * RADIANS));
    const n = Math.sqrt(GM.sun / parentElements.semiMajorAxisKm ** 3);
    const expectedDeg = ((((E0 - e * Math.sin(E0)) + n * ((REFERENCE - parentEpoch) / 1000)) / RADIANS) % 360 + 360) % 360;
    const wide = madeUpMembers(2000, 3);
    const input = (fraction: number, widthDeg: number, seed = 4) => baseInput(wide, { phase: { referenceUtcMs: REFERENCE, seed, concentration: { around: parent, fraction, widthDeg } } });
    const circular = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

    it("places the stated fraction within the width of the reference body's mean anomaly and spreads the rest evenly", () => {
      const group = createListedOrbitGroup(input(0.3, 12), adapter);
      const anomalies = Array.from({ length: group.count }, (_, i) => group.meanAnomalyDegAt(i));
      const near = anomalies.filter((m) => circular(m, expectedDeg) <= 12);
      // 30% are placed in the window; the evenly spread rest adds its chance share (24/360 of 70%).
      const expectedShare = 0.3 + 0.7 * (24 / 360);
      expect(Math.abs(near.length / 2000 - expectedShare)).toBeLessThan(0.01);
      expect(anomalies.filter((m) => circular(m, expectedDeg) <= 12.0001).length).toBeGreaterThanOrEqual(600);
      // The unclumped rest is still an even spread over the whole orbit: no gap larger than twice the slot.
      const rest = [...anomalies].sort((x, y) => x - y).filter((m) => circular(m, expectedDeg) > 12);
      let widest = 0;
      for (let k = 1; k < rest.length; k++) widest = Math.max(widest, rest[k] - rest[k - 1]);
      expect(widest).toBeLessThan(2 * (360 / 1400) + 24 + 1e-9);
      // The first slot of the clump is where the reference body is, to the model's width.
      const centre = anomalies.filter((m) => circular(m, expectedDeg) <= 12).reduce((s, m) => s + ((m - expectedDeg + 540) % 360 - 180), 0) / near.length;
      expect(Math.abs(centre)).toBeLessThan(1);
    });

    it("is deterministic, marks the concentration as a model, and adds no orbit", () => {
      const a = createListedOrbitGroup(input(0.3, 12), adapter);
      const b = createListedOrbitGroup(input(0.3, 12), adapter);
      expect([...fill(a, REFERENCE)]).toEqual([...fill(b, REFERENCE)]);
      expect(a.provenance.sourceType).toBe("illustrative");
      expect(a.provenance.notes).toMatch(/model, not a measurement/);
      expect(a.count).toBe(2000);
      const t = REFERENCE + 90 * DAY;
      const plain = createListedOrbitGroup(baseInput(wide), adapter);
      // Same members, same orbits: only the dots' places along them differ, so distances from the centre stay inside each orbit's range.
      const out = fill(a, t);
      wide.forEach((m, i) => {
        const r = Math.hypot(out[3 * i], out[3 * i + 1], out[3 * i + 2]);
        const { semiMajorAxisKm: sma, eccentricity: ecc } = m.elements;
        expect(r).toBeGreaterThanOrEqual(sma * (1 - ecc) * (1 - 1e-9));
        expect(r).toBeLessThanOrEqual(sma * (1 + ecc) * (1 + 1e-9));
      });
      expect(plain.count).toBe(a.count);
    });

    it("with fraction 0 equals the plain even spread, and with fraction 1 puts everything in the window", () => {
      const none = createListedOrbitGroup(input(0, 12), adapter);
      const plain = createListedOrbitGroup(baseInput(wide, { phase: { referenceUtcMs: REFERENCE, seed: 4 } }), adapter);
      for (let i = 0; i < 2000; i += 97) expect(none.meanAnomalyDegAt(i)).toBe(plain.meanAnomalyDegAt(i));
      const all = createListedOrbitGroup(input(1, 12), adapter);
      for (let i = 0; i < 2000; i += 97) expect(circular(all.meanAnomalyDegAt(i), expectedDeg)).toBeLessThanOrEqual(12.0001);
    });
  });
});

describe("listed orbit group performance (T-052 Done When 4)", () => {
  const big = madeUpMembers(30_000, 21);
  const group = createListedOrbitGroup(baseInput(big), adapter);

  it("fills 30,000 members inside the frame budget, as fast as the existing orbit group, and bit-identically", () => {
    const out = new Float64Array(3 * group.count);
    const orbitGroup = createOrbitGroup({
      id: "cmp", count: 30_000, center: "sun", plane: "ecliptic-j2000", epochUtcMs: REFERENCE,
      base: { semiMajorAxisKm: 10 * AU_KM, eccentricity: 0.6, inclinationDeg: 90, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
      spread: { semiMajorAxisKm: 5 * AU_KM, eccentricity: 0.2, inclinationDeg: 60, raanDeg: 180, argumentOfPeriapsisDeg: 180, trueAnomalyDeg: 180 },
      seed: 3, provenance,
    }, adapter);
    const orbitOut = new Float64Array(3 * 30_000);
    group.fillPositionsKm(REFERENCE, out);
    orbitGroup.fillPositionsKm(REFERENCE, orbitOut);
    const stats = new FrameStats();
    let statsBest = Infinity;
    let listedBest = Infinity;
    let orbitBest = Infinity;
    for (let run = 0; run < 5; run++) {
      stats.reset();
      let t0 = performance.now();
      stats.tick(t0);
      group.fillPositionsKm(REFERENCE + run * DAY, out);
      let t1 = performance.now();
      stats.tick(t1);
      statsBest = Math.min(statsBest, stats.snapshot().longestMs);
      listedBest = Math.min(listedBest, t1 - t0);
      t0 = performance.now();
      orbitGroup.fillPositionsKm(REFERENCE + run * DAY, orbitOut);
      t1 = performance.now();
      orbitBest = Math.min(orbitBest, t1 - t0);
    }
    console.info(`listed 30,000 fill best ${listedBest.toFixed(2)} ms; orbit group 30,000 fill best ${orbitBest.toFixed(2)} ms; best FrameStats duration ${statsBest.toFixed(2)} ms (budget ${FRAME_BUDGET_MS})`);
    expect(statsBest).toBeLessThan(FRAME_BUDGET_MS);
    expect(listedBest).toBeLessThan(FRAME_BUDGET_MS);
    expect(listedBest).toBeLessThan(1.5 * orbitBest);
  });

  it("gives bit-identical output for the same input", () => {
    const again = createListedOrbitGroup(baseInput(big), adapter);
    const t = REFERENCE + 400 * DAY;
    const x = fill(group, t);
    const y = fill(again, t);
    const bytesX = new Uint8Array(x.buffer);
    const bytesY = new Uint8Array(y.buffer);
    expect(bytesX.length).toBe(bytesY.length);
    expect(bytesX.every((byte, k) => byte === bytesY[k])).toBe(true);
    for (const i of [0, 1, 14_999, 29_999]) expect(group.meanAnomalyDegAt(i)).toBe(again.meanAnomalyDegAt(i));
  });
});

describe("the made-up listed experience (T-052 Done When 5)", () => {
  const noop = () => undefined;
  const markup = () => renderToStaticMarkup(createElement(AstraeusShell, {
    experience: experienceWithGroups(syntheticListedDefinition),
    snapshot: new SimulationClock(syntheticListedDefinition.clock.startUtcMs).snapshot(),
    developerMode: false, onDeveloperModeChange: noop, onTogglePlayback: noop, onRateChange: noop, onSeek: noop,
    onCameraRequest: noop, onSelectionChange: noop, scaleId: "true-scale", onScaleChange: noop, children: null,
  }));

  it("mounts one group through the points layer, with illustrative provenance and focus and follow presets", () => {
    expect(syntheticListedDefinition.sceneLayers).toContain("points");
    expect(groupsOf(syntheticListedDefinition).map((layer) => layer.object.id)).toEqual(["listed-orbits"]);
    const { group } = syntheticListedLayer;
    expect(group.count).toBe(LISTED_MEMBER_COUNT);
    expect(group.provenance.sourceType).toBe("illustrative");
    const experience = experienceWithGroups(syntheticListedDefinition);
    expect(experience.objects.filter((o) => o.id === "listed-orbits")).toHaveLength(1);
    expect(findCameraPreset(experience, "focus", "listed-orbits")).toBeDefined();
    expect(findCameraPreset(experience, "follow", "listed-orbits")).toBeDefined();
    expect(syntheticListedLayer.object.knownLimitations?.join(" ")).toMatch(/illustrative.*model.*not shown/s);
  });

  it("takes its dot size and colour from settings, and draws through the existing points view in both scales", () => {
    expect(syntheticListedLayer.pointSizePx).toBe(LISTED_LOOK.pointSizePx);
    expect(syntheticListedLayer.color).toBe(LISTED_LOOK.color);
    const view = new PointsView(syntheticListedLayer);
    const start = syntheticListedDefinition.clock.startUtcMs;
    view.sync(start + 3 * 86_400_000, placementAbout("sun", createOrbAstronomyAdapter()), trueScale);
    view.place(new FloatingOrigin());
    expect(view.drawn).toBe(true);
    expect(view.fillCount).toBeGreaterThanOrEqual(1);
  });

  it("passes the name check: no shower, meteor, Perseid or Apollo naming anywhere a viewer can read", () => {
    expect(markup()).not.toMatch(/columbia|eagle|apollo|meteor|shower|perseid|geminid/i);
    const text = JSON.stringify([syntheticListedLayer.object, syntheticListedDefinition.experience]);
    expect(text).not.toMatch(/meteor|shower|perseid|geminid|apollo/i);
  });
});
