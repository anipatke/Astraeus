import { beforeAll, describe, expect, it } from "vitest";
import rawAnchors from "../data/apollo11/raw/anchors.json";
import rawEvents from "../data/apollo11/raw/events.json";
import anchorsText from "../data/apollo11/normalised/anchors.json?raw";
import columbiaText from "../data/apollo11/generated/columbia.json?raw";
import eagleText from "../data/apollo11/generated/eagle.json?raw";
import eventsText from "../data/apollo11/generated/events.json?raw";
import validationText from "../data/apollo11/generated/validation.json?raw";
import reportText from "../docs/APOLLO11_RECONSTRUCTION.md?raw";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createEvents } from "../src/core/events";
import { createProvenance } from "../src/core/provenance";
import { SampledTrajectory } from "../src/core/sampledTrajectory";
import { CONSTANTS, getToUtcMs, parseLatitudeDeg, parseLongitudeDeg, parsePrintedNumber } from "../tools/apollo11/conventions";
import {
  fixedToGeodetic,
  geodeticToFixedKm,
  inertialNorthAxes,
  localAxes,
  lunarFixedToEqj,
  lunarOrientation,
  surfacePointVelocity,
  velocityFromFlightGeometry,
} from "../tools/apollo11/frames";
import { hermiteAt } from "../tools/apollo11/hermite";
import { apsides, propagateKepler } from "../tools/apollo11/kepler";
import { reconstruct, type OutputFiles, type RawInputs } from "../tools/apollo11/reconstruct";
import { cross, dot, norm, sub, type Vec3 } from "../tools/apollo11/vec";

