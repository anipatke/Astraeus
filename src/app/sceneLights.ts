// Scene lights: points each body's directional light at the Sun from its resolved state.
import type { DirectionalLight } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import type { StateResolver } from "../core/stateResolver";
import { bodyLightDirections } from "./lighting";

/** Each lit body is lit along its own physical Sun direction (before any readable compression). */
export function placeBodyLights(assets: readonly BodyAsset[], lights: ReadonlyMap<BodyId, DirectionalLight>, resolver: StateResolver, timeUtcMs: number): void {
  const directions = bodyLightDirections(assets.filter((asset) => lights.has(asset.definition.id)).map((asset) => asset.definition.id), resolver, timeUtcMs);
  for (const asset of assets) {
    const light = lights.get(asset.definition.id);
    const toSun = directions.get(asset.definition.id);
    if (light === undefined || toSun === undefined) continue;
    light.position.set(toSun[0], toSun[1], toSun[2]);
  }
}
