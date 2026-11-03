import type { BodyId } from "../core/body";
import { createProvenance } from "../core/provenance";
import type { WindowProvenanceSpan } from "../core/timeWindow";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import { createState, type State } from "../core/state";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { createStateResolver } from "../core/stateResolver";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { planetSeriesLoaded } from "../core/planetSeries";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
import { lineBodies, type LineStretch, type TrackedBody } from "../app/mission";
import { planLineStretches, planPathProvenance } from "./pathProvenance";
import { influenceStretches, sphereOfInfluenceKm, type InfluenceCandidate } from "./sphereOfInfluence";
import { SceneError } from "./errors";
import { toUtcMs } from "./time";
import type { AnchorInput, ReadoutInput, TrajectoryInput } from "./scene";
import { frozenList, type ScenePathRead } from "./sceneReads";

const DEFAULT_COLOR = "#ffd27a";
const PROVIDER_PATH_SAMPLES = 128;

/** Samples along a path when its farthest distance is read for the default zoom-out. */
const PATH_COVER_SAMPLES = 400;

export interface Tracked {
  readonly body: TrackedBody;
  /** `lineFixedTo: "auto"`: the stretches are resolved from the samples once the planet series are in. */
  readonly auto?: true;
  readonly center: BodyId;
  readonly description?: string;
  readonly knownLimitations?: readonly string[];
  readonly provenanceSpans?: readonly WindowProvenanceSpan[];
  readonly readouts: readonly ReadoutInput[];
}

/** The paths in the order added, as the public list states them. */
export function pathReads(tracked: Iterable<Tracked>): readonly ScenePathRead[] {
  return frozenList([...tracked].map(({ body, center, description, knownLimitations }): ScenePathRead => ({ id: body.id, label: body.label, center, provenance: body.provenance!, ...(description === undefined ? {} : { description }), knownLimitations: Object.freeze([...(knownLimitations ?? [])]) }))); // addTrajectory always sets a provenance
}

/** Validates and stores one path about `center`. */
export function buildTracked(input: TrajectoryInput, center: BodyId, labelReaches: Map<string, number>): Tracked {
  const id = input.id;
  if (!builtInCatalogue.has(center)) throw new SceneError("unknown-body", `addTrajectory("${id}"): centre "${center}" is not a catalogued body`);
  const provenance = input.provenance ?? createProvenance({ sourceType: "illustrative", sources: ["Supplied by the caller"], accuracy: "As supplied; the engine makes no claim.", notes: "Positions were passed to addTrajectory." });
  const common = { id, label: input.label ?? id, color: input.color ?? DEFAULT_COLOR, anchorTimesUtcMs: [], provenance };
  const readouts = readoutsOf(id, input.readouts);
  if (input.labelReach !== undefined) {
    checkLabelReach(input.labelReach, new SceneError("bad-trajectory", `addTrajectory("${id}"): labelReach ${String(input.labelReach)} must be a positive finite number`));
    labelReaches.set(id, input.labelReach);
  }
  if (input.plane !== undefined && input.plane !== "EQJ" && input.plane !== "ecliptic-j2000") throw new SceneError("bad-trajectory", `addTrajectory("${id}"): plane "${String(input.plane)}" must be "EQJ" or "ecliptic-j2000"`);
  const toEqj = input.plane === "ecliptic-j2000" ? createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix() : null;
  const body = "samples" in input ? sampledBody(common, input, center, toEqj) : providerBody(common, input, toEqj);
  const span = { startUtcMs: body.trajectory.bounds.startUtcMs, endUtcMs: body.trajectory.bounds.endUtcMs };
  const provenanceSpans = input.provenanceSpans === undefined ? undefined : planPathProvenance(id, input.provenanceSpans, span);
  checkLineFixedToType(id, input.lineFixedTo);
  const auto = input.lineFixedTo === "auto";
  const lineFixedTo = typeof input.lineFixedTo === "object" ? planLineStretches(id, input.lineFixedTo, span) : auto ? undefined : input.lineFixedTo;
  return { center, ...(auto ? { auto: true as const } : {}), body: withAnchors(lineFixedTo === undefined ? body : { ...body, lineFixedTo }, input.anchors), readouts, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(input.description === undefined ? {} : { description: input.description }), ...(input.knownLimitations === undefined ? {} : { knownLimitations: input.knownLimitations }) };
}

