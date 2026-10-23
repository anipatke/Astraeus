import type { BodyId } from "../core/body";
import { createEvents } from "../core/events";
import { createProvenance, type Provenance } from "../core/provenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import { readableScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { loadPlanetSeries } from "../core/planetSeries";
import { catalogue } from "../assets/catalogue";
import { createComposition } from "../assets/compositions";
import { bodyMetrics } from "../app/bodyMetrics";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { needsPlanetSeries } from "../app/planetNeeds";
import type { TrackedBody } from "../app/mission";
import type { Metric } from "../shell/metrics";
import type { ExperienceObject } from "../shell/experience";
import type { BodyRef } from "./bodies";
import { SceneError } from "./errors";

/** A moment: ISO text, a Date, or Unix milliseconds. */
export type TimeInput = string | number | Date;

/** A data package handed to `mount`: what it provides, and an optional load step run before the scene draws. */
export interface DataSource {
  readonly name: string;
  readonly provides: readonly BodyId[];
  readonly prepare?: () => Promise<void>;
}

/** One sample of a recorded path: position in km (and optionally velocity in km/s) about the trajectory's centre. */
export interface TrajectorySampleInput {
  readonly time: TimeInput;
  readonly positionKm: ArrayLike<number>;
  readonly velocityKmS?: ArrayLike<number>;
}

interface TrajectoryBase {
  readonly id: string;
  readonly label?: string;
  readonly color?: string;
  /** The body the positions are measured from; defaults to "earth". */
  readonly center?: BodyId;
  readonly provenance?: Provenance;
}
/** A path given as sampled states, or as a provider with `stateAt(time)` and the span it covers. */
export type TrajectoryInput =
  | (TrajectoryBase & { readonly samples: readonly TrajectorySampleInput[] })
  | (TrajectoryBase & { readonly provider: { stateAt(timeUtcMs: number, center?: BodyId): State }; readonly bounds: { readonly start: TimeInput; readonly end: TimeInput } });

/** The camera's opening view of a followed object; the angles are degrees, the distance is in Earth radii. */
export interface FollowView {
  readonly azimuthDeg?: number;
  readonly elevationDeg?: number;
  readonly distance?: number;
}

const DEFAULT_COLOR = "#ffd27a";
const DAY_MS = 86_400_000;
const PROVIDER_PATH_SAMPLES = 128;
const SCALES: readonly ScalePolicy[] = [trueScale, readableScale];

/** Converts a moment to Unix milliseconds, or throws a `bad-time` SceneError naming it. */
export function toUtcMs(time: TimeInput, what = "time"): number {
  const ms = time instanceof Date ? time.getTime() : typeof time === "number" ? time : Date.parse(time);
  if (!Number.isFinite(ms)) throw new SceneError("bad-time", `${what} "${String(time)}" is not a valid moment; use an ISO text such as "1969-07-20T20:17:40Z", a Date or Unix milliseconds`);
  return ms;
}

interface Tracked {
  readonly body: TrackedBody;
  readonly center: BodyId;
}

