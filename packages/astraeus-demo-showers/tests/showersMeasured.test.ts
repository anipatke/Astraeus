import { beforeAll, describe, expect, it } from "vitest";
import { groupsOf, sunCentredOf } from "astraeus/app/experienceDefinition";
import { catalogue } from "astraeus/assets/catalogue";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { createOrbTwoBodyAdapter } from "astraeus/core/twoBodyAdapter";
import { meanAnomalyFromStateRad, type ListedOrbitGroup } from "astraeus/core/listedOrbitGroup";
import { streamIdOf } from "../src/experiences/showers/showerBasics";
import { streamLimitations } from "../src/experiences/showers/showerText";
import { buildShowerDefinition } from "./helpers/showerDefinition";
import { MEASURED_ROW_COLUMNS, SHIPPED_ROW_COLUMNS, orbitSetCounts, parseMeasuredOrbits } from "../src/experiences/showers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseidsFile from "../data/showers/perseids.json";
import geminidsFile from "../data/showers/geminids.json";
import { ROW_COLUMNS, SHIPPED_COLUMNS } from "../tools/data/fetch-meteoroid-orbits.mjs";
import { SHIPPED_COL as C, readShippedFile, readShippedOrbits, readStoredShippedFile } from "./helpers/measuredOrbits";
import { AU_KM, SUN_GM_KM3_S2, apply, earthEcliptic, ellipseOf, nearestPoint, raDecOf, separationDeg, solarLongitudeDeg, timeOfSolarLongitude, velocityOn } from "astraeus/tests/helpers/streamFacts";

// The facts of each shower from the Global Meteor Network's measured orbits, read from the committed copy the public build ships
// (data/stories/<story>/gmn-iau-<code>.json), so every machine checks them. Rows are in the shipped (compact) layout; the C map names the columns.
// Published values: IAU MDC established showers, parameter set AdNo 8 (Jenniskens 2023), J2000. One parametrised suite covers both showers (O-017 T-069 C7).
import { createHash } from "node:crypto";
// SHA-256 of the [recordId, epochUtcMs, a (AU), e, i, w, node] rows (JSON) of each shipped file as it was before T-172, taken through the old file's own reader.
const OLD_MEMBERS_SHA256: Record<string, string> = {
  perseids: "36280b612ab91bca04dac5c1047956d3fa44962f07d8484c34d27ed22d953ce5",
  geminids: "00cf9c131c045380285ff6dc4ee1cf1dc6f3c22fd7c2a2f25b3d60e969a95576",
};
const DAY_MS = 86_400_000;
const adapter = createOrbAstronomyAdapter();
const medianOf = (values: number[]) => { const v = [...values].sort((a, b) => a - b); return v.length % 2 === 1 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };
const toEqj = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();

interface ShowerCase {
  readonly name: string;
  readonly story: string;
  readonly iau: number;
  readonly letters: string;
  /** MDC solar longitude of the peak (deg). */
  readonly mdcSolarLongitudeDeg: number;
  readonly minRows: number;
  readonly settings: ReturnType<typeof parseShowerSettings>;
}

const CASES: readonly ShowerCase[] = [
  { name: "Perseids", story: "perseids", iau: 7, letters: "PER", mdcSolarLongitudeDeg: 140.1, minRows: 0, settings: parseShowerSettings(perseidsFile) },
  { name: "Geminids", story: "geminids", iau: 4, letters: "GEM", mdcSolarLongitudeDeg: 261.6, minRows: 40_000, settings: parseShowerSettings(geminidsFile) },
];

it("keeps the settings-side row columns equal to the fetch tool's", () => {
  expect([...MEASURED_ROW_COLUMNS]).toEqual([...ROW_COLUMNS]);
  expect([...SHIPPED_ROW_COLUMNS]).toEqual([...SHIPPED_COLUMNS]);
});

