import type { BodyId } from "../core/body";

/** A catalogued body the scene can draw. `requires` names the data package that must be passed to `mount` for it to be offered. */
export interface BodyRef {
  readonly id: BodyId;
  readonly label: string;
  readonly requires?: string;
}

const ref = (id: BodyId, label: string): BodyRef => Object.freeze({ id, label });

/** Ready-made bodies for `addBody`; their positions and pictures ship with the engine. */
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