type Common = Pick<TrackedBody, "id" | "label" | "color" | "anchorTimesUtcMs" | "provenance">;

/** Rotates a vector by a row-major 3x3 matrix; a missing matrix leaves it as it is. Input that is not three numbers passes through for the State checks to refuse. */
function rotated(matrix: Float64Array | null, v: ArrayLike<number> | undefined): ArrayLike<number> | undefined {
  if (matrix === null || v === undefined || v.length !== 3) return v;
  return [0, 1, 2].map((row) => matrix[3 * row]! * v[0]! + matrix[3 * row + 1]! * v[1]! + matrix[3 * row + 2]! * v[2]!);
}

function sampledBody(common: Common, input: Extract<TrajectoryInput, { samples: unknown }>, center: BodyId, toEqj: Float64Array | null): TrackedBody {
  const samples: TrajectorySample[] = input.samples.map((sample, index) => {
    const velocityKmS = rotated(toEqj, sample.velocityKmS);
    return { positionKm: rotated(toEqj, sample.positionKm)!, ...(velocityKmS === undefined ? {} : { velocityKmS }), timeUtcMs: toUtcMs(sample.time, `addTrajectory("${common.id}") sample ${index} time`) };
  });
  try {
    const trajectory = new SampledTrajectory({ body: common.id, center, samples });
    return { ...common, trajectory, pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs) };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** `lineFixedTo` is a body id, `"auto"` or a list; anything else is `bad-trajectory` (the list's own faults are named by `planLineStretches`). */
function checkLineFixedToType(id: string, value: unknown): void {
  if (value !== undefined && typeof value !== "string" && typeof value !== "object") throw new SceneError("bad-trajectory", `addTrajectory("${id}"): lineFixedTo ${String(value)} must be a body id, "auto" or a list of stretches`);
}

function providerBody(common: Common, input: Extract<TrajectoryInput, { provider: unknown }>, toEqj: Float64Array | null): TrackedBody {
  if (typeof input.provider?.stateAt !== "function") throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): provider needs a stateAt(time) function`);
  const bounds: TimeBounds = { startUtcMs: toUtcMs(input.bounds?.start, `addTrajectory("${common.id}") bounds.start`), endUtcMs: toUtcMs(input.bounds?.end, `addTrajectory("${common.id}") bounds.end`) };
  if (bounds.endUtcMs <= bounds.startUtcMs) throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): bounds must end after they start`);
  const trajectory: Trajectory & { readonly bounds: TimeBounds } = { body: common.id, bounds, stateAt: (timeUtcMs, center) => rotatedState(toEqj, input.provider.stateAt(timeUtcMs, center)) };
  // Whole milliseconds, because the state resolver refuses a fractional time (the line is placed against another body at these times).
  const step = (bounds.endUtcMs - bounds.startUtcMs) / (PROVIDER_PATH_SAMPLES - 1);
  return { ...common, trajectory, pathTimesUtcMs: Array.from({ length: PROVIDER_PATH_SAMPLES }, (_, index) => Math.round(bounds.startUtcMs + index * step)) };
}

/** A provider's State with its position and velocity rotated into EQJ; unchanged for EQJ input. */
function rotatedState(matrix: Float64Array | null, state: State): State {
  if (matrix === null) return state;
  return createState({ body: state.body, center: state.center, timeUtcMs: state.timeUtcMs, positionKm: rotated(matrix, state.positionKm)!, ...(state.velocityKmS === undefined ? {} : { velocityKmS: rotated(matrix, state.velocityKmS)! }), orientation: state.orientation });
}

