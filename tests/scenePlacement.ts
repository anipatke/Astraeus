import { createOrbAstronomyAdapter, type AstronomyAdapter } from "../src/core/astronomyAdapter";
import type { BodyId } from "../src/core/body";
import { createSceneResolver, type ScenePlacement } from "../src/app/sceneLayout";

/** A scene placement about `center`, from a resolver over the built-in catalogue. */
export function placementAbout(center: BodyId, adapter: AstronomyAdapter = createOrbAstronomyAdapter()): ScenePlacement {
  return { resolver: createSceneResolver(adapter), center };
}
