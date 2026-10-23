import type { BodyId } from "../core/body";

/** A catalogued body the scene can draw. `requires` names the data package that must be passed to `mount` for it to be offered. */
export interface BodyRef {
  readonly id: BodyId;
  readonly label: string;
  readonly requires?: string;
}

const ref = (id: BodyId, label: string, requires?: string): BodyRef => Object.freeze({ id, label, ...(requires === undefined ? {} : { requires }) });

/** Ready-made bodies for `addBody`; the Sun, Earth, Moon and planets have their positions and pictures in the engine. */
export const sun = ref("sun", "Sun");
export const mercury = ref("mercury", "Mercury");
export const venus = ref("venus", "Venus");
export const earth = ref("earth", "Earth");
export const moon = ref("moon", "Moon");
export const mars = ref("mars", "Mars");
export const jupiter = ref("jupiter", "Jupiter");
export const saturn = ref("saturn", "Saturn");
export const uranus = ref("uranus", "Uranus");
export const neptune = ref("neptune", "Neptune");
export const pluto = ref("pluto", "Pluto");

/**
 * Moons need their planet's positions package (`astraeus-data-<planet>`, 120 MB of fits in all, split per planet) passed to `mount`; their maps come from
 * `astraeus-data` when it is passed too, and without it they are plain coloured spheres. They are not offered without the positions.
 */
export const io = ref("io", "Io", "astraeus-data-jupiter");
export const europa = ref("europa", "Europa", "astraeus-data-jupiter");
export const ganymede = ref("ganymede", "Ganymede", "astraeus-data-jupiter");
export const callisto = ref("callisto", "Callisto", "astraeus-data-jupiter");
export const mimas = ref("mimas", "Mimas", "astraeus-data-saturn");
export const enceladus = ref("enceladus", "Enceladus", "astraeus-data-saturn");
export const tethys = ref("tethys", "Tethys", "astraeus-data-saturn");
export const dione = ref("dione", "Dione", "astraeus-data-saturn");
export const rhea = ref("rhea", "Rhea", "astraeus-data-saturn");
export const titan = ref("titan", "Titan", "astraeus-data-saturn");
export const iapetus = ref("iapetus", "Iapetus", "astraeus-data-saturn");
export const triton = ref("triton", "Triton", "astraeus-data-neptune");
export const charon = ref("charon", "Charon", "astraeus-data-pluto");
export const phobos = ref("phobos", "Phobos", "astraeus-data-mars");
export const deimos = ref("deimos", "Deimos", "astraeus-data-mars");

const READY_MADE: readonly BodyRef[] = [sun, mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune, pluto, io, europa, ganymede, callisto, mimas, enceladus, tethys, dione, rhea, titan, iapetus, triton, charon, phobos, deimos];

/** The ready-made reference for a catalogued id, so `addBody("titan")` knows Titan needs `astraeus-data-saturn`. */
export const readyMade = (id: BodyId): BodyRef | undefined => READY_MADE.find((body) => body.id === id);