/** Throws `error` unless `reach` is a positive finite number. */
export function checkLabelReach(reach: unknown, error: SceneError): void {
  if (!(typeof reach === "number" && Number.isFinite(reach) && reach > 0)) throw error;
}

const READOUT_KINDS = ["range", "speed", "distance", "altitude"];

/** The body a readout names, if any. */
function readoutBody(spec: ReadoutInput): BodyId | undefined {
  return spec.kind === "range" ? spec.marker : spec.kind === "distance" ? spec.to : spec.kind === "altitude" ? spec.above : undefined;
}

/** Checks each readout's kind and the catalogued body it names; whether the scene holds that body is checked when the definition is built. */
export function readoutsOf(id: string, readouts: readonly ReadoutInput[] = [], call = "addTrajectory"): readonly ReadoutInput[] {
  if (!Array.isArray(readouts)) throw new SceneError("bad-readout", `${call}("${id}"): readouts must be a list`);
  for (const spec of readouts) {
    if (!READOUT_KINDS.includes(spec?.kind)) throw new SceneError("bad-readout", `${call}("${id}"): readout kind "${String(spec?.kind)}" is not one of ${READOUT_KINDS.join(", ")}`);
    const named = readoutBody(spec);
    if (spec.kind !== "range" && spec.kind !== "speed" && named === undefined) throw new SceneError("bad-readout", `${call}("${id}"): readout ${spec.kind} needs ${spec.kind === "distance" ? "`to`" : "`above`"}, the body to measure against`);
    if (named !== undefined && !builtInCatalogue.has(named)) throw new SceneError("bad-readout", `${call}("${id}"): readout ${spec.kind} names "${named}", which is not a catalogued body`);
  }
  return readouts;
}

/** The body with its anchors: sorted by time, each labelled with its id. Every anchor needs a distinct id and a moment inside the path. */
function withAnchors(body: TrackedBody, anchors: readonly AnchorInput[] = []): TrackedBody {
  if (!Array.isArray(anchors)) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchors must be a list`);
  const { startUtcMs, endUtcMs } = body.trajectory.bounds;
  const seen = new Set<string>();
  const placed = anchors.map((anchor) => {
    if (typeof anchor?.id !== "string" || anchor.id === "") throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): every anchor needs a non-empty id`);
    if (seen.has(anchor.id)) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchor "${anchor.id}" appears twice`);
    seen.add(anchor.id);
    const timeUtcMs = anchorTime(body.id, anchor);
    if (timeUtcMs < startUtcMs || timeUtcMs > endUtcMs) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchor "${anchor.id}" is outside the path (${new Date(startUtcMs).toISOString()} to ${new Date(endUtcMs).toISOString()})`);
    return { id: anchor.id, timeUtcMs };
  }).sort((a, b) => a.timeUtcMs - b.timeUtcMs);
  return placed.length === 0 ? body : { ...body, anchorTimesUtcMs: placed.map((anchor) => anchor.timeUtcMs), anchorLabels: placed.map((anchor) => anchor.id) };
}

function anchorTime(path: string, anchor: AnchorInput): number {
  try { return toUtcMs(anchor.time); } catch { throw new SceneError("bad-anchor", `addTrajectory("${path}"): anchor "${anchor.id}" has a time "${String(anchor.time)}" that is not a valid moment`); }
}

/**
 * The distance the default zoom-out must cover for the scene's paths about the scene centre (I-114): a path reaching past the planets must fit whole whichever point of it the camera looks at,
 * so twice its farthest distance from the centre (no two points of a path are farther apart than that). Sampled over each path's span; undefined when no path is about the centre.
 */
