import { createOrbAstronomyAdapter, type AstronomyAdapter } from "../src/core/astronomyAdapter";
import type { BodyId } from "../src/core/body";
import { Object3D } from "three";
import { catalogue } from "../src/assets/catalogue";
import type { State } from "../src/core/state";
import type { ScalePolicy } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { createSceneResolver, placeBody, type PlacedState, type ScenePlacement } from "../src/app/sceneLayout";

/** A scene placement about `center`, from a resolver over the built-in catalogue. */
export function placementAbout(center: BodyId, adapter: AstronomyAdapter = createOrbAstronomyAdapter()): ScenePlacement {
  return { resolver: createSceneResolver(adapter), center };
}

// The Earth/Moon pair on a fixed hierarchy: a test fixture for the placement maths, not part of the app.
const EARTH_TEXTURE_YAW_RAD = catalogue.get("earth").visual.textureYawRad ?? 0;
const MOON_TEXTURE_YAW_RAD = catalogue.get("moon").visual.textureYawRad ?? 0;

/** Stationary scientific scene root and its siblings; nothing here is parented to a body mesh. */
export interface SceneHierarchy {
  readonly root: Object3D;
  readonly earthGroup: Object3D;
  readonly earthMesh: Object3D;
  readonly moonGroup: Object3D;
  readonly moonMesh: Object3D;
}

export function createSceneHierarchy(): SceneHierarchy {
  const root = new Object3D();
  const earthGroup = new Object3D();
  const earthMesh = new Object3D();
  const moonGroup = new Object3D();
  const moonMesh = new Object3D();
  earthGroup.add(earthMesh);
  moonGroup.add(moonMesh);
  root.add(earthGroup, moonGroup);
  return { root, earthGroup, earthMesh, moonGroup, moonMesh };
}

/**
 * The Earth/Moon pair on a fixed hierarchy, placed through `placeBody`. Earth/Moon positions are expressed in a
 * common centre (earth-centred: Earth is the zero vector).
 */
export function placeBodies(
  hierarchy: SceneHierarchy,
  earth: State,
  moon: State,
  policy: ScalePolicy,
  origin: FloatingOrigin,
  earthPositionKm: ArrayLike<number> = [0, 0, 0],
): PlacedState {
  const moonKm = [
    earthPositionKm[0] + moon.positionKm[0],
    earthPositionKm[1] + moon.positionKm[1],
    earthPositionKm[2] + moon.positionKm[2],
  ];
  return {
    earthAbsolute: placeBody(hierarchy.earthGroup, hierarchy.earthMesh, earth, earthPositionKm, EARTH_TEXTURE_YAW_RAD, policy, origin),
    moonAbsolute: placeBody(hierarchy.moonGroup, hierarchy.moonMesh, moon, moonKm, MOON_TEXTURE_YAW_RAD, policy, origin),
  };
}


/** Whether a definition's composition mounts both Earth and the Moon (test helper; the app no longer asks). */
export function hasEarthMoon(definition: { readonly composition?: { readonly bodies: readonly BodyId[] } }): boolean {
  const bodies = definition.composition?.bodies ?? [];
  return bodies.includes("earth") && bodies.includes("moon");
}
