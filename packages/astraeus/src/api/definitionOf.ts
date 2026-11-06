import type { ExperienceDefinition } from "../app/experienceDefinition";
import type { DataSource } from "./data";

/**
 * The engine's own route to what a scene builds: the app's plug-in contract (`ExperienceDefinition`). Not exported from the root, so a host cannot reach it (API-01).
 * `Scene`'s constructor registers how its state becomes a definition; `mount`, `load`, `check` and the engine's tests ask here.
 */
type Build = (data: readonly DataSource[]) => ExperienceDefinition;

const builders = new WeakMap<object, Build>();

/** Called once by the `Scene` constructor. A test may register again to stand in for the build; the earlier builder comes back so it can wrap it. */
export function registerDefinition(scene: object, build: Build): Build | undefined {
  const before = builders.get(scene);
  builders.set(scene, build);
  return before;
}

/** The definition the scene builds with `data`. Throws what `mount` throws: an empty scene, or a body whose data package `data` lacks. */
export function definitionOf(scene: object, data: readonly DataSource[] = []): ExperienceDefinition {
  return builders.get(scene)!(data); // a non-Scene fails here with the engine's own TypeError; only `Scene` is registered
}

/** The data packages the scene's bodies need that `data` does not provide. */
export function missingDataOf(scene: object, data: readonly DataSource[] = []): readonly string[] {
  return missing.get(scene)!(data);
}

const missing = new WeakMap<object, (data: readonly DataSource[]) => readonly string[]>();

/** Called once by the `Scene` constructor. */
export function registerMissingData(scene: object, find: (data: readonly DataSource[]) => readonly string[]): void {
  missing.set(scene, find);
}
