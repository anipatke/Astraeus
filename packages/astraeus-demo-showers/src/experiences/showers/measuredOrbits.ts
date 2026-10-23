import type { ListedMember } from "astraeus/core/listedOrbitGroup";

const AU_KM = 149_597_870.7;

/** Column order of a row in the file `tools/data/fetch-meteoroid-orbits.mjs` writes (tests keep this equal to the tool's own list). */
export const MEASURED_ROW_COLUMNS = ["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"] as const;

/**
 * The earlier compact layout: the full layout without the columns the app never reads (the sheet row, the solar longitude, and the double-entry flag,
 * which is always 0 for GMN). Files in it still carry the three quality columns.
 */
export const COMPACT_ROW_COLUMNS = ["recordId", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS"] as const;

/** The layout a shipped file uses now (O-042 T-172): the orbit elements only, no quality columns. */
export const SHIPPED_ROW_COLUMNS = ["recordId", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg"] as const;

/** `provenance.recordIds` of a file whose record ids drop the time they repeat ("_uGG34" for "20250717204730_uGG34" at that epoch). */
export const TRIMMED_IDS = "time-trimmed";
const idStamp = (epochUtcMs: number): string => new Date(epochUtcMs).toISOString().slice(0, 19).replace(/[-:T]/g, "");
const restoreId = (id: string, epochUtcMs: number): string => (id.startsWith("_") ? `${idStamp(epochUtcMs)}${id}` : id);

/**
 * A shipped file may store its rows column by column (`provenance.layout` is "columns"): one array per entry of `provenance.columns`, the epoch column as
 * differences from the row before. Every value is unchanged; the layout only sends fewer bytes (T-070). The tool's `toColumns` writes it, this reads it back.
 */
export const COLUMN_LAYOUT = "columns";
function rowsFromColumns(columns: unknown, width: number): unknown {
  if (!Array.isArray(columns) || columns.length !== width || !columns.every((column) => Array.isArray(column) && column.length === columns[0].length)) return fail(`has column-wise rows that are not ${width} arrays of one length`);
  const epochs: unknown[] = [];
  (columns[1] as unknown[]).forEach((step, k) => epochs.push(k === 0 ? step : typeof step === "number" && typeof epochs[k - 1] === "number" ? (epochs[k - 1] as number) + step : Number.NaN));
  return (columns[0] as unknown[]).map((_, k) => columns.map((column, c) => (c === 1 ? epochs[k] : (column as unknown[])[k])));
}

/** Licences under which a measured-orbit file may be copied into a public build. A file with no licence, or any other, never ships. The fetch tool keeps the same list. */
export const SHIPPABLE_LICENCES = ["CC BY 4.0", "CC0 1.0"] as const;
export const isShippableLicence = (licence: unknown): boolean => typeof licence === "string" && (SHIPPABLE_LICENCES as readonly string[]).includes(licence);

/** The provenance header of a fetched file: what the tool recorded about the release and the filtering. */
export interface MeasuredOrbitProvenance {
  readonly database: string;
  readonly citation: string;
  /** The citations one by one, when the catalogue asks for more than one. */
  readonly citations?: readonly string[];
  readonly source: string;
  readonly fetchedAt: string;
  readonly iauCode: number;
  readonly filter: string;
  readonly counts: { readonly members: number; readonly unbound: number; readonly kept: number } & Readonly<Record<string, number>>;
  readonly release: { readonly bytes: number; readonly sha256: string } & Readonly<Record<string, unknown>>;
  /** Present for a catalogue with an open licence (GMN: CC BY 4.0). */
  readonly licence?: string;
  readonly licenceUrl?: string;
  /** Present in a shipped copy: the columns left out and the published quality counts as text (the file has no per-orbit quality). */
  readonly shipped?: { readonly droppedColumns?: readonly string[]; readonly qualityCounts?: string };
}

/** What the database says about how well one orbit was measured. A file shipped since T-172 carries none: `quality` is then empty. */
export interface MemberQuality {
  /** Convergence angle Q between the cameras' planes, degrees. */
  readonly convergenceAngleDeg: number;
  readonly velocityKmS: number;
  readonly velocityErrorKmS: number;
}

/** A shower's measured orbits as the group takes them, with the file's own provenance. `quality[i]` belongs to `members[i]`. */
export interface MeasuredOrbits {
  readonly provenance: MeasuredOrbitProvenance;
  readonly members: readonly ListedMember[];
  readonly quality: readonly MemberQuality[];
}

export type OrbitSet = "all" | "reliable";

/** A published quality cut: a convergence angle at least this, and a velocity error at most this fraction of the velocity. */
export interface QualityRule {
  readonly minConvergenceAngleDeg: number;
  readonly maxVelocityErrorFraction: number;
}

export const isReliable = (quality: MemberQuality, rule: QualityRule): boolean =>
  quality.convergenceAngleDeg >= rule.minConvergenceAngleDeg && quality.velocityErrorKmS <= rule.maxVelocityErrorFraction * quality.velocityKmS;

/** How many orbits each set holds. */
export interface OrbitSetCounts {
  readonly all: number;
  /** Null when the file carries no quality columns, so the reliable set cannot be told. */
  readonly reliable: number | null;
  readonly cut: number | null;
}

/** True when each orbit has its quality, so a reliable set can be cut. */
export const hasQuality = (orbits: MeasuredOrbits): boolean => orbits.quality.length === orbits.members.length;

export function orbitSetCounts(orbits: MeasuredOrbits, rule: QualityRule): OrbitSetCounts {
  if (!hasQuality(orbits)) return { all: orbits.members.length, reliable: null, cut: null };
  let reliable = 0;
  for (const q of orbits.quality) {
    if (isReliable(q, rule)) reliable += 1;
  }
  return { all: orbits.members.length, reliable, cut: orbits.members.length - reliable };
}

/** The orbits of one set, in file order. */
export function selectOrbits(orbits: MeasuredOrbits, set: OrbitSet, rule: QualityRule): MeasuredOrbits {
  if (set === "all" || !hasQuality(orbits)) return orbits;
  const keep = orbits.quality.map((q) => isReliable(q, rule));
  return { provenance: orbits.provenance, members: orbits.members.filter((_, k) => keep[k]), quality: orbits.quality.filter((_, k) => keep[k]) };
}

export class MeasuredOrbitsError extends TypeError {
  override readonly name = "MeasuredOrbitsError";
}

/** Where the fetch tool puts a story's shippable copy (committed): data/stories/<story>/gmn-iau-<code>.json. Nothing else under data/stories is read. */
export const shippedOrbitsPath = (story: string, iauCode: number): string => `data/stories/${story}/gmn-iau-${iauCode}.json`;
const SHIPPED = import.meta.glob("../../../data/stories/*/*.json", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const shippedUrl = (story: string, iauCode: number): string | undefined => SHIPPED[`../../../${shippedOrbitsPath(story, iauCode)}`];
/** Where the fetch tool writes a shower's full file, and where the dev server serves it from the project root. */
export const measuredOrbitsUrl = (iauCode: number): string => `/data/local/gmn-iau-${iauCode}.json`;
export const fetchOrbitsCommand = (iauCode: number, months: readonly string[] = []): string =>
  `node packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.mjs ${iauCode} --months ${months.join(",")}`;

const fail = (problem: string): never => {
  throw new MeasuredOrbitsError(`measured orbit file ${problem}`);
};

/** Which of the three layouts a header's column list declares (lean: elements only; compact: lean or the earlier ten columns); fails for any other list. */
function layoutOf(columns: unknown): { lean: boolean; compact: boolean; width: number } {
  const list = Array.isArray(columns) ? columns.join(",") : "";
  const lean = list === SHIPPED_ROW_COLUMNS.join(",");
  const compact = lean || list === COMPACT_ROW_COLUMNS.join(",");
  if (!compact && list !== MEASURED_ROW_COLUMNS.join(",")) {
    return fail(`has columns ${JSON.stringify(columns)}, expected ${JSON.stringify(MEASURED_ROW_COLUMNS)} (or the shipped ${JSON.stringify(SHIPPED_ROW_COLUMNS)})`);
  }
  return { lean, compact, width: lean ? SHIPPED_ROW_COLUMNS.length : compact ? COMPACT_ROW_COLUMNS.length : MEASURED_ROW_COLUMNS.length };
}

interface RowRead {
  readonly member: ListedMember;
  readonly quality: MemberQuality | null;
}

/** One row of any of the three layouts, checked: a record id and finite numbers. The id is as stored (still trimmed when the file says so). */
function readRow(row: unknown, index: number, width: number, compact: boolean, lean: boolean): RowRead {
  if (!Array.isArray(row) || row.length !== width) return fail(`row ${index} must have ${width} values`);
  const [storedId, epochUtcMs, a, e, i, w, node, q, vg, vgSigma] = (compact ? row : [row[0], ...row.slice(2, 8), row[9], row[10], row[11]]) as unknown[];
  if (typeof storedId !== "string" || storedId.length === 0) return fail(`row ${index} has no record id`);
  const numbers = lean ? [epochUtcMs, a, e, i, w, node] : [epochUtcMs, a, e, i, w, node, 0, q, vg, vgSigma, compact ? 0 : row[12], ...(compact ? [] : [row[8]])];
  for (const value of numbers) {
    if (typeof value !== "number" || !Number.isFinite(value)) return fail(`row ${index} (record "${storedId}") holds a value that is not a finite number`);
  }
  return {
    member: {
      recordId: storedId,
      epochUtcMs: epochUtcMs as number,
      elements: { semiMajorAxisKm: (a as number) * AU_KM, eccentricity: e as number, inclinationDeg: i as number, argumentOfPeriapsisDeg: w as number, raanDeg: node as number },
    },
    quality: lean ? null : { convergenceAngleDeg: q as number, velocityKmS: vg as number, velocityErrorKmS: vgSigma as number },
  };
}

/**
 * Checks a fetched file and returns its members. It names the problem when the file is for another shower, has other columns, or holds
 * a row that is not a finite bound orbit. Records are not dropped here: the fetch tool already dropped unbound ones and says how many.
 */
export function parseMeasuredOrbits(input: unknown, iauCode: number): MeasuredOrbits {
  if (typeof input !== "object" || input === null) return fail("is not an object");
  const file = input as { provenance?: Record<string, unknown>; rows?: unknown };
  const provenance = file.provenance;
  if (typeof provenance !== "object" || provenance === null) return fail("has no provenance header");
  if (provenance.iauCode !== iauCode) return fail(`is for IAU shower ${String(provenance.iauCode)}, not ${iauCode}`);
  const { lean, compact, width } = layoutOf(provenance.columns);
  for (const key of ["database", "citation", "source", "fetchedAt"] as const) {
    if (typeof provenance[key] !== "string" || (provenance[key] as string).length === 0) return fail(`provenance.${key} is missing`);
  }
  if (provenance.layout === COLUMN_LAYOUT && !compact) return fail("stores columns, which only the shipped column list allows");
  const rows = provenance.layout === COLUMN_LAYOUT ? rowsFromColumns(file.rows, width) : file.rows;
  const trimmed = provenance.recordIds === TRIMMED_IDS;
  if (!Array.isArray(rows) || rows.length === 0) return fail("holds no rows");
  const quality: MemberQuality[] = [];
  const members = rows.map((row: unknown, index): ListedMember => {
    const read = readRow(row, index, width, compact, lean);
    if (read.quality !== null) quality.push(read.quality);
    return { ...read.member, recordId: trimmed ? restoreId(read.member.recordId, read.member.epochUtcMs) : read.member.recordId };
  });
  return { provenance: provenance as unknown as MeasuredOrbitProvenance, members, quality };
}

/** What loading found: the orbits, nothing (not fetched, or a production build), or a file that is there but cannot be used. */
export type MeasuredLoad =
  | { readonly kind: "loaded"; readonly orbits: MeasuredOrbits }
  | { readonly kind: "absent" }
  | { readonly kind: "invalid"; readonly problem: string };

const requests = new Map<string, Promise<MeasuredLoad>>();

/**
 * The locally fetched file for a shower. Absent when it is not there (or in a production build, which never reads `data/local/`): the dev
 * server answers an unknown path with the app's page, so anything that is not JSON counts as absent. JSON that is not a usable orbit file
 * is reported as invalid, with the reason, rather than passed off as not fetched.
 */
export function loadMeasuredOrbits(iauCode: number, story?: string): Promise<MeasuredLoad> {
  const key = `${iauCode}:${story ?? ""}`;
  let request = requests.get(key);
  if (request === undefined) {
    const shipped = story === undefined ? undefined : shippedUrl(story, iauCode);
    // Development reads the local file first and falls back to the story's shipped copy; a production build reads only the shipped copy, and only for a licence that allows it.
    const attempt = (url: string, isShipped: boolean): Promise<MeasuredLoad> => fetch(url)
      .then(async (response): Promise<MeasuredLoad> => {
        if (!response.ok) return { kind: "absent" };
        let json: unknown;
        try {
          json = JSON.parse(await response.text());
        } catch {
          return { kind: "absent" };
        }
        try {
          const orbits = parseMeasuredOrbits(json, iauCode);
          if (isShipped && !isShippableLicence(orbits.provenance.licence)) return { kind: "invalid", problem: "measured orbit file in the shipped folder does not declare a licence that allows shipping" };
          return { kind: "loaded", orbits };
        } catch (error) {
          return { kind: "invalid", problem: error instanceof Error ? error.message : String(error) };
        }
      })
      .catch((): MeasuredLoad => ({ kind: "absent" }));
    request = import.meta.env.PROD
      ? shipped === undefined ? Promise.resolve<MeasuredLoad>({ kind: "absent" }) : attempt(shipped, true)
      : attempt(measuredOrbitsUrl(iauCode), false).then((load) => (load.kind === "absent" && shipped !== undefined ? attempt(shipped, true) : load));
    requests.set(key, request);
  }
  return request;
}
