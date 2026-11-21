import type { ExperienceDefinition } from "../app/experienceDefinition";
import type { DataSource } from "./data";
import { SceneError } from "./errors";

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

/** The builder registered for `scene`; something that is not a `Scene` is `bad-scene`, so no route in meets the engine's own TypeError. */
function builderOf(scene: unknown): Build {
  const build = typeof scene === "object" && scene !== null ? builders.get(scene) : undefined;
  if (build === undefined) throw new SceneError("bad-scene", "expected a Scene: build one with new Scene().addBody(...)");
  return build;
}

/** The definition the scene builds with `data`. Throws what `mount` throws: `bad-scene` for a non-Scene, an empty scene, or a body whose data package `data` lacks. */
export function definitionOf(scene: object, data: readonly DataSource[] = []): ExperienceDefinition {
  return builderOf(scene)(data);
}

/** The data packages the scene's bodies need that `data` does not provide. */
export function missingDataOf(scene: object, data: readonly DataSource[] = []): readonly string[] {
  const find = typeof scene === "object" && scene !== null ? missing.get(scene) : undefined;
  if (find === undefined) throw new SceneError("bad-scene", "expected a Scene: build one with new Scene().addBody(...)");
  return find(data);
}

const missing = new WeakMap<object, (data: readonly DataSource[]) => readonly string[]>();

/** Called once by the `Scene` constructor. */
export function registerMissingData(scene: object, find: (data: readonly DataSource[]) => readonly string[]): void {
  missing.set(scene, find);
}
