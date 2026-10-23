// Scene lights: points each body's directional light at the Sun from its resolved state.
import type { DirectionalLight } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import type { StateResolver } from "../core/stateResolver";
import { bodyLightDirections, chooseLightDirection } from "./lighting";
import type { RenderVector } from "./renderCoordinates";

/** Where the camera and each body stand in local render axes, for the illuminate-all choice. */
export interface LightViewpoint {
  readonly illuminateAll: boolean;
  readonly cameraLocal: RenderVector;
  readonly bodyLocalOf: (id: BodyId) => RenderVector;
}

/** Each lit body is lit along its own physical Sun direction (before any readable compression), or from the camera's side when illuminate-all is on. */
export function placeBodyLights(assets: readonly BodyAsset[], lights: ReadonlyMap<BodyId, DirectionalLight>, resolver: StateResolver, timeUtcMs: number, view: LightViewpoint): void {
  const directions = bodyLightDirections(assets.filter((asset) => lights.has(asset.definition.id)).map((asset) => asset.definition.id), resolver, timeUtcMs);
  for (const asset of assets) {
    const light = lights.get(asset.definition.id);
    const toSun = directions.get(asset.definition.id);
    if (light === undefined || toSun === undefined) continue;
    const [x, y, z] = chooseLightDirection(toSun, view.illuminateAll ? view.bodyLocalOf(asset.definition.id) : toSun, view.cameraLocal, view.illuminateAll);
    light.position.set(x, y, z);
  }
}