const MU_EARTH = CONSTANTS.earth.muKm3S2;
const SPECIAL_SEGMENT_BASELINES = [
  { id: "A-20>A-LND", method: "powered-descent-two-anchor", count: 1, sha256: "f61905af7c238234cb8cf6baa9bd1a2c8c3f000456d0c6f94132d6f79349916f" },
  { id: "A-LND>A-LIFTOFF", method: "surface-hold", count: 22, sha256: "6e8e4910c1d285179cd0ed5f8edd2d9b57dced1ae23a61dfa5a2d86c3afeb22d" },
  { id: "A-LIFTOFF>A-21", method: "powered-ascent-two-anchor", count: 1, sha256: "d6fcb512c720ea7eaece9084374da0bf0bf46eb91da24e890637cef31d9f1d12" },
] as const;

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("Apollo 11 conversion fixtures", () => {
  it("converts printed GET to UTC milliseconds from range zero 13:32:00 GMT", () => {
    expect(CONSTANTS.rangeZeroUtcMs).toBe(Date.UTC(1969, 6, 16, 13, 32, 0));
    expect(getToUtcMs("0:00:00.6")).toBe(Date.UTC(1969, 6, 16, 13, 32, 0) + 600);
    expect(getToUtcMs("195:03:05.7")).toBe(Date.UTC(1969, 6, 16, 13, 32, 0) + (195 * 3600 + 3 * 60 + 5.7) * 1000);
    expect(() => getToUtcMs("12:61")).toThrow(RangeError);
  });

  it("parses printed latitude, longitude and spaced thousands", () => {
    expect(parseLatitudeDeg("9.23S")).toBe(-9.23);
    expect(parseLongitudeDeg("172.55E")).toBe(172.55);
    expect(parseLongitudeDeg("165.01W")).toBe(-165.01);
    expect(parsePrintedNumber("4 110.0")).toBe(4110);
    expect(() => parseLatitudeDeg("9.23E")).toThrow(RangeError);
  });

  it("places geodetic points on the Fischer 1960 ellipsoid (hand-computed)", () => {
    const [a, f] = [CONSTANTS.earth.equatorialRadiusKm, CONSTANTS.earth.inverseFlattening];
    const equator = geodeticToFixedKm(0, 0, 0, a, f);
    expect(equator[0]).toBeCloseTo(6378.166, 9);
    const pole = geodeticToFixedKm(90, 0, 0, a, f);
    expect(pole[2]).toBeCloseTo(6356.784283607, 6);
    const mid = geodeticToFixedKm(45, 0, 0.5, a, f);
    expect(mid[0]).toBeCloseTo(4517.963886724, 6);
    expect(mid[2]).toBeCloseTo(4487.725616034, 6);
    const back = fixedToGeodetic(mid, a, f);
    expect(back.latitudeDeg).toBeCloseTo(45, 9);
    expect(back.heightKm).toBeCloseTo(0.5, 9);
  });

  it("builds the velocity from speed, flight-path angle and heading", () => {
    const axes = localAxes(0, 0); // east +Y, north +Z, up +X
    const east = velocityFromFlightGeometry(axes, 2, 0, 90);
    expect(east[1]).toBeCloseTo(2, 12);
    expect(east[2]).toBeCloseTo(0, 12);
    const north = velocityFromFlightGeometry(axes, 2, 0, 0);
    expect(north[2]).toBeCloseTo(2, 12);
    const up = velocityFromFlightGeometry(axes, 2, 90, 0);
    expect(up[0]).toBeCloseTo(2, 12);
    const westDown = velocityFromFlightGeometry(axes, 2, -30, -90);
    expect(westDown[1]).toBeCloseTo(-2 * Math.cos(Math.PI / 6), 12);
    expect(westDown[0]).toBeCloseTo(-1, 12);
  });

  it("takes Moon-referenced heading against EQJ north (hand-computed basis)", () => {
    // Over the Moon's x axis: up +X, east +Y, north +Z. At 45 deg declination: north tilts back toward -X.
    const onEquator = inertialNorthAxes([1738, 0, 0]);
    expect(onEquator.up).toEqual([1, 0, 0]);
    expect(onEquator.east[1]).toBeCloseTo(1, 12);
    expect(onEquator.north[2]).toBeCloseTo(1, 12);
    const tilted = inertialNorthAxes([1, 0, 1]);
    const h = Math.SQRT1_2;
    expect(tilted.east).toEqual([0, 1, 0]);
    expect(tilted.north[0]).toBeCloseTo(-h, 12);
    expect(tilted.north[2]).toBeCloseTo(h, 12);
    const v = velocityFromFlightGeometry(tilted, 1.6, 0, 180);
    expect(v[0]).toBeCloseTo(1.6 * h, 12);
    expect(v[2]).toBeCloseTo(-1.6 * h, 12);
  });

  it("evaluates the IAU lunar rotation at J2000 to the published pole and meridian", () => {
    const j2000Tt = Date.UTC(2000, 0, 1, 12) - CONSTANTS.ttMinusUtcSeconds * 1000;
    const pole = lunarOrientation(j2000Tt);
    expect(pole.rightAscensionDeg).toBeCloseTo(266.8577, 3);
    expect(pole.declinationDeg).toBeCloseTo(65.6411, 3);
    expect(pole.primeMeridianDeg).toBeCloseTo(41.1953, 3);
    const m = lunarFixedToEqj(j2000Tt);
    expect(m[0] * m[0] + m[3] * m[3] + m[6] * m[6]).toBeCloseTo(1, 12);
    // the body +Z axis is the pole
    const alpha = (pole.rightAscensionDeg * Math.PI) / 180;
    const delta = (pole.declinationDeg * Math.PI) / 180;
    expect(m[2]).toBeCloseTo(Math.cos(delta) * Math.cos(alpha), 9);
    expect(m[8]).toBeCloseTo(Math.sin(delta), 9);
  });

  it("gives a Moon-fixed surface point the speed of the lunar rotation", () => {
    const point: Vec3 = [CONSTANTS.moon.referenceRadiusKm, 0, 0];
    const speedKmS = norm(surfacePointVelocity(Date.UTC(1969, 6, 20, 20), point, 500));
    const expected = ((2 * Math.PI) / (27.321661 * 86400)) * CONSTANTS.moon.referenceRadiusKm;
    expect(speedKmS / expected).toBeGreaterThan(0.99);
    expect(speedKmS / expected).toBeLessThan(1.01);
  });
});