describe.each(CASES)("$name from the shipped GMN orbits", ({ story, iau, letters, mdcSolarLongitudeDeg, minRows, settings }) => {
  const file = readShippedFile(story, iau);
  const orbits = readShippedOrbits(story, iau);
    // The shipped files carry no quality columns (T-172): one set, every bound orbit.
  const rowsFor = (_set: "all") => file.rows;
  const peakPublished = timeOfSolarLongitude(adapter, toEqj, settings.radiant.peakSolarLongitudeDeg, Date.parse(settings.activity.startUtc), Date.parse(settings.activity.endUtc));

  it("holds the files the settings name, CC BY 4.0, with the two citations, hashes and the counts, and parses as the builder's input", () => {
    const { provenance } = file;
    expect(provenance.iauCode).toBe(iau);
    expect(provenance.iauLetters).toBe(letters);
    expect(provenance.licence).toBe("CC BY 4.0");
    expect(provenance.citations).toHaveLength(2);
    expect(provenance.files.map((f: { month: string }) => f.month)).toEqual(settings.stream.sources.gmn.months);
    for (const f of provenance.files) { expect(f.sha256).toMatch(/^[0-9a-f]{64}$/); expect(f.bytes).toBeGreaterThan(1_000_000); }
    expect(provenance.counts.members).toBe(provenance.counts.unbound + provenance.counts.incomplete + provenance.counts.badSemiMajorAxis + provenance.counts.kept);
    expect(file.rows).toHaveLength(provenance.counts.kept);
    expect(file.rows.length).toBeGreaterThan(minRows);
    expect(parseMeasuredOrbits(readStoredShippedFile(story, iau), iau).members).toHaveLength(provenance.counts.kept);
    console.info(`${letters} GMN COUNTS ${JSON.stringify(provenance.counts)}`);
  });

  it("holds exactly the members of the file shipped before the id trim and the quality columns were dropped", () => {
    const stored = readStoredShippedFile(story, iau);
    expect(stored.provenance.recordIds).toBe("time-trimmed");
    expect(stored.provenance.columns).toEqual([...SHIPPED_COLUMNS]);
    const rows = file.rows.map((row) => row.slice(0, 7));
    expect(orbits.members.map((m) => [m.recordId, m.epochUtcMs])).toEqual(rows.map((row) => row.slice(0, 2)));
    expect(orbits.members.map((m) => m.elements.semiMajorAxisKm)).toEqual(rows.map((row) => row[2] * AU_KM));
    expect(createHash("sha256").update(JSON.stringify(rows)).digest("hex")).toBe(OLD_MEMBERS_SHA256[story]);
    // Ids whose time differs from the epoch's are stored in full; every other id is stored from the underscore on.
    const full = (stored.rows[0] as string[]).filter((id) => !id.startsWith("_")).length;
    expect(full).toBeGreaterThan(0);
    expect(full).toBeLessThan(stored.rows[0].length / 100);
  });

  it("is drawn from the GMN file by the builder, with the source, licence and counts in the panel, and one set, as the file has no quality columns", () => {
    const group = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits }))[0].group as ListedOrbitGroup;
    expect(group.count).toBe(file.rows.length);
    const counts = orbitSetCounts(orbits, settings.stream.quality.rule);
    expect(counts).toEqual({ all: file.rows.length, reliable: null, cut: null });
    console.info(`${letters} GMN SETS ${JSON.stringify(counts)}`);
    const panel = streamLimitations(settings, counts, orbits.provenance).join(" ");
    const sourced = `${group.provenance.sources.join(" ")} ${group.provenance.notes}`;
    expect(sourced).toContain("Global Meteor Network");
    expect(sourced).toContain("CC BY 4.0");
    expect(sourced).toContain(`${file.provenance.counts.kept} bound orbits in the file`);
    expect(panel).not.toContain("CC BY 4.0");
    expect(panel).toContain("Qc");
    expect(panel).toContain(file.provenance.shipped.qualityCounts);
    expect(file.provenance.shipped.droppedColumns).toEqual(expect.arrayContaining(["convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS"]));
    expect(panel).not.toContain("double entries are kept");
  });

  // I-083: the solar longitude of each row is worked out once, in a hook with a stated limit (51,115 Geminids rows take about 2 s alone and
  // over 5 s under test:full with coverage and every file in parallel, past the 5 s default), then binned twice. The facts checked are unchanged.
  const longitudes: Record<"all", number[]> = { all: [] };
  beforeAll(() => { longitudes.all = rowsFor("all").map((r) => solarLongitudeDeg(adapter, toEqj, r[C.epochUtcMs])); }, 120_000);

  for (const set of ["all"] as const) it(`DW3(ii), ${set} orbits: the busiest solar-longitude bin (0.5 deg) is within 1 degree of the MDC's ${mdcSolarLongitudeDeg} (J2000)`, () => {
    const busiest = (binDeg: number) => {
      const bins = new Map<number, number>();
      for (const lon of longitudes[set]) { const k = Math.floor(lon / binDeg); bins.set(k, (bins.get(k) ?? 0) + 1); }
      return [...bins.entries()].reduce((m, e) => (e[1] > m[1] ? e : m));
    };
    const [bestBin, count] = busiest(0.5);
    const [bestDeg, countDeg] = busiest(1);
    const centre = bestBin * 0.5 + 0.25;
    console.info(`[${set}] ${letters} GMN busiest solar-longitude bin: 0.5 deg bin ${(bestBin * 0.5).toFixed(1)}-${(bestBin * 0.5 + 0.5).toFixed(1)} (${count} orbits, centre ${centre}); 1 deg bin ${bestDeg}-${bestDeg + 1} (${countDeg}); MDC ${mdcSolarLongitudeDeg}`);
    expect(Math.abs(centre - mdcSolarLongitudeDeg)).toBeLessThan(1);
  });

  for (const set of ["all"] as const) it(`DW3(iii), ${set} orbits: Earth is nearest the GMN stream orbits within 2 days of the published peak`, () => {
    const members = rowsFor(set).map((row) => ellipseOf(row[C.a], row[C.e], row[C.i], row[C.w], row[C.node]));
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
    const densest = rows.reduce((m, row) => (row.within001 > m.within001 ? row : m), rows[0]);
    const deltaDays = (minimumMs - peakPublished) / DAY_MS;
    console.info(`[${set}] ${letters} GMN DW3 mean distance of the ${NEAREST} nearest ellipses smallest on ${new Date(rows[best].t).toISOString().slice(0, 10)} (${rows[best].meanNearest.toFixed(5)} AU), fitted minimum ${new Date(minimumMs).toISOString()}, ${deltaDays.toFixed(2)} days from the published peak ${new Date(peakPublished).toISOString()}`);
    console.info(`[${set}] ${letters} GMN DW3 most ellipses within 0.01 AU of Earth (${densest.within001}) on ${new Date(densest.t).toISOString().slice(0, 10)}; nearest single ellipse ${densest.nearest.toFixed(6)} AU`);
    console.info(`[${set}] ${letters} GMN DW3 daily table (UTC date, solar longitude, mean of ${NEAREST} nearest AU, ellipses within 0.01 AU): ${rows.map((r) => `${new Date(r.t).toISOString().slice(5, 10)} ${solarLongitudeDeg(adapter, toEqj, r.t).toFixed(1)} ${r.meanNearest.toFixed(5)} ${r.within001}`).join(" | ")}`);
    expect(Math.abs(deltaDays)).toBeLessThanOrEqual(2);
  }, 240_000);

  for (const set of ["all"] as const) it(`DW3(iv), ${set} orbits: the radiant from GMN orbits crossing Earth's at the peak is within 3 degrees of the published radiant`, () => {
    const earth = earthEcliptic(adapter, toEqj, peakPublished);
    const CROSSING_AU = 0.02;
    const radiants: { x: number; y: number; z: number; speed: number }[] = [];
    for (const row of rowsFor(set)) {
      const orbit = ellipseOf(row[C.a], row[C.e], row[C.i], row[C.w], row[C.node]);
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
    console.info(`[${set}] ${letters} GMN DW3 ${radiants.length} members within ${CROSSING_AU} AU of Earth at ${new Date(peakPublished).toISOString()}; radiant RA ${found.raDeg.toFixed(2)} Dec ${found.decDeg.toFixed(2)}, geocentric speed median ${medianOf(radiants.map((r) => r.speed)).toFixed(2)} km/s; separation ${off.toFixed(2)} deg from RA ${settings.radiant.raDeg} Dec ${settings.radiant.decDeg}`);
    expect(radiants.length).toBeGreaterThan(100);
    expect(off).toBeLessThan(3);
  }, 240_000);
});

