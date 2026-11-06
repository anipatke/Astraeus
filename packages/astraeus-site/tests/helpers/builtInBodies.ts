// The bodies the engine ships, read through the public API (a scene holding each built-in body), for tests that check the site against the engine's records (O-059 T-272).
import { Scene, callisto, charon, deimos, dione, earth, enceladus, europa, ganymede, iapetus, io, jupiter, mars, mercury, mimas, moon, neptune, phobos, pluto, rhea, saturn, sun, tethys, titan, triton, uranus, venus, type BodyRef, type SceneBodyRead } from "astraeus";
import { PICTURES } from "astraeus-data";
import type { TextureRef } from "astraeus";

/** Every body the package exports as a ready-made reference. */
export const BUILT_IN: readonly BodyRef[] = [sun, mercury, venus, earth, moon, mars, phobos, deimos, jupiter, io, europa, ganymede, callisto, saturn, mimas, enceladus, tethys, dione, rhea, titan, iapetus, uranus, neptune, triton, pluto, charon];

/** A scene holding every built-in body, read as a host reads it (`Scene.bodies`). */
export const builtInReads: readonly SceneBodyRead[] = BUILT_IN.reduce((scene, body) => scene.addBody(body), new Scene()).bodies;

/** The map and licence a body shows: the engine's own texture, else the picture `astraeus-data` brings under its id; undefined for a body drawn from a flat colour. */
export function textureOf(id: string): TextureRef | undefined {
  return builtInReads.find((read) => read.id === id)?.texture ?? PICTURES[id];
}