describe("two-body propagation and Hermite arcs", () => {
  const radius = 7000;
  const circular = { r: [radius, 0, 0] as Vec3, v: [0, Math.sqrt(MU_EARTH / radius), 0] as Vec3 };
  const period = 2 * Math.PI * Math.sqrt(radius ** 3 / MU_EARTH);

  it("moves a circular orbit a quarter and several full periods", () => {
    const quarter = propagateKepler(MU_EARTH, circular, period / 4);
    expect(quarter.r[0]).toBeCloseTo(0, 6);
    expect(quarter.r[1]).toBeCloseTo(radius, 6);
    const many = propagateKepler(MU_EARTH, circular, period * 14.5);
    expect(many.r[0]).toBeCloseTo(-radius, 5);
  });

  it("returns to the start when propagated forward then backward, also on a hyperbola", () => {
    const hyperbola = { r: [9000, 0, 0] as Vec3, v: [3, 11, 1] as Vec3 };
    const there = propagateKepler(MU_EARTH, hyperbola, 5000);
    const back = propagateKepler(MU_EARTH, there, -5000);
    expect(norm(sub(back.r, hyperbola.r))).toBeLessThan(1e-6);
    expect(norm(sub(back.v, hyperbola.v))).toBeLessThan(1e-9);
  });

  it("derives apsides from a state (hand-computed 7000 x 14000 km orbit)", () => {
    const perigeeSpeed = 8.713431796725702;
    const orbit = apsides(MU_EARTH, { r: [7000, 0, 0], v: [0, perigeeSpeed, 0] });
    expect(orbit.periapsisRadiusKm).toBeCloseTo(7000, 4);
    expect(orbit.apoapsisRadiusKm).toBeCloseTo(14000, 3);
    expect(() => apsides(MU_EARTH, { r: [7000, 0, 0], v: [0, 12, 0] })).toThrow(RangeError);
  });

  it("interpolates a cubic exactly with Hermite", () => {
    const ends = { p0: [0, 0, 0] as Vec3, v0: [0, 0, 0] as Vec3, p1: [1, 0, 0] as Vec3, v1: [0, 0, 0] as Vec3, spanS: 10 };
    expect(hermiteAt(ends, 0.5).p[0]).toBeCloseTo(0.5, 12);
    expect(hermiteAt(ends, 1).v[0]).toBeCloseTo(0, 12);
  });
});

