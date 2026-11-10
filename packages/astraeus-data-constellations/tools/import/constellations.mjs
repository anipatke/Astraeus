// Rebuilds packages/astraeus-data-constellations/data from PINNED sources (O-067 T-304):
//   node packages/astraeus-data-constellations/tools/import/constellations.mjs [--cache <dir>] [--out <dir>]
// Fetches (or reads from the cache folder, checking each file's SHA-256) three downloads, treats them as untrusted data (parsed, never run), writes
// figures.json, boundaries.json, names.json and provenance.json, and fails if the boundary cross-check against CDS VI/49 is above its tolerance.
//   1. Stellarium `skycultures/modern_iau/index.json` at a pinned commit: the IAU / Sky & Telescope stick figures (Hipparcos numbers) and the Delporte (1930)
//      boundary edges at B1875 (CC BY-SA 4.0).
//   2. The IAU constellations page, archived 2025-01-08: the name, abbreviation, English name and genitive table (CC BY 4.0, credit "IAU").
//   3. CDS VI/49 `bound_20.dat.gz` (Davenhall and Leggett 1989): used only to check our J2000 boundaries; nothing of it is shipped.
// Re-running with the same pins gives byte-identical files (no dates are written).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(here, "..", "..");
const STAR_FILE = resolve(packageDir, "..", "astraeus", "src", "assets", "stars", "hyg-v42-naked-eye.json");

export const STELLARIUM_COMMIT = "dc5679c9723685585196c4d6ecd7ffd33da59ecd";
export const SOURCES = {
  stellarium: {
    file: "stellarium-modern_iau-index.json",
    url: `https://raw.githubusercontent.com/Stellarium/stellarium/${STELLARIUM_COMMIT}/skycultures/modern_iau/index.json`,
    sha256: "2b7aa4fa2860566ea68aca0c0b087ba815aea38a92d1bb9b3c04b6c0758f726b",
  },
  iau: {
    file: "iau-constellations-20250108.html",
    url: "https://web.archive.org/web/20250108164011id_/https://www.iau.org/public/themes/constellations/",
    sha256: "bdd1ddc5215aece2c8d54df5e2682a9fc032b176ced8262776e975896d4a9c88",
  },
  vizier: {
    file: "vizier-VI49-bound_20.dat.gz",
    url: "https://vizier.cfa.harvard.edu/ftp/cats/VI/49/bound_20.dat.gz",
    sha256: "879cd6e7a1c908f1e19a5f5fe8cc75fb1d1077564e3890f9152a3680affe9aac",
  },
};

/** The step along a boundary edge before the next point is added, in degrees (the importer's "about 1 degree"). */
export const STEP_DEG = 1;
/** A parallel edge's step at declination 45 degrees or less is capped by this (see edgePoints): 1.5 degrees gives a bow of about 0.005 degree where tan(dec) is 1. */
const CHORD_STEP_DEG = 1.51;
/** The importer fails if a shipped outline's straight lines lie further than this from the true edge. */
export const CHORD_LIMIT_DEG = 0.01;
/** The cross-check fails above this many degrees (36 arcseconds); the measured maximum is far below it and is recorded in provenance.json. */
export const TOLERANCE_DEG = 0.01;
/** Coordinates are stored to 3 decimals (3.6 arcseconds) for boundaries and 5 decimals (0.04 arcseconds) for star positions. */
const BOUNDARY_DECIMALS = 3;
const STAR_DECIMALS = 5;
/** Figure ends the engine's star list holds without a Hipparcos number: the position is that list's own row (checked to exist), so the end sits on the star. */
const POSITION_ENDS = { 55203: { name: "xi Ursae Majoris (Alula Australis)", raDeg: 169.54677, decDeg: 31.52878 } };

const rad = Math.PI / 180;
const round = (value, decimals) => Number(value.toFixed(decimals));

async function fetched(source, cache) {
  const path = join(cache, source.file);
  if (!existsSync(path)) {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
    mkdirSync(cache, { recursive: true });
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = readFileSync(path);
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== source.sha256) throw new Error(`${path}: SHA-256 ${sha} is not the pinned ${source.sha256} (delete the cached file to fetch again, or update the pin on purpose)`);
  return bytes;
}

// ---- Precession (IAU 1976, Lieske) from B1875.0 to J2000.0 ----

