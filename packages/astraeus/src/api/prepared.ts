import type { DataSource, Scene } from "./scene";
import type { ExperienceDefinition } from "../app/experienceDefinition";

/** A scene turned into the viewer's definition, with the promise of its data. The one path `mount` and `AstraeusScene` share. */
export interface PreparedScene {
  readonly definition: ExperienceDefinition;
  /** Resolves once the definition's data has loaded; rejects if loading failed. */
  readonly ready: Promise<void>;
}

/** Builds the definition (throws a `SceneError` for a missing data package or an empty scene) and starts loading its data. */
export function prepareScene(scene: Scene, data: readonly DataSource[] = []): PreparedScene {
  const definition = scene.toDefinition(data);
  return { definition, ready: definition.prepare?.() ?? Promise.resolve() };
}
