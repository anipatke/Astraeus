import { describe, expect, it } from "vitest";
import { groupsOf } from "../src/app/experienceDefinition";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { meanAnomalyFromStateRad, type ListedOrbitGroup } from "../src/core/listedOrbitGroup";
import { buildShowerDefinition, createParentOrbitPathLayer, streamIdOf, streamLimitations } from "../src/experiences/showers/showerDefinition";
import { MEASURED_ROW_COLUMNS, orbitSetCounts } from "../src/experiences/showers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseidsFile from "../data/showers/perseids.json";
import { ROW_COLUMNS } from "../tools/data/fetch-meteoroid-orbits.mjs";
import { hasLocalOrbits, readLocalFile, readLocalOrbits, skipReasonFor } from "./helpers/measuredOrbits";
import { AU_KM, SUN_GM_KM3_S2, apply, earthEcliptic, ellipseOf, nearestPoint, raDecOf, separationDeg, solarLongitudeDeg, timeOfSolarLongitude, velocityOn } from "./helpers/streamFacts";
import { readSheetRows, workbookFromEnvironment } from "./helpers/workbook.mjs";

const IAU = 7;
const settings = parseShowerSettings(perseidsFile);
const present = hasLocalOrbits(IAU);
// The real-data checks run when this machine has fetched the orbits and skip, saying why, when it has not.
const suite = present ? describe : describe.skip;
const title = `Perseids from the fetched CAMS orbits${present ? "" : ` (${skipReasonFor(IAU)})`}`;

const DAY_MS = 86_400_000;
const adapter = createOrbAstronomyAdapter();
const toEqj = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();

it("keeps the settings-side row columns equal to the fetch tool's", () => {
  expect([...MEASURED_ROW_COLUMNS]).toEqual([...ROW_COLUMNS]);
});