/** The rotation matrix that carries equatorial unit vectors of equator and equinox B1875.0 to J2000.0 (IAU 1976 precession angles, `t` centuries from the start epoch). */
export function precessionB1875ToJ2000() {
  const startJd = 2405889.25855; // B1875.0
  const T = (startJd - 2451545.0) / 36525;
  const t = -T;
  const arcsec = rad / 3600;
  const zeta = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t + (0.30188 - 0.000344 * T) * t * t + 0.017998 * t ** 3) * arcsec;
  const z = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t + (1.09468 + 0.000067 * T) * t * t + 0.018203 * t ** 3) * arcsec;
  const theta = ((2004.3109 - 0.8533 * T - 0.000217 * T * T) * t - (0.42665 + 0.000217 * T) * t * t - 0.041833 * t ** 3) * arcsec;
  const [cz, sz, cth, sth, cze, sze] = [Math.cos(z), Math.sin(z), Math.cos(theta), Math.sin(theta), Math.cos(zeta), Math.sin(zeta)];
  return [
    [cz * cth * cze - sz * sze, -cz * cth * sze - sz * cze, -cz * sth],
    [sz * cth * cze + cz * sze, -sz * cth * sze + cz * cze, -sz * sth],
    [sth * cze, -sth * sze, cth],
  ];
}

export const unit = (raDeg, decDeg) => [Math.cos(decDeg * rad) * Math.cos(raDeg * rad), Math.cos(decDeg * rad) * Math.sin(raDeg * rad), Math.sin(decDeg * rad)];
const apply = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const angleDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / rad;
const toRaDec = (v) => [((Math.atan2(v[1], v[0]) / rad) + 360) % 360, Math.asin(Math.max(-1, Math.min(1, v[2]))) / rad];

/** Angular distance in degrees from unit vector `p` to the great-circle segment `a`-`b` (short, under 90 degrees). */
export function distanceToSegmentDeg(p, a, b) {
  const n = cross(a, b);
  const length = Math.hypot(...n);
  if (length < 1e-12) return angleDeg(p, a);
  const nn = n.map((x) => x / length);
  if (dot(cross(a, p), nn) >= 0 && dot(cross(p, b), nn) >= 0) return Math.abs(Math.asin(Math.max(-1, Math.min(1, dot(p, nn))))) / rad;
  return Math.min(angleDeg(p, a), angleDeg(p, b));
}

// ---- Stellarium: figures and boundary edges ----

const hms = (text) => {
  const [h, m, s] = text.split(":").map(Number);
  return (h + m / 60 + s / 3600) * 15;
};
const dms = (text) => {
  const sign = text.startsWith("-") ? -1 : 1;
  const [d, m, s] = text.replace(/^[+-]/, "").split(":").map(Number);
  return sign * (d + m / 60 + s / 3600);
};

/** `"001:002 M+ 22:52:00 +34:30:00 22:52:00 +52:30:00 AND LAC"`: corner ids, meridian (`M`) or parallel (`P`), the two corners at B1875, the two constellations. */
export function parseEdge(line) {
  const [ids, kind, ra1, dec1, ra2, dec2, left, right] = line.trim().split(/\s+/);
  const [from, to] = ids.split(":");
  const a = { id: from, ra: hms(ra1), dec: dms(dec1) };
  const b = { id: to, ra: hms(ra2), dec: dms(dec2) };
  if (kind === "M+" && a.ra !== b.ra) throw new Error(`edge ${line}: a meridian edge changes right ascension`);
  if (kind === "P+" && a.dec !== b.dec) throw new Error(`edge ${line}: a parallel edge changes declination`);
  if (kind !== "M+" && kind !== "P+") throw new Error(`edge ${line}: unknown kind ${kind}`);
  return { kind: kind[0], a, b, codes: [left, right] };
}

/** One closed ring of corners per boundary code (`SER1`, `SER2` are Serpens' two parts), as `{ a, b, kind }` edges walked in order, each oriented along the walk. */
export function chainRings(edges) {
  const byCode = new Map();
  for (const edge of edges) for (const code of edge.codes) byCode.set(code, [...(byCode.get(code) ?? []), edge]);
  const rings = new Map();
  for (const [code, list] of byCode) {
    const at = new Map();
    for (const edge of list) for (const corner of [edge.a.id, edge.b.id]) at.set(corner, [...(at.get(corner) ?? []), edge]);
    for (const [corner, touching] of at) if (touching.length !== 2) throw new Error(`${code}: corner ${corner} has ${touching.length} edges, a closed outline needs 2`);
    const walk = [];
    const used = new Set();
    let edge = list[0];
    let from = edge.a;
    while (!used.has(edge)) {
      used.add(edge);
      const to = edge.a.id === from.id ? edge.b : edge.a;
      walk.push({ kind: edge.kind, a: from, b: to });
      from = to;
      edge = at.get(to.id).find((one) => !used.has(one)) ?? edge;
    }
    if (walk.length !== list.length) throw new Error(`${code}: the edges form more than one outline`);
    if (walk.at(-1).b.id !== walk[0].a.id) throw new Error(`${code}: the outline does not close`);
    rings.set(code, walk);
  }
  return rings;
}