/** The scene's camera: what it opens on. */
export class SceneCamera {
  #target: string | undefined;
  #view: FollowView = {};
  readonly #has: (id: string) => boolean;
  constructor(has: (id: string) => boolean) {
    this.#has = has;
  }
  /** Opens framed on a body or trajectory already added to the scene, with the viewer's Follow button offered for it. */
  follow(id: string, view: FollowView = {}): this {
    if (!this.#has(id)) throw new SceneError("unknown-body", `camera.follow("${id}"): no body or trajectory with that id has been added to the scene`);
    this.#target = id;
    this.#view = view;
    return this;
  }
  get target(): string | undefined { return this.#target; }
  get view(): FollowView { return this.#view; }
}

/** A scene built with imperative calls. `mount(element, scene)` draws it; `toDefinition()` is what the app is given. */
export class Scene {
  readonly camera: SceneCamera;
  readonly #bodies = new Map<BodyId, BodyRef>();
  readonly #tracked = new Map<string, Tracked>();
  #timeUtcMs: number | undefined;
  #scale: ScalePolicy = trueScale;

  constructor() {
    this.camera = new SceneCamera((id) => this.#bodies.has(id) || this.#tracked.has(id));
  }

  /** Adds a catalogued body: a ready-made one (`earth`, `moon`, ...) or its id. The first body added is the scene's centre. */
  addBody(body: BodyRef | BodyId): this {
    const id = typeof body === "string" ? body : body.id;
    if (!catalogue.has(id)) throw new SceneError("unknown-body", `addBody("${id}"): not a catalogued body (known: ${catalogue.ids().join(", ")})`);
    if (this.#bodies.has(id) || this.#tracked.has(id)) throw new SceneError("duplicate-id", `addBody("${id}"): already in the scene`);
    this.#bodies.set(id, typeof body === "string" ? { id, label: catalogue.get(id).definition.label } : body);
    return this;
  }

  /** Adds a path to follow and draw, from sampled states or a provider with `stateAt(time)`. */
  addTrajectory(input: TrajectoryInput): this {
    const id = input.id;
    if (typeof id !== "string" || id === "") throw new SceneError("bad-trajectory", "addTrajectory: the trajectory needs a non-empty id");
    if (this.#bodies.has(id) || this.#tracked.has(id)) throw new SceneError("duplicate-id", `addTrajectory("${id}"): that id is already in the scene`);
    const center = input.center ?? "earth";
    if (!catalogue.has(center)) throw new SceneError("unknown-body", `addTrajectory("${id}"): centre "${center}" is not a catalogued body`);
    const provenance = input.provenance ?? createProvenance({ sourceType: "illustrative", sources: ["Supplied by the caller"], accuracy: "As supplied; the engine makes no claim.", notes: "Positions were passed to addTrajectory." });
    const common = { id, label: input.label ?? id, color: input.color ?? DEFAULT_COLOR, anchorTimesUtcMs: [], provenance };
    this.#tracked.set(id, { center, body: "samples" in input ? sampledBody(common, input, center) : providerBody(common, input) });
    return this;
  }

  /** Sets the moment the scene opens at. */
  setTime(time: TimeInput): this {
    this.#timeUtcMs = toUtcMs(time, "setTime");
    return this;
  }

  /** Chooses the opening scale: `trueScale` or `readableScale`; the viewer can switch to the other. */
  setScale(scale: ScalePolicy): this {
    if (!SCALES.some((known) => known.id === scale?.id)) throw new SceneError("bad-scale", `setScale: "${String(scale?.id)}" is not a scale; use trueScale or readableScale`);
    this.#scale = scale;
    return this;
  }

  /** The data packages the added bodies need that `data` does not provide. */
  missingData(data: readonly DataSource[] = []): readonly string[] {
    const have = new Set(data.flatMap((source) => source.provides));
    const named = new Set(data.map((source) => source.name));
    return [...new Set([...this.#bodies.values()].filter((body) => body.requires !== undefined && !have.has(body.id) && !named.has(body.requires)).map((body) => body.requires!))];
  }

  /** The app's plug-in contract for this scene. Throws if the scene is empty or a body needs a data package not passed in `data`. */
  toDefinition(data: readonly DataSource[] = []): ExperienceDefinition {
    if (this.#bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before mount");
    const missing = this.missingData(data);
    if (missing.length > 0) {
      const names = [...this.#bodies.values()].filter((body) => body.requires !== undefined && missing.includes(body.requires)).map((body) => body.id);
      throw new SceneError("missing-data", `${names.join(", ")} needs the ${missing.join(", ")} package: install it and pass it as mount(element, scene, { data: [...] })`);
    }
    const ids = [...this.#bodies.keys()];
    const tracked = [...this.#tracked.values()].map((entry) => entry.body);
    const window = windowOf(tracked, this.#timeUtcMs);
    const startUtcMs = this.#timeUtcMs ?? window.startUtcMs;
    const target = this.camera.target;
    const view = this.camera.view;
    const definition: ExperienceDefinition = {
      experience: {
        objects: [
          ...[...this.#bodies.values()].map((body): ExperienceObject => ({ id: body.id, label: body.label, labelPriority: 100 - ids.indexOf(body.id), labelMaxDistance: 500 })),
          ...tracked.map((body): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, labelMaxDistance: 4, provenance: body.provenance })),
        ],
        cameraPresets: [
          { id: "overview", label: "Overview", request: { kind: "overview" } },
          ...(target === undefined ? [] : [{ id: "focus-target", label: "Focus", request: { kind: "focus" as const, target } }, { id: "follow-target", label: "Follow", request: { kind: "follow" as const, target } }]),
        ],
        events: createEvents([]),
        window,
        rates: [60, 3_600, DAY_MS / 1000],
      },
      clock: { startUtcMs, rate: 60 },
      sceneLayers: ["tracked-bodies"],
      composition: createComposition(catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]! }),
      scaleChoices: [this.#scale.id, ...SCALES.filter((scale) => scale.id !== this.#scale.id).map((scale) => scale.id)],
      ...(target === undefined ? {} : { startView: { focus: target, azimuthDeg: view.azimuthDeg ?? 0, elevationDeg: view.elevationDeg ?? 30, distance: view.distance ?? 40 } }),
      trackedBodies: tracked,
      createMetrics: ({ resolver }) => {
        const catalogued = bodyMetrics(resolver, ids, ["distance"]);
        return (objectId: string, timeUtcMs: number): readonly Metric[] => (this.#tracked.has(objectId) ? [] : catalogued(objectId, timeUtcMs));
      },
      prepare: async () => {
        if (needsPlanetSeries(definition)) await loadPlanetSeries();
        for (const source of data) await source.prepare?.();
      },
    };
    return definition;
  }
}

type Common = Pick<TrackedBody, "id" | "label" | "color" | "anchorTimesUtcMs" | "provenance">;

function sampledBody(common: Common, input: Extract<TrajectoryInput, { samples: unknown }>, center: BodyId): TrackedBody {
  const samples: TrajectorySample[] = input.samples.map((sample, index) => ({ ...sample, timeUtcMs: toUtcMs(sample.time, `addTrajectory("${common.id}") sample ${index} time`) }));
  try {
    const trajectory = new SampledTrajectory({ body: common.id, center, samples });
    return { ...common, trajectory, pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs) };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): ${error instanceof Error ? error.message : String(error)}`);
  }
}

function providerBody(common: Common, input: Extract<TrajectoryInput, { provider: unknown }>): TrackedBody {
  if (typeof input.provider?.stateAt !== "function") throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): provider needs a stateAt(time) function`);
  const bounds: TimeBounds = { startUtcMs: toUtcMs(input.bounds?.start, `addTrajectory("${common.id}") bounds.start`), endUtcMs: toUtcMs(input.bounds?.end, `addTrajectory("${common.id}") bounds.end`) };
  if (bounds.endUtcMs <= bounds.startUtcMs) throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): bounds must end after they start`);
  const trajectory: Trajectory & { readonly bounds: TimeBounds } = { body: common.id, bounds, stateAt: (timeUtcMs, center) => input.provider.stateAt(timeUtcMs, center) };
  const step = (bounds.endUtcMs - bounds.startUtcMs) / (PROVIDER_PATH_SAMPLES - 1);
  return { ...common, trajectory, pathTimesUtcMs: Array.from({ length: PROVIDER_PATH_SAMPLES }, (_, index) => bounds.startUtcMs + index * step) };
}

/** The timeline span: the trajectories' union, else a month about the chosen time (or about now). */
function windowOf(tracked: readonly TrackedBody[], timeUtcMs: number | undefined): TimeBounds {
  if (tracked.length > 0) {
    const start = Math.min(...tracked.map((body) => body.trajectory.bounds.startUtcMs));
    const end = Math.max(...tracked.map((body) => body.trajectory.bounds.endUtcMs));
    if (timeUtcMs === undefined || (timeUtcMs >= start && timeUtcMs <= end)) return { startUtcMs: start, endUtcMs: end };
  }
  const centre = timeUtcMs ?? Date.now();
  return { startUtcMs: centre - 15 * DAY_MS, endUtcMs: centre + 15 * DAY_MS };
}