// Checks only the Perseids carry: their citations and per-month count, the member records and the clump, the catalogue bodies and the fill speed.
describe("Perseids: the member records, the clump and the drawing", () => {
  const { settings } = CASES[0];
  const file = readShippedFile("perseids", 7);
  const orbits = readShippedOrbits("perseids", 7);
  const definition = buildShowerDefinition(settings, { kind: "loaded", orbits });
  const group = groupsOf(definition)[0].group as ListedOrbitGroup;

  it("cites the two papers and counts the August rows; the columns are the fetch tool's shipped layout", () => {
    const { provenance } = file;
    expect(provenance.citations.join(" ")).toMatch(/506\(4\)/);
    expect(provenance.citations.join(" ")).toMatch(/491\(2\)/);
    expect(provenance.columns).toEqual([...SHIPPED_COLUMNS]);
    expect(provenance.counts.perMonth["202508"]).toBe(30_338); // the checker's count of PER rows in the Aug 2025 file
  });

  it("draws no invented member: every record id is a GMN trajectory identifier, once, with e below 1 and a above 0", () => {
    const ids = new Set<string>();
    for (const row of file.rows) {
      expect(row[C.id]).toMatch(/^\d{14}_[A-Za-z0-9]+$/);
      ids.add(row[C.id]);
      expect(row[C.e]).toBeLessThan(1);
      expect(row[C.a]).toBeGreaterThan(0);
    }
    expect(ids.size).toBe(file.rows.length);
    expect(Array.from({ length: group.count }, (_, i) => group.recordIdAt(i)).every((id) => ids.has(id))).toBe(true);
  });

  const sample = (): number[] => Array.from({ length: 20 }, (_, k) => Math.floor(((k + 0.5) * group.count) / 20));

  it("resolves a sample of 20 members to their GMN records: id and the orbit's own energy", () => {
    const byId = new Map<string, any[]>(file.rows.map((row) => [row[C.id], row]));
    const t = Date.parse(settings.activity.peakUtc);
    for (const index of sample()) {
      const id = group.recordIdAt(index);
      const row = byId.get(id)!;
      expect(row, `record ${id}`).toBeDefined();
      expect(group.stateAt(index, t).body).toBe(`${streamIdOf(settings)}:${id}`);
      // The member's orbit is the record's: its specific energy gives back the record's semi-major axis.
      const [before, after] = [t - 5_000, t + 5_000].map((time) => group.stateAt(index, time).positionKm);
      const now = group.stateAt(index, t).positionKm;
      const v = [0, 1, 2].map((k) => (after[k] - before[k]) / 10);
      const energy = (v[0] ** 2 + v[1] ** 2 + v[2] ** 2) / 2 - SUN_GM_KM3_S2 / Math.hypot(now[0], now[1], now[2]);
      const aKm = -SUN_GM_KM3_S2 / (2 * energy);
      expect(Math.abs(aKm / (row[C.a] * AU_KM) - 1)).toBeLessThan(1e-4);
    }
  });

  it("puts a stated share of the dots at the parent's orbital phase and the rest evenly round their orbits", () => {
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
    expect(streamLimitations(settings).join(" ")).toContain(`Basis of the clump near ${settings.parentBody}`);
  });

  it("DW2(c) and (d): the comet and the planets drawn are the catalogue's own bodies", () => {
    const layer = sunCentredOf(definition).paths.find((path) => path.object.id === `${settings.parentBodyId}-orbit`)!;
    const t = Date.parse(settings.activity.peakUtc);
    const catalogueComet = catalogue.get(settings.parentBodyId).source!.create(adapter);
    expect(Array.from(layer.source.stateAt(t, "sun").positionKm)).toEqual(Array.from(catalogueComet.stateAt(t, "sun").positionKm));
    expect(definition.composition!.bodies).toEqual(expect.arrayContaining(["sun", "earth", "mercury", "venus", "mars", "jupiter", settings.parentBodyId]));
  });

  it("fills every dot quickly enough to draw them all (an indication only; the frame rate on the owner's machine is the owner's to measure)", () => {
    const out = new Float64Array(3 * group.count);
    // Best of five fills: the budget is for the work itself, and a fill slowed by a busy machine (test:full runs every file in parallel) is not the work (I-083).
    let ms = Infinity;
    for (let k = 0; k < 5; k += 1) { const t0 = performance.now(); group.fillPositionsKm(Date.parse(settings.activity.peakUtc) + k * DAY_MS, out); ms = Math.min(ms, performance.now() - t0); }
    console.info(`FILL ${group.count} members: ${ms.toFixed(1)} ms per exact fill (best of 5)`);
    expect(ms).toBeLessThan(100);
  });
});
