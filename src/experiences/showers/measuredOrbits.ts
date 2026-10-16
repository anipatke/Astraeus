import type { ListedMember } from "../../core/listedOrbitGroup";

const AU_KM = 149_597_870.7;

/** Column order of a row in the file `tools/data/fetch-meteoroid-orbits.mjs` writes (tests keep this equal to the tool's own list). */
export const MEASURED_ROW_COLUMNS = ["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"] as const;

/**
 * The compact layout a shipped file uses: the full layout without the columns the app never reads (the sheet row, the solar longitude, and the double-entry flag,
 * which only CAMS carries). Rows are read by position in whichever of the two layouts the header declares.
 */
export const SHIPPED_ROW_COLUMNS = ["recordId", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS"] as const;

/** Licences under which a measured-orbit file may be copied into a public build. A file with no licence, or any other, never ships (CAMS and the Yale catalogue declare none). The fetch tool keeps the same list. */
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
}

/** What the database says about how well one orbit was measured. */
export interface MemberQuality {
  /** Convergence angle Q between the cameras' planes, degrees. */
  readonly convergenceAngleDeg: number;
  readonly velocityKmS: number;
  readonly velocityErrorKmS: number;
  /** 1 when the record is a double entry. */
  readonly pairsFlag: number;
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

/** How many orbits each set holds, and how many double entries (pairs flag 1) are in the whole list and in the reliable set. */
export interface OrbitSetCounts {
  readonly all: number;
  readonly reliable: number;
  readonly cut: number;
  readonly pairsFlagged: number;
  readonly pairsFlaggedReliable: number;
}

export function orbitSetCounts(orbits: MeasuredOrbits, rule: QualityRule): OrbitSetCounts {
  let reliable = 0;
  let pairsFlagged = 0;
  let pairsFlaggedReliable = 0;
  for (const q of orbits.quality) {
    const ok = isReliable(q, rule);
    if (ok) reliable += 1;
    if (q.pairsFlag === 1) { pairsFlagged += 1; if (ok) pairsFlaggedReliable += 1; }
  }
  return { all: orbits.members.length, reliable, cut: orbits.members.length - reliable, pairsFlagged, pairsFlaggedReliable };
}

/** The orbits of one set, in file order. Double entries are kept in both: no source says to drop them. */
export function selectOrbits(orbits: MeasuredOrbits, set: OrbitSet, rule: QualityRule): MeasuredOrbits {
  if (set === "all") return orbits;
  const keep = orbits.quality.map((q) => isReliable(q, rule));
  return { provenance: orbits.provenance, members: orbits.members.filter((_, k) => keep[k]), quality: orbits.quality.filter((_, k) => keep[k]) };
}

export class MeasuredOrbitsError extends TypeError {
  override readonly name = "MeasuredOrbitsError";
}

/** Where the fetch tool writes a shower's file, and where the dev server serves it from the project root. */
export type MeasuredSource = "cams" | "gmn";
/** Where the fetch tool puts a story's shippable copy (committed): data/stories/<story>/<source>-iau-<code>.json. Nothing else under data/stories is read. */
export const shippedOrbitsPath = (story: string, iauCode: number, source: MeasuredSource): string => `data/stories/${story}/${source}-iau-${iauCode}.json`;
const SHIPPED = import.meta.glob("../../../data/stories/*/*.json", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const shippedUrl = (story: string, iauCode: number, source: MeasuredSource): string | undefined => SHIPPED[`../../../${shippedOrbitsPath(story, iauCode, source)}`];
export const measuredOrbitsUrl = (iauCode: number, source: MeasuredSource = "cams"): string => `/data/local/${source}-iau-${iauCode}.json`;
export const fetchOrbitsCommand = (iauCode: number, source: MeasuredSource = "cams", months: readonly string[] = []): string =>
  source === "gmn" ? `node tools/data/fetch-meteoroid-orbits.mjs ${iauCode} --source gmn --months ${months.join(",")}` : `node tools/data/fetch-meteoroid-orbits.mjs ${iauCode}`;

const fail = (problem: string): never => {
  throw new MeasuredOrbitsError(`measured orbit file ${problem}`);
};

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
  const columns = provenance.columns;
  const compact = Array.isArray(columns) && columns.join(",") === SHIPPED_ROW_COLUMNS.join(",");
  if (!Array.isArray(columns) || (!compact && columns.join(",") !== MEASURED_ROW_COLUMNS.join(","))) {
    return fail(`has columns ${JSON.stringify(columns)}, expected ${JSON.stringify(MEASURED_ROW_COLUMNS)} (or the shipped ${JSON.stringify(SHIPPED_ROW_COLUMNS)})`);
  }
  const width = compact ? SHIPPED_ROW_COLUMNS.length : MEASURED_ROW_COLUMNS.length;
  for (const key of ["database", "citation", "source", "fetchedAt"] as const) {
    if (typeof provenance[key] !== "string" || (provenance[key] as string).length === 0) return fail(`provenance.${key} is missing`);
  }
  const rows = file.rows;
  if (!Array.isArray(rows) || rows.length === 0) return fail("holds no rows");
  const quality: MemberQuality[] = [];
  const members = rows.map((row: unknown, index): ListedMember => {
    if (!Array.isArray(row) || row.length !== width) return fail(`row ${index} must have ${width} values`);
    const [recordId, epochUtcMs, a, e, i, w, node, q, vg, vgSigma] = (compact ? row : [row[0], ...row.slice(2, 8), row[9], row[10], row[11]]) as unknown[];
    const solarLongitude = 0;
    const pairs = compact ? 0 : row[12];
    if (typeof recordId !== "string" || recordId.length === 0) return fail(`row ${index} has no record id`);
    for (const value of [epochUtcMs, a, e, i, w, node, solarLongitude, q, vg, vgSigma, pairs, ...(compact ? [] : [row[8]])]) {
      if (typeof value !== "number" || !Number.isFinite(value)) return fail(`row ${index} (record "${recordId}") holds a value that is not a finite number`);
    }
    quality.push({ convergenceAngleDeg: q as number, velocityKmS: vg as number, velocityErrorKmS: vgSigma as number, pairsFlag: pairs as number });
    return {
      recordId,
      epochUtcMs: epochUtcMs as number,
      elements: {
        semiMajorAxisKm: (a as number) * AU_KM,
        eccentricity: e as number,
        inclinationDeg: i as number,
        argumentOfPeriapsisDeg: w as number,
        raanDeg: node as number,
      },
    };
  });
  return { provenance: provenance as unknown as MeasuredOrbitProvenance, members, quality };
}

/** What loading found: the orbits, nothing (not fetched, or a production build), or a file that is there but cannot be used. */
export type MeasuredLoad =
  | { readonly kind: "loaded"; readonly orbits: MeasuredOrbits }
  | { readonly kind: "absent" }
  | { readonly kind: "invalid"; readonly problem: string };

let requests = new Map<string, Promise<MeasuredLoad>>();

/**
 * The locally fetched file for a shower. Absent when it is not there (or in a production build, which never reads `data/local/`): the dev
 * server answers an unknown path with the app's page, so anything that is not JSON counts as absent. JSON that is not a usable orbit file
 * is reported as invalid, with the reason, rather than passed off as not fetched.
 */
export function loadMeasuredOrbits(iauCode: number, source: MeasuredSource = "cams", story?: string): Promise<MeasuredLoad> {
  const key = `${source}:${iauCode}:${story ?? ""}`;
  let request = requests.get(key);
  if (request === undefined) {
    const shipped = story === undefined ? undefined : shippedUrl(story, iauCode, source);
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
      : attempt(measuredOrbitsUrl(iauCode, source), false).then((load) => (load.kind === "absent" && shipped !== undefined ? attempt(shipped, true) : load));
    requests.set(key, request);
  }
  return request;
}

/** Forgets what was requested; for tests. */
export function forgetMeasuredOrbitRequests(): void {
  requests = new Map();
}