describe("Apollo 11 reconstruction pipeline", () => {
  const raw = { anchors: rawAnchors, events: rawEvents } as unknown as RawInputs;
  let first: OutputFiles;
  let second: OutputFiles;
  let validation: ReturnType<typeof reconstruct>["validation"];

  beforeAll(() => {
    const adapter = createOrbAstronomyAdapter();
    const run = reconstruct(adapter, raw);
    first = run.files;
    validation = run.validation;
    second = reconstruct(createOrbAstronomyAdapter(), raw).files;
  }, 240_000);

  it("produces byte-identical output on a second run", () => {
    expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
    for (const [file, content] of Object.entries(first)) expect(second[file], file).toBe(content);
  });

  it("matches the committed data package and report", () => {
    expect(first["data/apollo11/normalised/anchors.json"]).toBe(anchorsText);
    expect(first["data/apollo11/generated/columbia.json"]).toBe(columbiaText);
    expect(first["data/apollo11/generated/eagle.json"]).toBe(eagleText);
    expect(first["data/apollo11/generated/events.json"]).toBe(eventsText);
    expect(first["data/apollo11/generated/validation.json"]).toBe(validationText);
    expect(first["docs/APOLLO11_RECONSTRUCTION.md"]).toBe(reportText);
  });

  it("keeps every non-cutoff anchor exact and publishes each burn cutoff residual", () => {
    expect(validation.anchorResiduals.length).toBeGreaterThanOrEqual(40);
    const cutoffs = validation.segments.filter((s) => s.method === "powered-burn-physical");
    const cutoffIds = new Set(cutoffs.map((s) => `${s.vehicle}:${s.endAnchorId}`));
    for (const row of validation.anchorResiduals) {
      if (cutoffIds.has(`${row.vehicle}:${row.anchorId}`)) continue;
      expect(row.positionKm, `${row.vehicle} ${row.anchorId}`).toBeLessThanOrEqual(1e-6);
      expect(row.velocityMs, `${row.vehicle} ${row.anchorId}`).toBeLessThanOrEqual(1e-6);
    }
    for (const burn of cutoffs) {
      expect(burn.cutoffPositionResidualKm, burn.id).toBeGreaterThanOrEqual(0);
      expect(burn.cutoffVelocityResidualMs, burn.id).toBeLessThan(1e-4);
      const residual = validation.anchorResiduals.find((row) => row.vehicle === burn.vehicle && row.anchorId === burn.endAnchorId)!;
      expect(residual.positionKm).toBeCloseTo(burn.cutoffPositionResidualKm!, 5);
      expect(residual.velocityMs).toBeCloseTo(burn.cutoffVelocityResidualMs!, 4);
    }
  });

  it("flies every powered pair physically and publishes runtime peak speeds", () => {
    const burns = validation.segments.filter((s) => s.method === "powered-burn-physical");
    expect(burns).toHaveLength(12);
    for (const burn of burns) {
      expect(burn.constantAccelerationKmS2, burn.id).toHaveLength(3);
      expect(burn.peakSpeedKmS, burn.id).toBeGreaterThan(0);
    }
    const loi2 = burns.find((s) => s.id === "A-13>A-14")!;
    expect(loi2.speedReferenceBody).toBe("moon");
    expect(loi2.peakSpeedKmS).toBeGreaterThanOrEqual(1.6);
    expect(loi2.peakSpeedKmS).toBeLessThanOrEqual(1.7);
    const mcc1 = burns.find((s) => s.id === "A-09>A-10")!;
    expect(mcc1.speedReferenceBody).toBe("earth");
    expect(mcc1.peakSpeedKmS).toBeGreaterThan(1.4);
    expect(mcc1.peakSpeedKmS).toBeLessThan(1.7);
  });

  it("finds no one-second move beyond local speed in either runtime trajectory", () => {
    expect(validation.oneSecondSpeedScan.columbia.checkedSeconds).toBeGreaterThan(600_000);
    expect(validation.oneSecondSpeedScan.eagle.checkedSeconds).toBeGreaterThan(90_000);
    expect(validation.oneSecondSpeedScan.columbia.violationCount).toBe(0);
    expect(validation.oneSecondSpeedScan.eagle.violationCount).toBe(0);
  });

  it("leaves the special descent, surface-hold and ascent methods and emitted samples byte-identical", async () => {
    const eagle = JSON.parse(eagleText);
    for (const baseline of SPECIAL_SEGMENT_BASELINES) {
      const segment = eagle.segments.find((s: { id: string }) => s.id === baseline.id)!;
      const samples = eagle.samples.slice(segment.firstSampleIndex, segment.firstSampleIndex + segment.sampleCount);
      const hash = await sha256(JSON.stringify(samples));
      expect(segment.method, baseline.id).toBe(baseline.method);
      expect(samples, baseline.id).toHaveLength(baseline.count);
      expect(hash, baseline.id).toBe(baseline.sha256);
    }
  });

  it("keeps runtime Hermite interpolation error at held-out midpoints within the 0.25 km target", () => {
    for (const segment of validation.segments) {
      expect(segment.interpolationMaxKm, `${segment.vehicle} ${segment.id}`).toBeLessThanOrEqual(0.25);
    }
  });

  it("smooths every coast onto its end anchor, publishing the raw miss and correction without gating on them", () => {
    const coasts = validation.segments.filter((s) => s.method === "coast-nbody-smoothed");
    expect(coasts.length).toBeGreaterThan(20);
    for (const s of coasts) {
      expect(s.rawMissKm, s.id).toBeGreaterThanOrEqual(0);
      expect(s.maxCorrectionKm, s.id).toBeGreaterThanOrEqual(s.rawMissKm! - 1e-3);
    }
    for (const [file, vehicle] of [[columbiaText, "columbia"], [eagleText, "eagle"]] as const) {
      const data = JSON.parse(file);
      expect(data.discontinuities).toEqual([]);
      expect(data.segments.filter((s: { rawMissKm?: number }) => s.rawMissKm !== undefined).length)
        .toBe(coasts.filter((s) => s.vehicle === vehicle).length);
    }
    expect(JSON.parse(columbiaText).provenance.accuracy).toMatch(/rawMissKm/);
  });

  // Both sides of a join share one sample: the modelled burn cutoff or the converted anchor state.
  it("keeps position and velocity continuous at every segment join", () => {
    for (const text of [columbiaText, eagleText]) {
      const data = JSON.parse(text);
      const trajectory = new SampledTrajectory({ body: data.metadata.body, center: "earth", samples: data.samples });
      for (const anchor of data.anchors.slice(1, -1)) {
        // The old join was a step of km to tens of thousands of km inside 1 s; 1 ms either side exposes any step.
        const before = trajectory.stateAt(anchor.timeUtcMs - 1);
        const after = trajectory.stateAt(anchor.timeUtcMs + 1);
        const moved = norm(sub(after.positionKm as unknown as Vec3, before.positionKm as unknown as Vec3));
        const atJoin = trajectory.stateAt(anchor.timeUtcMs);
        const sample = data.samples[anchor.sampleIndex];
        const speed = norm(atJoin.velocityKmS as unknown as Vec3);
        expect(moved, anchor.id).toBeLessThan(speed * 0.002 + 1e-3);
        expect(Array.from(atJoin.positionKm), anchor.id).toEqual(sample.positionKm);
        expect(Array.from(atJoin.velocityKmS ?? []), anchor.id).toEqual(sample.velocityKmS);
      }
    }
  });

  it("puts the Moon-referenced lunar-orbit anchors in one orbit plane (heading convention)", () => {
    const anchors = JSON.parse(anchorsText).anchors as { id: string; native: { positionKm: Vec3; velocityKmS: Vec3 } }[];
    const ids = ["A-12", "A-13", "A-14", "A-16", "A-17", "A-18", "A-19", "A-20", "A-21", "A-22", "A-23", "A-24", "A-25", "A-26", "A-28"];
    const normals = ids.map((id) => {
      const a = anchors.find((x) => x.id === id)!;
      const n = cross(a.native.positionKm, a.native.velocityKmS);
      return n.map((x) => x / norm(n)) as unknown as Vec3;
    });
    const sum = normals.reduce((acc, n) => [acc[0] + n[0], acc[1] + n[1], acc[2] + n[2]] as Vec3, [0, 0, 0] as Vec3);
    const mean = sum.map((x) => x / norm(sum)) as unknown as Vec3;
    for (const [i, n] of normals.entries()) {
      expect((Math.acos(Math.min(1, dot(n, mean))) * 180) / Math.PI, ids[i]).toBeLessThan(1);
    }
  });

  it("emits trajectories that SampledTrajectory accepts, with reconstructed provenance and anchors marked", () => {
    for (const text of [columbiaText, eagleText]) {
      const data = JSON.parse(text);
      expect(createProvenance(data.provenance).sourceType).toBe("reconstructed");
      expect(data.metadata.frame).toBe("EQJ");
      expect(data.metadata.center).toBe("earth");
      const trajectory = new SampledTrajectory({ body: data.metadata.body, center: "earth", samples: data.samples });
      expect(trajectory.bounds.startUtcMs).toBe(data.metadata.startUtcMs);
      expect(trajectory.bounds.endUtcMs).toBe(data.metadata.endUtcMs);
      for (const anchor of data.anchors) {
        expect(data.samples[anchor.sampleIndex].timeUtcMs).toBe(anchor.timeUtcMs);
      }
    }
  });

  it("spans the confirmed windows: Earth orbit insertion to entry interface; separation to docking", () => {
    const columbia = JSON.parse(columbiaText);
    const eagle = JSON.parse(eagleText);
    expect(columbia.metadata.startUtcMs).toBe(getToUtcMs("00:11:39.3"));
    expect(columbia.metadata.endUtcMs).toBe(getToUtcMs("195:03:05.7"));
    expect(eagle.metadata.startUtcMs).toBe(getToUtcMs("100:12:00"));
    expect(eagle.metadata.endUtcMs).toBe(getToUtcMs("128:03:00"));
  });

  it("writes sorted, valid events including launch and splashdown", () => {
    const events = JSON.parse(eventsText).events;
    expect(() => createEvents(events)).not.toThrow();
    expect(events.map((e: { id: string }) => e.id)).toContain("E-01");
    expect(events.map((e: { id: string }) => e.id)).toContain("E-30");
  });

  it("agrees with the published LOI-1 orbit within 0.5 n mi (independent check on conventions)", () => {
    const row = validation.orbitCrossChecks.find((c) => c.anchorId === "A-12")!;
    expect(Math.abs(row.computedApoluneNmi - row.publishedApoluneNmi)).toBeLessThan(0.5);
    expect(Math.abs(row.computedPeriluneNmi - row.publishedPeriluneNmi)).toBeLessThan(0.5);
  });

  it("records the qualitative checks and keeps the surface arcs above the surface", () => {
    const q = validation.qualitative;
    expect(q.departure.angleBetweenTliPositionAndMoonAtLoiDeg).toBeGreaterThan(120);
    expect(q.lunarOrbit.columbia.minAltitudeKm).toBeGreaterThan(0);
    expect(q.lunarOrbit.columbia.minDistanceToMoonPositionAtOrbitInsertionKm).toBeGreaterThan(100);
    expect(Math.abs(q.entryInterface.crossingMinusAnchorSeconds)).toBeLessThan(60);
    for (const clearance of validation.surfaceClearance) expect(clearance.minAltitudeKm).toBeGreaterThanOrEqual(-0.001);
    expect(validation.landingSiteOffset).toHaveLength(2);
  });

  it("flags the suspect raw anchors without altering them", () => {
    const anchors = JSON.parse(anchorsText).anchors as { id: string; flags: string[] }[];
    expect(anchors.filter((a) => a.flags.length > 0).map((a) => a.id)).toEqual(["A-05", "A-33", "A-34"]);
  });

  it("uses the documented inferred overrides only for A-05, A-33 and A-34, leaving source values unchanged", () => {
    const anchors = JSON.parse(anchorsText).anchors as {
      id: string;
      inputs: { flightPathAngleDeg: number; inertialSpeedKmS: number };
      inferredOverride?: { printedValue: number; reconstructionValue: number; status: string; evidence: string[] };
    }[];
    const overridden = anchors.filter((a) => a.inferredOverride !== undefined);
    expect(overridden.map((a) => a.id)).toEqual(["A-05", "A-33", "A-34"]);
    const a05 = overridden[0];
    expect(a05.inferredOverride?.printedValue).toBe(44.94);
    expect(a05.inferredOverride?.reconstructionValue).toBe(49.94);
    expect(a05.inferredOverride?.status).toBe("probable-source-typo");
    expect(a05.inferredOverride?.evidence.length).toBeGreaterThan(0);
    expect(a05.inputs.flightPathAngleDeg).toBe(49.94);
    expect(rawAnchors.anchors.find((r) => r.id === "A-05")?.flight_path_angle_printed).toBe("44.94");

    const speedFtS = (id: string) => overridden.find((a) => a.id === id)!.inputs.inertialSpeedKmS / 0.0003048;
    expect(speedFtS("A-33")).toBeCloseTo(4075.0, 6);
    expect(speedFtS("A-34")).toBeCloseTo(4074.0, 6);
    expect(rawAnchors.anchors.find((r) => r.id === "A-33")?.inertial_velocity_printed).toBe("4 375.0");
    expect(rawAnchors.anchors.find((r) => r.id === "A-34")?.inertial_velocity_printed).toBe("4 374.0");
  });

  it("pins the source-verified Table 7-II values so they are not 'corrected' back", () => {
    const printed = (id: string) => rawAnchors.anchors.find((a) => a.id === id)!;
    expect(printed("A-06").altitude_printed).toBe("13 506.5");
    expect(printed("A-06").longitude_printed).toBe("67.70W");
    expect(printed("A-06").inertial_velocity_printed).toBe("16 060.8");
    expect(printed("A-07").altitude_printed).toBe("16 620.8");
    expect(printed("A-08").altitude_printed).toBe("16 627.3");
    // A-05 is printed as 44.94 in the source; it is flagged, not changed.
    expect(printed("A-05").flight_path_angle_printed).toBe("44.94");
  });

  it("pins the source-corrected A-13 longitude in raw and normalised anchors", () => {
    const rawA13 = rawAnchors.anchors.find((anchor) => anchor.id === "A-13")!;
    const anchors = JSON.parse(anchorsText).anchors as {
      id: string;
      inputs: { longitudeDeg: number };
      inferredOverride?: unknown;
      native: { positionKm: Vec3 };
    }[];
    const a13 = anchors.find((anchor) => anchor.id === "A-13")!;
    const a14 = anchors.find((anchor) => anchor.id === "A-14")!;

    expect(rawA13.longitude_printed).toBe("170.09E");
    expect(JSON.stringify(rawA13)).toContain("A-13 lunar-orbit circularization ignition longitude as 170.09 E");
    expect(a13.inputs.longitudeDeg).toBe(170.09);
    expect(a13.inferredOverride).toBeUndefined();
    expect(norm(sub(a13.native.positionKm, a14.native.positionKm))).toBeLessThan(50);
  });
});
