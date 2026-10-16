import type { ListedMember } from "../../core/listedOrbitGroup";

const AU_KM = 149_597_870.7;

/** Column order of a row in the file `tools/data/fetch-meteoroid-orbits.mjs` writes (tests keep this equal to the tool's own list). */
export const MEASURED_ROW_COLUMNS = ["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"] as const;

/** The provenance header of a fetched file: what the tool recorded about the release and the filtering. */
export interface MeasuredOrbitProvenance {
  readonly database: string;
  readonly citation: string;
  readonly source: string;
  readonly fetchedAt: string;
  readonly iauCode: number;
  readonly filter: string;
  readonly counts: { readonly members: number; readonly unbound: number; readonly kept: number } & Readonly<Record<string, number>>;
  readonly release: { readonly bytes: number; readonly sha256: string } & Readonly<Record<string, unknown>>;
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
export const measuredOrbitsUrl = (iauCode: number): string => `/data/local/cams-iau-${iauCode}.json`;
export const fetchOrbitsCommand = (iauCode: number): string => `node tools/data/fetch-meteoroid-orbits.mjs ${iauCode}`;

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
  if (!Array.isArray(columns) || columns.join(",") !== MEASURED_ROW_COLUMNS.join(",")) {
    return fail(`has columns ${JSON.stringify(columns)}, expected ${JSON.stringify(MEASURED_ROW_COLUMNS)}`);
  }
  for (const key of ["database", "citation", "source", "fetchedAt"] as const) {
    if (typeof provenance[key] !== "string" || (provenance[key] as string).length === 0) return fail(`provenance.${key} is missing`);
  }
  const rows = file.rows;
  if (!Array.isArray(rows) || rows.length === 0) return fail("holds no rows");
  const quality: MemberQuality[] = [];
  const members = rows.map((row: unknown, index): ListedMember => {
    if (!Array.isArray(row) || row.length !== MEASURED_ROW_COLUMNS.length) return fail(`row ${index} must have ${MEASURED_ROW_COLUMNS.length} values`);
    const [recordId, , epochUtcMs, a, e, i, w, node, solarLongitude, q, vg, vgSigma, pairs] = row as unknown[];
    if (typeof recordId !== "string" || recordId.length === 0) return fail(`row ${index} has no record id`);
    for (const value of [epochUtcMs, a, e, i, w, node, solarLongitude, q, vg, vgSigma, pairs]) {
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

let requests = new Map<number, Promise<MeasuredLoad>>();

/**
 * The locally fetched file for a shower. Absent when it is not there (or in a production build, which never reads `data/local/`): the dev
 * server answers an unknown path with the app's page, so anything that is not JSON counts as absent. JSON that is not a usable orbit file
 * is reported as invalid, with the reason, rather than passed off as not fetched.
 */
export function loadMeasuredOrbits(iauCode: number): Promise<MeasuredLoad> {
  if (import.meta.env.PROD) return Promise.resolve({ kind: "absent" });
  let request = requests.get(iauCode);
  if (request === undefined) {
    request = fetch(measuredOrbitsUrl(iauCode))
      .then(async (response): Promise<MeasuredLoad> => {
        if (!response.ok) return { kind: "absent" };
        let json: unknown;
        try {
          json = JSON.parse(await response.text());
        } catch {
          return { kind: "absent" };
        }
        try {
          return { kind: "loaded", orbits: parseMeasuredOrbits(json, iauCode) };
        } catch (error) {
          return { kind: "invalid", problem: error instanceof Error ? error.message : String(error) };
        }
      })
      .catch((): MeasuredLoad => ({ kind: "absent" }));
    requests.set(iauCode, request);
  }
  return request;
}

/** Forgets what was requested; for tests. */
export function forgetMeasuredOrbitRequests(): void {
  requests = new Map();
}