suite(title, () => {
  const file = present ? readLocalFile(IAU) : null!;
  const orbits = present ? readLocalOrbits(IAU) : null!;
  const definition = present ? buildShowerDefinition(settings, { kind: "loaded", orbits }) : null!;
  const group: ListedOrbitGroup = present ? (groupsOf(definition)[0].group as ListedOrbitGroup) : null!;
  const rule = settings.stream.quality.rule;
  const rowsFor = (set: "all" | "reliable") => (set === "all" ? file.rows : file.rows.filter((r) => r[9] >= rule.minConvergenceAngleDeg && r[11] <= rule.maxVelocityErrorFraction * r[10]));
  const peakPublished = timeOfSolarLongitude(adapter, toEqj, settings.radiant.peakSolarLongitudeDeg, Date.parse(settings.activity.startUtc), Date.parse(settings.activity.endUtc));

  it("holds the release T-051 recorded: 24,928 records, 6,229 unbound dropped, 18,699 bound orbits, all drawn", () => {
    const { counts, release, iauCode, date1904 } = file.provenance;
    expect(iauCode).toBe(7);
    expect(date1904).toBe(true);
    expect(release.sha256).toBe("ec8864967785b18edcd78d503e82da77dfe837537e13dddde0fcd4b9c5a85845");
    expect(counts).toMatchObject({ members: 24_928, unbound: 6_229, kept: 18_699, badSemiMajorAxis: 0, incomplete: 0 });
    expect(file.rows).toHaveLength(18_699);
    expect(group.count).toBe(18_699);
    expect(group.count).toBeLessThan(20_000);
    console.info(`MEMBERS ${JSON.stringify(counts)} drawn=${group.count}`);
  });

  it("holds both orbit sets: 18,699 orbits, 15,644 reliable (Q >= 15 deg and velocity error <= 10%), 3,055 cut, 99 double entries kept", () => {
    const counts = orbitSetCounts(orbits, rule);
    expect(counts).toMatchObject({ all: 18_699, reliable: 15_644, cut: 3_055, pairsFlagged: 99, pairsFlaggedReliable: 78 });
    expect(file.provenance.counts.pairsFlagged).toBe(99);
    expect(rowsFor("reliable")).toHaveLength(15_644);
    const reliable = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits }, "reliable"))[0].group;
    expect(reliable.count).toBe(15_644);
    console.info(`SETS ${JSON.stringify(counts)}`);
  });

  it("draws no invented member: every record id is a CAMS catalogue number, once, with e below 1 and a above 0", () => {
    const ids = new Set<string>();
    for (const row of file.rows) {
      expect(row[0]).toMatch(/^\d+$/);
      ids.add(row[0]);
      expect(row[4]).toBeLessThan(1);
      expect(row[3]).toBeGreaterThan(0);
    }
    expect(ids.size).toBe(file.rows.length);
    expect(Array.from({ length: group.count }, (_, i) => group.recordIdAt(i)).every((id) => ids.has(id))).toBe(true);
  });

  const sample = (): number[] => Array.from({ length: 20 }, (_, k) => Math.floor(((k + 0.5) * group.count) / 20));

  it("resolves a sample of 20 members to their CAMS records: id, sheet row and the orbit's own energy", () => {
    const byId = new Map<string, any[]>(file.rows.map((row) => [row[0], row]));
    const t = Date.parse(settings.activity.peakUtc);
    for (const index of sample()) {
      const id = group.recordIdAt(index);
      const row = byId.get(id)!;
      expect(row, `record ${id}`).toBeDefined();
      expect(Number.isInteger(row[1]) && row[1] >= 6).toBe(true);
      expect(group.stateAt(index, t).body).toBe(`${streamIdOf(settings)}:${id}`);
      // The member's orbit is the record's: its specific energy gives back the record's semi-major axis.
      const [before, after] = [t - 5_000, t + 5_000].map((time) => group.stateAt(index, time).positionKm);
      const now = group.stateAt(index, t).positionKm;
      const v = [0, 1, 2].map((k) => (after[k] - before[k]) / 10);
      const energy = (v[0] ** 2 + v[1] ** 2 + v[2] ** 2) / 2 - SUN_GM_KM3_S2 / Math.hypot(now[0], now[1], now[2]);
      const aKm = -SUN_GM_KM3_S2 / (2 * energy);
      expect(Math.abs(aKm / (row[3] * AU_KM) - 1)).toBeLessThan(1e-4);
    }
  });

  const workbook = workbookFromEnvironment();
  it.skipIf(workbook === null)(
    workbook === null ? "resolves the sample against the source workbook (skipped: set CAMS_XLSX to a copy of CAMS-v3-2010to2016.xlsx)" : "resolves the sample against the source workbook",
    async () => {
      const byId = new Map<string, any[]>(file.rows.map((row) => [row[0], row]));
      const rows = sample().map((index) => byId.get(group.recordIdAt(index))!);
      const sheet = await readSheetRows(workbook!, rows.map((row) => row[1]));
      for (const row of rows) {
        const cells = sheet.get(row[1])!;
        expect(String(cells.catalog)).toBe(row[0]);
        expect(cells.iau).toBe(IAU);
        expect([cells.a, cells.e, cells.i, cells.w, cells.node]).toEqual([row[3], row[4], row[5], row[6], row[7]]);
      }
    },
    120_000,
  );

  it("puts a stated share of the dots at the comet's orbital phase and the rest evenly round their orbits", () => {
    const comet = catalogue.get(settings.parentBodyId).source!.create(adapter);
    const t = Date.parse(settings.activity.peakUtc);
    const now = comet.stateAt(t, "sun");
    const before = comet.stateAt(t - 1000, "sun").positionKm;
    const after = comet.stateAt(t + 1000, "sun").positionKm;
    const v = [0, 1, 2].map((k) => (after[k] - before[k]) / 2);
    const phase = (meanAnomalyFromStateRad(now.positionKm, v, SUN_GM_KM3_S2) * 180) / Math.PI;
    const { fraction, widthDeg } = settings.stream.concentration;
    let near = 0;
    for (let i = 0; i < group.count; i += 1) {
      const d = Math.abs(((group.meanAnomalyDegAt(i) - phase + 540) % 360) - 180);
      if (d <= widthDeg) near += 1;
    }
    const expected = fraction + (1 - fraction) * ((2 * widthDeg) / 360);
    expect(near / group.count).toBeGreaterThan(expected - 0.01);
    expect(near / group.count).toBeLessThan(expected + 0.01);
    console.info(`CLUMP ${settings.stream.concentration.status} fraction=${fraction} widthDeg=${widthDeg} nearShare=${(near / group.count).toFixed(4)} cometMeanAnomalyDeg=${phase.toFixed(2)}`);
    expect(streamLimitations(settings).join(" ")).toContain(`clump near ${settings.parentBody} is a model`);
  });

  for (const set of ["all", "reliable"] as const) it(`DW2(a), ${set} orbits: Earth is nearest the measured stream orbits within 2 days of the published peak (solar longitude 140.1)`, () => {
    const members = rowsFor(set).map((row) => ellipseOf(row[3], row[4], row[5], row[6], row[7]));
    const startMs = Date.parse(settings.activity.startUtc);
    const endMs = Date.parse(settings.activity.endUtc);
    const days: number[] = [];
    for (let t = peakPublished - 6 * DAY_MS; t <= peakPublished + 6 * DAY_MS; t += DAY_MS) days.push(t);
    expect(days[0]).toBeGreaterThan(startMs);
    expect(days[days.length - 1]).toBeLessThan(endMs);
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
      return { t, meanNearest, within001: distances.filter((d) => d < 0.01).length, nearest: distances[0], reaching: distances.length };
    });
    let best = 0;
    rows.forEach((row, k) => { if (row.meanNearest < rows[best].meanNearest) best = k; });
    // Parabola through the minimum and its two neighbours for a fractional-day estimate.
    const [y0, y1, y2] = [rows[best - 1].meanNearest, rows[best].meanNearest, rows[best + 1].meanNearest];
    const offsetDays = (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2);
    const minimumMs = rows[best].t + offsetDays * DAY_MS;
    const densest = rows.reduce((m, row) => (row.within001 > m.within001 ? row : m), rows[0]);
    const deltaDays = (minimumMs - peakPublished) / DAY_MS;
    console.info(`[${set}] DW2a published peak (solar longitude ${settings.radiant.peakSolarLongitudeDeg}) = ${new Date(peakPublished).toISOString()}; Earth's solar longitude there = ${solarLongitudeDeg(adapter, toEqj, peakPublished).toFixed(3)}`);
    console.info(`[${set}] DW2a mean distance of the ${NEAREST} nearest measured ellipses is smallest on ${new Date(rows[best].t).toISOString().slice(0, 10)} (${rows[best].meanNearest.toFixed(5)} AU), fitted minimum ${new Date(minimumMs).toISOString()}, ${deltaDays.toFixed(2)} days from the published peak`);
    console.info(`[${set}] DW2a most ellipses within 0.01 AU of Earth (${densest.within001}) on ${new Date(densest.t).toISOString().slice(0, 10)}; nearest single ellipse that day ${densest.nearest.toFixed(6)} AU`);
    console.info(`[${set}] DW2a daily table (UTC date, solar longitude, mean of ${NEAREST} nearest AU, ellipses within 0.01 AU): ${rows.map((r) => `${new Date(r.t).toISOString().slice(5, 10)} ${solarLongitudeDeg(adapter, toEqj, r.t).toFixed(1)} ${r.meanNearest.toFixed(5)} ${r.within001}`).join(" | ")}`);
    expect(Math.abs(deltaDays)).toBeLessThanOrEqual(2);
    expect(Math.abs((densest.t - peakPublished) / DAY_MS)).toBeLessThanOrEqual(2);
  }, 120_000);

  for (const set of ["all", "reliable"] as const) it(`DW2(b), ${set} orbits: the radiant from the orbits crossing Earth's at the peak is within 3 degrees of the published one (RA 47.9, Dec +57.9)`, () => {
    const earth = earthEcliptic(adapter, toEqj, peakPublished);
    const CROSSING_AU = 0.02;
    const radiants: { x: number; y: number; z: number; speed: number }[] = [];
    for (const row of rowsFor(set)) {
      const orbit = ellipseOf(row[3], row[4], row[5], row[6], row[7]);
      const hit = nearestPoint(orbit, earth.position);
      if (hit === null || hit.distanceKm / AU_KM > CROSSING_AU) continue;
      const vp = velocityOn(orbit, hit.nu);
      // Geocentric velocity of the meteoroid, then the direction it comes from (the opposite way), in the equatorial J2000 frame.
      const u = [vp[0] - earth.velocity[0], vp[1] - earth.velocity[1], vp[2] - earth.velocity[2]];
      const from = apply(toEqj, [-u[0], -u[1], -u[2]]);
      const norm = Math.hypot(from[0], from[1], from[2]);
      radiants.push({ x: from[0] / norm, y: from[1] / norm, z: from[2] / norm, speed: Math.hypot(u[0], u[1], u[2]) });
    }
    const sum = radiants.reduce((s, r) => ({ x: s.x + r.x, y: s.y + r.y, z: s.z + r.z }), { x: 0, y: 0, z: 0 });
    const found = raDecOf([sum.x, sum.y, sum.z]);
    const sorted = <K extends "speed">(key: K) => radiants.map((r) => r[key]).sort((a, b) => a - b);
    const medianSpeed = sorted("speed")[Math.floor(radiants.length / 2)];
    const published = { raDeg: settings.radiant.raDeg, decDeg: settings.radiant.decDeg };
    const off = separationDeg(found, published);
    console.info(`[${set}] DW2b ${radiants.length} members within ${CROSSING_AU} AU of Earth at ${new Date(peakPublished).toISOString()}; radiant RA ${found.raDeg.toFixed(2)} Dec ${found.decDeg.toFixed(2)} (mean direction), geocentric speed median ${medianSpeed.toFixed(2)} km/s; published RA ${published.raDeg} Dec ${published.decDeg}; separation ${off.toFixed(2)} deg`);
    expect(radiants.length).toBeGreaterThan(100);
    expect(off).toBeLessThan(3);
  }, 120_000);

  it("DW2(c) and (d): the comet and the planets drawn are the catalogue's own bodies", () => {
    const layer = createParentOrbitPathLayer(settings);
    const t = Date.parse(settings.activity.peakUtc);
    const catalogueComet = catalogue.get(settings.parentBodyId).source!.create(adapter);
    expect(Array.from(layer.source.stateAt(t, "sun").positionKm)).toEqual(Array.from(catalogueComet.stateAt(t, "sun").positionKm));
    expect(definition.composition!.bodies).toEqual(expect.arrayContaining(["sun", "earth", "mercury", "venus", "mars", "jupiter", settings.parentBodyId]));
  });

  it("fills every dot quickly enough to draw them all (an indication only; the frame rate on the owner's machine is the owner's to measure)", () => {
    const out = new Float64Array(3 * group.count);
    const t0 = performance.now();
    for (let k = 0; k < 5; k += 1) group.fillPositionsKm(Date.parse(settings.activity.peakUtc) + k * DAY_MS, out);
    const ms = (performance.now() - t0) / 5;
    console.info(`FILL ${group.count} members: ${ms.toFixed(1)} ms per exact fill`);
    expect(ms).toBeLessThan(100);
  });
});
