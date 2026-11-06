import type { BodyId } from "../core/body";
import type { Provenance } from "../core/provenance";
import type { TextureRef } from "../assets/licence";

/** A body the scene holds, as `Scene.bodies` lists it (in the order they were added; the first is the scene's centre). */
export interface SceneBodyRead {
  readonly id: BodyId;
  readonly label: string;
  /** The body it circles in the catalogue (a planet's is the Sun, a moon's its planet); absent for the Sun. */
  readonly parent?: BodyId;
  /** Whether `addBody(..., { orbit: true })` asked for its orbit line. */
  readonly orbit: boolean;
  /** How many times larger than life it is drawn (`enlarge`); 1 when not enlarged. */
  readonly enlarge: number;
  /** The words on its info card: the `description` given to `addBody`, else absent. */
  readonly description?: string;
  /** The known limits on its info card: those given to `addBody`, else the catalogue's own. */
  readonly knownLimitations: readonly string[];
  /** Whether the object menu offers it (`listed`); true unless `addBody` said false. */
  readonly listed: boolean;
  /** The facts on its info card, as `addBody` gave them (`facts`); absent when none were given. */
  readonly facts?: readonly { readonly label: string; readonly value: string }[];
  /** The picture and licence the engine ships for the body (what a credits page lists); absent for a body drawn from a picture a data package brings, or from a flat colour. */
  readonly texture?: TextureRef;
}

/** A path the scene holds (`addTrajectory`), as `Scene.paths` lists it. */
export interface ScenePathRead {
  readonly id: string;
  readonly label: string;
  /** The body its positions are measured from. */
  readonly center: BodyId;
  readonly provenance: Provenance;
  /** The words on its info card: those given to `addTrajectory`, else absent. */
  readonly description?: string;
  /** The known limits on its info card: those given to `addTrajectory`, else empty. */
  readonly knownLimitations: readonly string[];
}

/** A group of listed orbits the scene holds (`addGroup`), as `Scene.groups` lists it. */
export interface SceneGroupRead {
  readonly id: string;
  readonly label: string;
  /** How many orbits (dots) it draws. */
  readonly count: number;
  /** The body the orbits circle. */
  readonly center: BodyId;
  /** The plane the elements are given in. */
  readonly plane: "ecliptic-j2000" | "EQJ";
  /** The provenance its card shows: always illustrative, with the source's own type kept in the accuracy line. */
  readonly provenance: Provenance;
  /** The words on its info card: those given to `addGroup`, else a sentence stating the count. */
  readonly description: string;
  /** The known limits on its info card: those given, then the engine's own about the dots' placement and motion (and the clump, when set). */
  readonly knownLimitations: readonly string[];
}

/** A body set the scene holds (`addBodySet`), as `Scene.bodySets` lists it. */
export interface SceneBodySetRead {
  readonly id: string;
  /** The body the members circle. */
  readonly center: BodyId;
  /** How many members (dots) it draws. */
  /** How many members (dots) it draws. */
  readonly count: number;
  /** The ids of its families, in order. */
  readonly families: readonly string[];
}

/** A timeline event the scene holds (`addEvents`), as `Scene.events` lists it (sorted by time). */
export interface SceneEventRead {
  readonly id: string;
  readonly label: string;
  readonly timeUtcMs: number;
  readonly type?: string;
  /** The id of the body or path the event is about. */
  readonly object?: string;
  /** The half-width of the event's own zone in simulated seconds (`withinSeconds` of `addEvents`); absent when it has none. */
  readonly withinSeconds?: number;
  /** Where the event's time comes from: its own, else the batch's; absent when neither was given. */
  readonly provenance?: Provenance;
}

/** A story panel the scene holds (`addStoryPanels`), as `Scene.panels` lists it (sorted by time, the times resolved). */
export interface ScenePanelRead {
  readonly id: string;
  readonly timeUtcMs: number;
  readonly title: string;
  /** Paragraphs, in order. */
  readonly body: readonly string[];
  readonly badge: "observed" | "modelled" | "illustrative";
  /** Paragraphs of exact figures and measured-versus-reconstructed notes; empty when none. */
  readonly details: readonly string[];
  /** One line per cited source. */
  readonly sources: readonly string[];
  /** The id of the object the panel marks. */
  readonly object?: string;
}

/** One named view of the scene (`setViews`). */
export interface SceneViewRead {
  readonly id: string;
  readonly label: string;
}

/** The views the scene names (`setViews`), as `Scene.views` states them. */
export interface SceneViewsRead {
  /** The id of the opening view. */
  readonly startId: string;
  /** Where the view choice shows: "top-bar" or "panel". */
  readonly place: "top-bar" | "panel";
  readonly items: readonly SceneViewRead[];
}

/** The timeline the scene opens with, as `Scene.timeline` states it. */
export interface SceneTimelineRead {
  /** Where the span the timeline covers begins, in UTC milliseconds. With nothing setting a span or a moment, a month about the moment of the read. */
  readonly windowStartUtcMs: number;
  /** Where that span ends, in UTC milliseconds. */
  readonly windowEndUtcMs: number;
  /** The moment the scene opens at, in UTC milliseconds. */
  readonly openUtcMs: number;
  /** The speeds the viewer offers, in simulated seconds per second. */
  readonly rates: readonly number[];
  /** The speed the scene opens at, in simulated seconds per second. */
  readonly rate: number;
  /** Whether playback wraps from the end to the start. */
  readonly loop: boolean;
}

/** Freezes a list and each of its items, and returns it. */
export function frozenList<T extends object>(items: readonly T[]): readonly T[] {
  for (const item of items) Object.freeze(item);
  return Object.freeze([...items]);
}