/** The points of an edge at B1875 from `a` up to (not including) `b`, at most `stepDeg` of arc apart (less near a pole on a parallel). A parallel edge keeps its declination and a meridian edge its right ascension. */
export function edgePoints(edge, stepDeg) {
  const { a, b, kind } = edge;
  let dRa = ((b.ra - a.ra + 540) % 360) - 180;
  if (kind === "M") dRa = 0;
  const dDec = b.dec - a.dec;
  const length = kind === "M" ? Math.abs(dDec) : Math.abs(dRa) * Math.cos(a.dec * rad);
  // A parallel is not a great circle: a straight chord of length L bows off it by about L^2 tan(dec) / 8, so near a pole the step shrinks to keep the bow under about 0.005 degree.
  const step = kind === "P" ? Math.min(stepDeg, CHORD_STEP_DEG / Math.sqrt(Math.max(1, Math.tan(Math.abs(a.dec) * rad)))) : stepDeg;
  const n = Math.max(1, Math.ceil(length / step - 1e-9));
  return Array.from({ length: n }, (_, k) => [(a.ra + (dRa * k) / n + 360) % 360, a.dec + (dDec * k) / n]);
}

/** A ring as J2000 `[raDeg, decDeg]` points, `stepDeg` apart along each edge. */
export function ringJ2000(walk, stepDeg, matrix) {
  return walk.flatMap((edge) => edgePoints(edge, stepDeg)).map(([ra, dec]) => toRaDec(apply(matrix, unit(ra, dec))));
}

/** Drops zero-length and repeated steps (either direction) of Stellarium's polylines; returns the pairs of Hipparcos numbers and the counts dropped. */
export function figureSteps(lines) {
  const seen = new Set();
  const pairs = [];
  const counts = { steps: 0, zeroLength: 0, repeated: 0 };
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i += 1) {
      counts.steps += 1;
      const [p, q] = [line[i], line[i + 1]];
      if (p === q) { counts.zeroLength += 1; continue; }
      const key = p < q ? `${p}-${q}` : `${q}-${p}`;
      if (seen.has(key)) { counts.repeated += 1; continue; }
      seen.add(key);
      pairs.push([p, q]);
    }
  }
  return { pairs, counts };
}

// ---- Names (IAU table) ----

