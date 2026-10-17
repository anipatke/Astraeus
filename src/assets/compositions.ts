import type { BodyId } from "../core/body";
import { IO_PERIOD_DAYS } from "../core/bodies/io";
import { catalogue, type BodyCatalogue } from "./catalogue";

/** One sidereal month, the span the Moon's orbit path covers. */
export const SIDEREAL_MONTH_MS = 27.321661 * 86_400_000;

/**
 * How much more than one period a composition path draws, as a fraction of the period. A window exactly one period wide has its two ends
 * opposite the body, and a perturbed orbit (the Moon's) does not retrace itself, so they miss by thousands of km and leave a moving gap;
 * drawing past the start of the loop makes the ends overlap it. 0.1 is about 2.7 days of the Moon's month.
 */
export const DEFAULT_PATH_OVERLAP = 0.1;

/** A path the composition draws by default: the declared body's positions about its own parent, carried with that parent. */
export interface CompositionPath {
  readonly body: BodyId;
  /** One period of the body: the loop the line closes. */
  readonly spanMs: number;
  /** Extra width drawn beyond one period, as a fraction of `spanMs` (default `DEFAULT_PATH_OVERLAP`), so the ends overlap instead of leaving a gap. */
  readonly overlap?: number;
  readonly samples?: number;
}

/** Which catalogued bodies are drawn together, and which one is their natural centre. Ids only: it cannot hold a second Earth. */
export interface SystemComposition {
  readonly id: string;
  /** Catalogue ids, in draw order. */
  readonly bodies: readonly BodyId[];
  /** Natural centre; an experience may choose another `sceneCenter` from `bodies`. */
  readonly defaultCenter: BodyId;
  readonly paths?: readonly CompositionPath[];
}

export class CompositionError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "CompositionError";
  }
}

/** Checks a composition against a catalogue and returns it frozen: every id catalogued, no repeats, the centre one of them. */
export function createComposition(source: BodyCatalogue, composition: SystemComposition): SystemComposition {
  if (typeof composition.id !== "string" || composition.id.length === 0) throw new CompositionError("a composition needs an id");
  if (composition.bodies.length === 0) throw new CompositionError(`composition "${composition.id}" lists no bodies`);
  const seen = new Set<BodyId>();
  for (const id of composition.bodies) {
    if (!source.has(id)) throw new CompositionError(`composition "${composition.id}" names "${id}", which the catalogue lacks`);
    if (seen.has(id)) throw new CompositionError(`composition "${composition.id}" lists "${id}" twice`);
    seen.add(id);
  }
  if (!seen.has(composition.defaultCenter)) {
    throw new CompositionError(`composition "${composition.id}" centre "${composition.defaultCenter}" is not one of its bodies`);
  }
  for (const path of composition.paths ?? []) {
    if (!seen.has(path.body)) throw new CompositionError(`composition "${composition.id}" path names "${path.body}", which is not one of its bodies`);
    if (!(path.spanMs > 0) || !Number.isFinite(path.spanMs)) throw new CompositionError(`composition "${composition.id}" path for "${path.body}" needs a positive finite span`);
  }
  for (const path of composition.paths ?? []) {
    if (path.overlap !== undefined && !(path.overlap >= 0 && path.overlap <= 1)) throw new CompositionError(`composition "${composition.id}" path for "${path.body}" needs an overlap from 0 to 1 of a period`);
  }
  return Object.freeze({
    ...composition,
    bodies: Object.freeze([...composition.bodies]),
    ...(composition.paths === undefined ? {} : { paths: Object.freeze(composition.paths.map((path) => Object.freeze({ ...path }))) }),
  });
}

/** Earth and the Moon, about Earth, with the Moon's monthly loop. */
export const earthMoonSystem: SystemComposition = createComposition(catalogue, {
  id: "earth-moon",
  bodies: ["earth", "moon"],
  defaultCenter: "earth",
  paths: [{ body: "moon", spanMs: SIDEREAL_MONTH_MS }],
});

/**
 * The Sun and Earth, about the Sun. It declares no path yet: drawing Earth's year is the path Task's work, and
 * until then an experience that wants the line declares it as a path layer.
 */
export const sunEarthSystem: SystemComposition = createComposition(catalogue, {
  id: "sun-earth",
  bodies: ["sun", "earth"],
  defaultCenter: "sun",
});

/** Jupiter and Io, about Jupiter, with Io's loop: a centre that is neither Earth nor the Sun. */
export const jupiterIoSystem: SystemComposition = createComposition(catalogue, {
  id: "jupiter-io",
  bodies: ["jupiter", "io"],
  defaultCenter: "jupiter",
  paths: [{ body: "io", spanMs: IO_PERIOD_DAYS * 86_400_000 }],
});
