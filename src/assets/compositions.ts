import type { BodyId } from "../core/body";
import { IO_PERIOD_DAYS } from "../core/bodies/io";
import { catalogue, type BodyCatalogue } from "./catalogue";
import { resolveOrbitLook, type OrbitLook } from "./orbitLook";

/** One sidereal month, the span the Moon's orbit path covers. */
export const SIDEREAL_MONTH_MS = 27.321661 * 86_400_000;

/** A path the composition draws by default: the declared body's positions about its own parent, carried with that parent. */
export interface CompositionPath {
  readonly body: BodyId;
  readonly spanMs: number;
  readonly samples?: number;
  /** Look of the line: any of the `OrbitLook` settings over Planetary Explorer's defaults. Live controls start from the result. */
  readonly look?: Partial<OrbitLook>;
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
  for (const path of composition.paths ?? []) resolveOrbitLook(path.look, `composition "${composition.id}" path for "${path.body}"`);
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
  // Io's orbit is Keplerian and closes exactly (a gap of 0 km), so its ring needs no end fade; the arc and zoom brightening stay.
  paths: [{ body: "io", spanMs: IO_PERIOD_DAYS * 86_400_000, look: { endFadeOn: false } }],
});

/**
 * Jupiter and its four mapped moons, about Jupiter (positions from the core curve fits). Io keeps its loop and look; the other three moons'
 * orbit lines are drawn with the small moons' batch (one draw for all), so the experience declares them there.
 */
export const jupiterMoonsSystem: SystemComposition = createComposition(catalogue, {
  id: "jupiter-moons",
  bodies: ["jupiter", "io", "europa", "ganymede", "callisto"],
  defaultCenter: "jupiter",
  paths: [{ body: "io", spanMs: IO_PERIOD_DAYS * 86_400_000, look: { endFadeOn: false } }],
});