const entities = { "&amp;": "&", "&nbsp;": " ", "&#8217;": "'", "&rsquo;": "'", "&lt;": "<", "&gt;": ">", "&quot;": "\"" };
const plain = (html) => html.replace(/<em>.*?<\/em>/gs, "").replace(/<[^>]*>/g, " ").replace(/&[#\w]+;/g, (e) => entities[e] ?? e).replace(/\s+/g, " ").trim();

/** The IAU page's table: `{ Abbr: { name, english, genitive } }` for the 88 constellations. */
export function parseNames(html) {
  const names = {};
  for (const row of html.match(/<tr>.*?<\/tr>/gs) ?? []) {
    const cells = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((one) => one[1]);
    if (cells.length < 4) continue;
    // The pronunciation follows the name's anchor (name cell) or a line break or paragraph (genitive cell); only the name and the genitive are kept.
    const [name, abbr, english, genitive] = [plain(cells[0].split(/<a name=/)[0]), plain(cells[1]), plain(cells[2]), plain(cells[3].replace(/^\s*<p>/, "").split(/<br\s*\/?>|<\/p>/)[0])];
    if (!/^[A-Z][A-Za-z]{2}$/.test(abbr)) continue;
    names[abbr] = { name, english, genitive };
  }
  return names;
}

// ---- Cross-check against CDS VI/49 bound_20 ----

/** Parses `bound_20.dat` rows (`raDeg decDeg CODE flag`; flag `O` for an original corner, `I` for an interpolated point). */
export function parseVizier(text) {
  return text.split("\n").filter((line) => line.trim() !== "").map((line) => {
    const [ra, dec, code, flag] = line.trim().split(/\s+/);
    return { ra: Number(ra), dec: Number(dec), code, flag };
  });
}

/**
 * The largest distance, in degrees, from a VI/49 point to our outline of the same code, drawn from points `fineDeg` apart so that the curve is followed closely (the shipped outline
 * is coarser; its own drift is measured separately). Also the largest distance from an original VI/49 corner to the nearest corner of ours, and the corner counts.
 */
export function crossCheck(vizier, ringsByCode, corners) {
  let outline = { deg: 0, code: "" };
  let corner = { deg: 0, code: "" };
  const originals = new Map();
  for (const row of vizier) {
    const p = unit(row.ra, row.dec);
    const ring = ringsByCode.get(row.code);
    if (ring === undefined) throw new Error(`VI/49 code ${row.code} has no outline of ours`);
    let best = Infinity;
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      if (dot(p, a) < 0.99) continue; // only segments within about 8 degrees can be the nearest
      best = Math.min(best, distanceToSegmentDeg(p, a, ring[(i + 1) % ring.length]));
    }
    if (best > outline.deg) outline = { deg: best, code: row.code };
    if (row.flag === "O") {
      originals.set(row.code, (originals.get(row.code) ?? 0) + 1);
      const nearest = Math.min(...corners.get(row.code).map((c) => angleDeg(p, c)));
      if (nearest > corner.deg) corner = { deg: nearest, code: row.code };
    }
  }
  // The other direction: each corner of ours must be a VI/49 point (of either kind: the two polar constellations' corners are flagged interpolated there).
  const vizierByCode = new Map();
  for (const row of vizier) vizierByCode.set(row.code, [...(vizierByCode.get(row.code) ?? []), unit(row.ra, row.dec)]);
  let ours = { deg: 0, code: "" };
  for (const [code, points] of corners) {
    for (const p of points) {
      const nearest = Math.min(...vizierByCode.get(code).map((v) => angleDeg(p, v)));
      if (nearest > ours.deg) ours = { deg: nearest, code };
    }
  }
  return { outline, corner, ours, vizierOriginals: [...originals.values()].reduce((x, y) => x + y, 0), ourCorners: [...corners.values()].reduce((x, y) => x + y.length, 0) };
}

/** The largest distance in degrees between a shipped outline's chords and the same edges drawn finely: what drawing straight lines between the stored points costs. */
export function chordDrift(walk, matrix) {
  const coarse = walk.flatMap((edge) => edgePoints(edge, STEP_DEG).map((q) => ({ edge, q })));
  const fine = ringJ2000(walk, 0.02, matrix).map((p) => unit(...p));
  const vectors = coarse.map(({ q }) => unit(...toRaDec(apply(matrix, unit(q[0], q[1])))));
  let worst = 0;
  for (const p of fine) {
    let best = Infinity;
    for (let i = 0; i < vectors.length; i += 1) {
      if (dot(p, vectors[i]) < 0.99) continue;
      best = Math.min(best, distanceToSegmentDeg(p, vectors[i], vectors[(i + 1) % vectors.length]));
    }
    worst = Math.max(worst, best);
  }
  return worst;
}

// ---- Run ----

function resolveEnds(figures, hips, starRows) {
  const positions = {};
  const out = {};
  for (const [abbr, pairs] of Object.entries(figures)) {
    out[abbr] = pairs.map((pair) => pair.map((hip) => {
      if (hips.has(hip)) return hip;
      const known = POSITION_ENDS[hip];
      if (known === undefined || !starRows.some((row) => row[0] === known.raDeg && row[1] === known.decDeg)) throw new Error(`${abbr}: HIP ${hip} is not in the engine star list and has no recorded position`);
      positions[hip] = known.name;
      return [known.raDeg, known.decDeg].map((x) => round(x, STAR_DECIMALS));
    }));
  }
  return { out, positions };
}

const flat = (ring) => ring.flatMap(([ra, dec]) => [round(ra, BOUNDARY_DECIMALS), round(dec, BOUNDARY_DECIMALS)]);
const json = (value) => `${JSON.stringify(value)}\n`;

export async function run({ cache, out }) {
  const stellarium = JSON.parse((await fetched(SOURCES.stellarium, cache)).toString("utf8"));
  const iauHtml = (await fetched(SOURCES.iau, cache)).toString("utf8");
  const vizier = parseVizier(gunzipSync(await fetched(SOURCES.vizier, cache)).toString("latin1"));
  const starRows = JSON.parse(readFileSync(STAR_FILE, "utf8")).stars;
  const hips = new Set(starRows.map((row) => row[4]).filter((hip) => hip > 0));

  const names = parseNames(iauHtml);
  const abbrs = Object.keys(names).sort();
  if (abbrs.length !== 88) throw new Error(`the IAU table has ${abbrs.length} constellations, not 88`);
  const nameMismatch = stellarium.constellations.filter((c) => names[c.id.split(" ").at(-1)]?.name !== c.common_name?.native).map((c) => c.id);

  const stepsOf = {};
  const totals = { steps: 0, zeroLength: 0, repeated: 0 };
  for (const c of stellarium.constellations) {
    const abbr = c.id.split(" ").at(-1);
    if (names[abbr] === undefined) throw new Error(`Stellarium ${abbr} is not in the IAU table`);
    const { pairs, counts } = figureSteps(c.lines);
    stepsOf[abbr] = pairs;
    for (const key of Object.keys(totals)) totals[key] += counts[key];
  }
  if (Object.keys(stepsOf).sort().join() !== abbrs.join()) throw new Error("Stellarium's figures and the IAU table name different constellations");
  const { out: figures, positions } = resolveEnds(stepsOf, hips, starRows);

  const matrix = precessionB1875ToJ2000();
  const walks = chainRings(stellarium.edges.map(parseEdge));
  const boundaries = {};
  const fineByCode = new Map();
  const cornersByCode = new Map();
  let drift = 0;
  let pointCount = 0;
  for (const [code, walk] of [...walks].sort(([x], [y]) => (x < y ? -1 : 1))) {
    const abbr = code.replace(/\d$/, "");
    const key = abbrs.find((one) => one.toUpperCase() === abbr);
    if (key === undefined) throw new Error(`boundary code ${code} is in no IAU abbreviation`);
    const ring = ringJ2000(walk, STEP_DEG, matrix);
    pointCount += ring.length;
    boundaries[key] = [...(boundaries[key] ?? []), flat(ring)];
    fineByCode.set(code, ringJ2000(walk, 0.05, matrix).map((p) => unit(...p)));
    cornersByCode.set(code, walk.map((edge) => unit(...toRaDec(apply(matrix, unit(edge.a.ra, edge.a.dec))))));
    drift = Math.max(drift, chordDrift(walk, matrix));
  }
  if (Object.keys(boundaries).length !== 88) throw new Error(`${Object.keys(boundaries).length} boundary groups, not 88`);

  if (drift > CHORD_LIMIT_DEG) throw new Error(`a shipped outline's chords lie ${drift.toFixed(4)} degrees from its edge, above ${CHORD_LIMIT_DEG}`);
  const check = crossCheck(vizier, fineByCode, cornersByCode);
  const maxDifference = Math.max(check.outline.deg, check.corner.deg, check.ours.deg);
  if (maxDifference > TOLERANCE_DEG) throw new Error(`boundary cross-check failed: ${maxDifference.toFixed(5)} degrees is above ${TOLERANCE_DEG} (outline ${check.outline.code}, corner ${check.corner.code})`);

  const provenance = buildProvenance({ totals, figures, positions, boundaries, pointCount, check, drift, nameMismatch, walks, stellarium });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "figures.json"), json(figures));
  writeFileSync(join(out, "boundaries.json"), json(boundaries));
  writeFileSync(join(out, "names.json"), json(Object.fromEntries(abbrs.map((abbr) => [abbr, names[abbr]]))));
  writeFileSync(join(out, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
  return provenance;
}

function buildProvenance({ totals, figures, positions, boundaries, pointCount, check, drift, nameMismatch, walks, stellarium }) {
  const lines = Object.values(figures).reduce((sum, pairs) => sum + pairs.length, 0);
  const ends = Object.values(figures).flat(2);
  const hipEnds = ends.filter((end) => typeof end === "number").length;
  return {
    package: "astraeus-data-constellations",
    generator: "tools/import/constellations.mjs (rerun it to rebuild every file here; the pins below are checked by SHA-256)",
    sources: {
      figures: {
        what: "IAU constellation stick figures (drawn for the IAU by Sky & Telescope, Alan MacRobert; Roger Sinnott and Rick Fienberg), as Hipparcos-number lists typed in by the Stellarium team",
        from: `Stellarium skycultures/modern_iau/index.json at commit ${STELLARIUM_COMMIT}`,
        url: SOURCES.stellarium.url,
        sha256: SOURCES.stellarium.sha256,
        licence: "CC BY-SA 4.0",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      },
      boundaries: {
        what: "IAU constellation boundaries: the corner points of Delporte (1930), epoch B1875, as published in the same Stellarium file",
        from: `Stellarium skycultures/modern_iau/index.json at commit ${STELLARIUM_COMMIT} (edges, edges_source ${stellarium.edges_source})`,
        licence: "CC BY-SA 4.0",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        reference: "Delporte, E. 1930, Delimitation scientifique des constellations (Cambridge University Press); Davenhall and Leggett 1989, CDS catalogue VI/49",
      },
      names: {
        what: "IAU constellation names, abbreviations, English names and genitives",
        from: "IAU constellations page, Internet Archive copy of 2025-01-08 (the page is no longer on iau.org)",
        url: SOURCES.iau.url,
        sha256: SOURCES.iau.sha256,
        licence: "CC BY 4.0",
        licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
        credit: "IAU",
      },
      crossCheck: {
        what: "CDS VI/49 bound_20.dat (Davenhall and Leggett 1989), used only to check the J2000 boundaries; none of it is shipped",
        url: SOURCES.vizier.url,
        sha256: SOURCES.vizier.sha256,
      },
    },
    changes: [
      "Figures: each polyline split into steps; 4 zero-length and 87 repeated steps dropped; ends kept as Hipparcos numbers where the engine's star list holds the star, otherwise given as a J2000 position.",
      `Boundaries: edges chained into one closed outline per constellation (Serpens has two); points added every ${STEP_DEG} degree of arc or less along each edge (meridian edges at constant right ascension, parallel edges at constant declination, as Delporte drew them); every point precessed from B1875.0 to J2000 with the IAU 1976 precession angles; stored to ${BOUNDARY_DECIMALS} decimals as flat right ascension, declination pairs in degrees. The last point joins the first; it is not repeated.`,
      "Names: the four columns of the IAU table kept as published (the pronunciation text dropped).",
    ],
    counts: {
      constellations: Object.keys(figures).length,
      figureSteps: totals.steps,
      figureStepsZeroLengthDropped: totals.zeroLength,
      figureStepsRepeatedDropped: totals.repeated,
      figureLines: lines,
      figureEnds: ends.length,
      figureEndsAsHipparcos: hipEnds,
      figureEndsAsPosition: ends.length - hipEnds,
      positionEnds: Object.entries(positions).map(([hip, name]) => ({ hip: Number(hip), star: name })),
      boundaryOutlines: [...walks.keys()].length,
      boundaryOutlinesByConstellation: { Ser: boundaries.Ser.length },
      boundaryEdges: stellarium.edges.length,
      boundaryPoints: pointCount,
      namesNotMatchingStellariumNative: nameMismatch,
    },
    crossCheck: {
      toleranceDegrees: TOLERANCE_DEG,
      maxPointToOutlineDegrees: round(check.outline.deg, 6),
      maxPointToOutlineAt: check.outline.code,
      maxCornerToCornerDegrees: round(check.corner.deg, 6),
      maxCornerToCornerAt: check.corner.code,
      vizierOriginalCorners: check.vizierOriginals,
      ourCorners: check.ourCorners,
      maxOurCornerToVizierPointDegrees: round(check.ours.deg, 4),
      maxShippedChordDriftDegrees: round(drift, 5),
      method: "Every VI/49 J2000 point (original and interpolated) is compared with our outline of the same code drawn at 0.05 degree spacing (distance to the nearest great-circle segment); every original VI/49 corner is compared with the nearest corner of ours. In the other direction, every corner of ours is compared with the nearest VI/49 point of the same code (of either kind: the two polar constellations' corners are flagged interpolated there, which is why 29 more corners are ours than original VI/49 corners). The chord drift is how far the shipped outline's straight lines lie from the same edges drawn at 0.02 degrees.",
    },
    precession: "IAU 1976 (Lieske) precession angles from B1875.0 (JD 2405889.25855) to J2000.0; no FK4 to FK5 equinox correction (about 0.07 arcseconds).",
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (name, fallback) => {
    const at = process.argv.indexOf(name);
    return at >= 0 ? resolve(process.argv[at + 1]) : fallback;
  };
  const provenance = await run({ cache: arg("--cache", join(tmpdir(), "astraeus-constellations-cache")), out: arg("--out", join(packageDir, "data")) });
  console.log(JSON.stringify({ counts: provenance.counts, crossCheck: provenance.crossCheck }, null, 2));
}
