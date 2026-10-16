import { describe, expect, it } from "vitest";
import { groupsOf } from "../src/app/experienceDefinition";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import type { ListedOrbitGroup } from "../src/core/listedOrbitGroup";
import { buildShowerDefinition, streamLimitations } from "../src/experiences/showers/showerDefinition";
import { orbitSetCounts, parseMeasuredOrbits } from "../src/experiences/showers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import geminidsFile from "../data/showers/geminids.json";
import shippedText from "../data/stories/geminids/gmn-iau-4.json?raw";
import { hasLocalOrbits, readLocalFile, readLocalOrbits, skipReasonFor } from "./helpers/measuredOrbits";
import { AU_KM, apply, earthEcliptic, ellipseOf, nearestPoint, raDecOf, separationDeg, solarLongitudeDeg, timeOfSolarLongitude, velocityOn } from "./helpers/streamFacts";

// I-030: the Geminid facts from the Global Meteor Network's measured orbits (Dec 2024 + Dec 2025 monthly files), the same checks as the Perseid GMN suite in showersMeasured.test.ts.
// Published values: IAU MDC established showers, GEM (4), parameter set AdNo 8 (Jenniskens 2023): solar longitude 261.6, radiant RA 113.0 Dec +32.4, Vg 33.8 km/s (J2000).
const IAU = 4;
const MDC_VG = 33.8;
const DAY_MS = 86_400_000;
const adapter = createOrbAstronomyAdapter();
const toEqj = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
const settings = parseShowerSettings(geminidsFile);
const rule = settings.stream.quality.rule;
const medianOf = (values: number[]) => { const v = [...values].sort((a, b) => a - b); return v.length % 2 === 1 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };

// The committed copy is what a public build serves, so it is checked on every machine.
describe("the Geminid orbits shipped with the story (I-030)", () => {
  const shipped = JSON.parse(shippedText);
  it("is the GMN file for IAU 4, CC BY 4.0, the two citations, the months the settings name, and parses as the builder's input", () => {
    const { provenance } = shipped;
    expect(provenance.iauCode).toBe(4);
    expect(provenance.iauLetters).toBe("GEM");
    expect(provenance.licence).toBe("CC BY 4.0");
    expect(provenance.citations).toHaveLength(2);
    expect(provenance.files.map((f: { month: string }) => f.month)).toEqual(settings.stream.sources.gmn!.months);
    expect(shipped.rows).toHaveLength(provenance.counts.kept);
    expect(shipped.rows.length).toBeGreaterThan(40_000);
    const orbits = parseMeasuredOrbits(shipped, IAU);
    expect(orbits.members).toHaveLength(provenance.counts.kept);
    const definition = buildShowerDefinition(settings, { kind: "loaded", orbits }, "all", "gmn");
    expect((groupsOf(definition)[0].group as ListedOrbitGroup).count).toBe(provenance.counts.kept);
  });
});