export function pathCover(tracked: Iterable<Tracked>, sunCentred: boolean, centre: BodyId): (() => number) | undefined {
  if (!sunCentred) return undefined;
  const about = [...tracked].filter((entry) => entry.center === centre);
  if (about.length === 0) return undefined;
  return () => 2 * Math.max(...about.map(({ body }) => {
    const { startUtcMs, endUtcMs } = body.trajectory.bounds;
    let farthest = 0;
    for (let k = 0; k < PATH_COVER_SAMPLES; k += 1) farthest = Math.max(farthest, Math.hypot(...body.trajectory.stateAt(Math.round(startUtcMs + ((endUtcMs - startUtcMs) * k) / (PATH_COVER_SAMPLES - 1)), centre).positionKm));
    return farthest;
  }));
}

/** The stretches of a `lineFixedTo: "auto"` path: the innermost scene body whose sphere of influence holds each sample (`sphereOfInfluence.ts`). Reads body states, so the planet series must be loaded. */
function autoStretches(catalogue: BodyCatalogue, entry: Tracked, ids: readonly BodyId[]): readonly LineStretch[] {
  const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
  const norm = (v: ArrayLike<number>): number => Math.hypot(v[0]!, v[1]!, v[2]!);
  const candidates: InfluenceCandidate[] = [];
  for (const id of ids) {
    const { parentId, gmKm3S2 } = catalogue.get(id).definition;
    if (parentId === undefined) {
      candidates.push({ id, radiusKm: () => Infinity, probeDistanceKm: () => 0 });
      continue;
    }
    const parentGm = catalogue.get(parentId).definition.gmKm3S2;
    if (!(gmKm3S2! > 0 && parentGm! > 0)) continue; // no published GM: this body cannot hold a probe
    candidates.push({
      id,
      radiusKm: (t) => sphereOfInfluenceKm(gmKm3S2, parentGm, norm(resolver.stateOf(id, t, parentId).positionKm)),
      probeDistanceKm: (t) => {
        const probe = entry.body.trajectory.stateAt(t, entry.center).positionKm;
        const body = resolver.stateOf(id, t, entry.center).positionKm;
        return norm([probe[0]! - body[0]!, probe[1]! - body[1]!, probe[2]! - body[2]!]);
      },
    });
  }
  return influenceStretches(entry.body.pathTimesUtcMs, candidates);
}

/** The `"auto"` paths' one resolution into `tracked`: `now` runs it (through the caller's guarded read) when the planet series are in; else `later` is true and `settle` runs it in `prepare`. */
export function autoPaths(catalogue: BodyCatalogue, entries: readonly Tracked[], tracked: TrackedBody[], ids: readonly BodyId[]): { readonly later: boolean; readonly now: (guard: (read: () => void) => void) => void; readonly settle: (guard: (read: () => void) => void) => void } {
  const pending = entries.some((entry) => entry.auto === true);
  const later = pending && !planetSeriesLoaded();
  const resolve = (): void => entries.forEach((entry, index) => { if (entry.auto === true) tracked[index] = { ...entry.body, lineFixedTo: autoStretches(catalogue, entry, ids) }; });
  return { later, now: (guard) => { if (pending && !later) guard(resolve); }, settle: (guard) => { if (later) guard(resolve); } };
}

/** A readout, or the body the line is fixed to, names a body the scene must hold. */
export function checkReadouts(entry: Tracked, ids: readonly BodyId[]): void {
  for (const { index, body } of lineBodies(entry.body.lineFixedTo)) {
    if (!ids.includes(body)) throw new SceneError("bad-trajectory", `addTrajectory("${entry.body.id}"): lineFixedTo${index === null ? "" : `[${index}]`} names "${body}", which has not been added to the scene`);
  }
  checkNamedReadouts(entry.body.id, entry.readouts, ids, "addTrajectory");
}

/** The readouts of a path or a body name only bodies the scene holds. */
export function checkNamedReadouts(id: string, readouts: readonly ReadoutInput[], ids: readonly BodyId[], call: string): void {
  for (const spec of readouts) {
    const named = readoutBody(spec);
    if (named !== undefined && !ids.includes(named)) throw new SceneError("bad-readout", `${call}("${id}"): readout ${spec.kind} names "${named}", which has not been added to the scene`);
  }
}