const present = hasLocalOrbits(IAU, "gmn");
const suite = present ? describe : describe.skip;
suite(`Geminids from the fetched GMN orbits${present ? "" : ` (${skipReasonFor(IAU, "gmn")})`}`, () => {
  const file = present ? readLocalFile(IAU, "gmn") : null!;
  const orbits = present ? readLocalOrbits(IAU, "gmn") : null!;
  const rowsFor = (set: "all" | "reliable") => (set === "all" ? file.rows : file.rows.filter((r) => r[9] >= rule.minConvergenceAngleDeg && r[11] <= rule.maxVelocityErrorFraction * r[10]));
  const peakPublished = timeOfSolarLongitude(adapter, toEqj, settings.radiant.peakSolarLongitudeDeg, Date.parse(settings.activity.startUtc), Date.parse(settings.activity.endUtc));

  it("holds the files the settings name, CC BY 4.0, with hashes and the counts", () => {
    const { provenance } = file;
    expect(provenance.iauLetters).toBe("GEM");
    expect(provenance.licence).toBe("CC BY 4.0");
    expect(provenance.files.map((f: { month: string }) => f.month)).toEqual(settings.stream.sources.gmn!.months);
    for (const f of provenance.files) { expect(f.sha256).toMatch(/^[0-9a-f]{64}$/); expect(f.bytes).toBeGreaterThan(1_000_000); }
    expect(provenance.counts.members).toBe(provenance.counts.unbound + provenance.counts.incomplete + provenance.counts.badSemiMajorAxis + provenance.counts.kept);
    expect(file.rows).toHaveLength(provenance.counts.kept);
    console.info(`GEM GMN COUNTS ${JSON.stringify(provenance.counts)}`);
  });

  it("is drawn from the GMN file by the builder, with the source, licence and counts in the panel, and the reliable set is the rule's", () => {
    const group = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits }, "all", "gmn"))[0].group as ListedOrbitGroup;
    expect(group.count).toBe(file.rows.length);
    const counts = orbitSetCounts(orbits, rule);
    expect(groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits }, "reliable", "gmn"))[0].group.count).toBe(rowsFor("reliable").length);
    expect(counts.reliable).toBe(rowsFor("reliable").length);
    console.info(`GEM GMN SETS ${JSON.stringify(counts)}`);
    const panel = streamLimitations(settings, { set: "all", counts, source: "gmn", provenance: orbits.provenance }).join(" ");
    expect(panel).toContain("Global Meteor Network");
    expect(panel).toContain("CC BY 4.0");
  });

  for (const set of ["all", "reliable"] as const) it(`${set} orbits: the median geocentric velocity is within 1 km/s of the MDC's ${MDC_VG}`, () => {
    const median = medianOf(rowsFor(set).map((r) => r[10]));
    console.info(`[${set}] GEM GMN median Vgeo = ${median.toFixed(2)} km/s over ${rowsFor(set).length} orbits (MDC ${MDC_VG})`);
    expect(Math.abs(median - MDC_VG)).toBeLessThan(1);
  });

  for (const set of ["all", "reliable"] as const) it(`${set} orbits: the busiest solar-longitude bin (0.5 deg) is within 1 degree of the MDC's 261.6 (J2000)`, () => {
    const bins = new Map<number, number>();
    for (const r of rowsFor(set)) { const k = Math.floor(r[8] / 0.5); bins.set(k, (bins.get(k) ?? 0) + 1); }
    const [bestBin, count] = [...bins.entries()].reduce((m, e) => (e[1] > m[1] ? e : m));
    const centre = bestBin * 0.5 + 0.25;
    console.info(`[${set}] GEM GMN busiest 0.5 deg bin ${(bestBin * 0.5).toFixed(1)}-${(bestBin * 0.5 + 0.5).toFixed(1)} (${count} orbits, centre ${centre}); MDC 261.6`);
    expect(Math.abs(centre - settings.radiant.peakSolarLongitudeDeg)).toBeLessThan(1);
  });

  for (const set of ["all", "reliable"] as const) it(`${set} orbits: Earth is nearest the GMN stream orbits within 2 days of the published peak`, () => {
    const members = rowsFor(set).map((row) => ellipseOf(row[3], row[4], row[5], row[6], row[7]));
    const days: number[] = [];
    for (let t = peakPublished - 6 * DAY_MS; t <= peakPublished + 6 * DAY_MS; t += DAY_MS) days.push(t);
    const NEAREST = 100;
    const rows = days.map((t) => {
      const earth = earthEcliptic(adapter, toEqj, t).position;
      const distances: number[] = [];
      for (const member of members) {
        const hit = nearestPoint(member, earth);
        if (hit !== null) distances.push(hit.distanceKm / AU_KM);
      }
      distances.sort((x, y) => x - y);
      const meanNearest = distances.slice(0, NEAREST).reduce((s, d) => s + d, 0) / NEAREST;
      return { t, meanNearest, within001: distances.filter((d) => d < 0.01).length, nearest: distances[0] };
    });
    let best = 0;
    rows.forEach((row, k) => { if (row.meanNearest < rows[best].meanNearest) best = k; });
    const [y0, y1, y2] = [rows[best - 1].meanNearest, rows[best].meanNearest, rows[best + 1].meanNearest];
    const offsetDays = (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2);
    const minimumMs = rows[best].t + offsetDays * DAY_MS;
    const peakRow = rows.reduce((m, row) => (Math.abs(row.t - peakPublished) < Math.abs(m.t - peakPublished) ? row : m), rows[0]);
    const deltaDays = (minimumMs - peakPublished) / DAY_MS;
    console.info(`[${set}] GEM GMN mean distance of the ${NEAREST} nearest ellipses smallest on ${new Date(rows[best].t).toISOString().slice(0, 10)} (${rows[best].meanNearest.toFixed(5)} AU), fitted minimum ${new Date(minimumMs).toISOString()}, ${deltaDays.toFixed(2)} days from the published peak ${new Date(peakPublished).toISOString()}; ellipses within 0.01 AU of Earth at the peak day ${peakRow.within001}`);
    console.info(`[${set}] GEM GMN daily table (UTC date, solar longitude, mean of ${NEAREST} nearest AU, ellipses within 0.01 AU): ${rows.map((r) => `${new Date(r.t).toISOString().slice(5, 10)} ${solarLongitudeDeg(adapter, toEqj, r.t).toFixed(1)} ${r.meanNearest.toFixed(5)} ${r.within001}`).join(" | ")}`);
    expect(Math.abs(deltaDays)).toBeLessThanOrEqual(2);
  }, 240_000);

  for (const set of ["all", "reliable"] as const) it(`${set} orbits: the radiant from GMN orbits crossing Earth's at the peak is within 3 degrees of RA 113.0, Dec +32.4`, () => {
    const earth = earthEcliptic(adapter, toEqj, peakPublished);
    const CROSSING_AU = 0.02;
    const radiants: { x: number; y: number; z: number; speed: number }[] = [];
    for (const row of rowsFor(set)) {
      const orbit = ellipseOf(row[3], row[4], row[5], row[6], row[7]);
      const hit = nearestPoint(orbit, earth.position);
      if (hit === null || hit.distanceKm / AU_KM > CROSSING_AU) continue;
      const vp = velocityOn(orbit, hit.nu);
      const u = [vp[0] - earth.velocity[0], vp[1] - earth.velocity[1], vp[2] - earth.velocity[2]];
      const from = apply(toEqj, [-u[0], -u[1], -u[2]]);
      const norm = Math.hypot(from[0], from[1], from[2]);
      radiants.push({ x: from[0] / norm, y: from[1] / norm, z: from[2] / norm, speed: Math.hypot(u[0], u[1], u[2]) });
    }
    const sum = radiants.reduce((s, r) => ({ x: s.x + r.x, y: s.y + r.y, z: s.z + r.z }), { x: 0, y: 0, z: 0 });
    const found = raDecOf([sum.x, sum.y, sum.z]);
    const off = separationDeg(found, { raDeg: settings.radiant.raDeg, decDeg: settings.radiant.decDeg });
    console.info(`[${set}] GEM GMN ${radiants.length} members within ${CROSSING_AU} AU of Earth at ${new Date(peakPublished).toISOString()}; radiant RA ${found.raDeg.toFixed(2)} Dec ${found.decDeg.toFixed(2)}, geocentric speed median ${medianOf(radiants.map((r) => r.speed)).toFixed(2)} km/s; separation ${off.toFixed(2)} deg from RA ${settings.radiant.raDeg} Dec ${settings.radiant.decDeg}`);
    expect(radiants.length).toBeGreaterThan(100);
    expect(off).toBeLessThan(3);
  }, 240_000);
});
