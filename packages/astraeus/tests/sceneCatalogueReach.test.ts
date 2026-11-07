// O-049 T-212: a listed moon lives in the scene's own catalogue only, so no drawing code may look a body up in the built-in one (the first browser run of the Uranus journey failed with `unknown body "miranda"` from PathView).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene, sun, uranus } from "astraeus";
import { compositionPathLayer } from "../src/app/PathView";
import { StateResolver } from "../src/core/stateResolver";
import { definitionOf } from "../src/api/definitionOf";

const APP = join(__dirname, "..", "src", "app");
/** Files that import the built-in catalogue unaliased only as the default of a `source` parameter that callers pass. */
const DEFAULT_ONLY = new Set(["sceneFraming.ts", "sceneLayout.ts"]);

/**
 * Functions in src/app that default a catalogue parameter to the built-in catalogue (I-123: the default let `compositionPathLayer` look a listed moon up in the wrong catalogue). A new one fails
 * until it is listed here with the reason its callers are safe: every runtime caller passes the scene's own catalogue, or the function only ever sees built-in ids.
 */
const DEFAULT_PARAMETER = new Map<string, string>([
  ["sceneLayout.ts:createSceneResolver", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["sceneLayout.ts:readoutPairOf", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["sceneFraming.ts:focusRadius", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["sceneFraming.ts:assignBodyLayers", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["PathView.ts:compositionPathLayer", "the scene passes definition.catalogue; the test below proves the default fails for a listed moon"],
  ["PathView.ts:compositionPathView", "the scene passes definition.catalogue"],
  ["bodyMetrics.ts:bodyMetrics", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["catalogueItem.ts:catalogueItem", "experience objects are built-in bodies by definition"],
  ["trackedMetrics.ts:createReadoutMetrics", "the scene passes its catalogue; the default serves built-in-only unit tests"],
  ["experienceDefinition.ts:validatePathSpec", "the definition passes its catalogue"],
  ["experienceDefinition.ts:validateSunCentred", "the definition passes its catalogue"],
]);

describe("the scene's own catalogue reaches the drawing code", () => {
  it("every src/app function that defaults a catalogue parameter to the built-in catalogue is listed with a reason", () => {
    const found: string[] = [];
    for (const file of readdirSync(APP).filter((name) => /\.tsx?$/.test(name))) {
      const text = readFileSync(join(APP, file), "utf8");
      for (const match of text.matchAll(/function\s+(\w+)\s*(?:<[^>]*>)?\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g)) {
        if (/=\s*(?:builtInCatalogue|catalogue)\b(?!\.)/.test(match[2]!)) found.push(`${file}:${match[1]}`);
      }
    }
    const unlisted = found.filter((key) => !DEFAULT_PARAMETER.has(key));
    expect(unlisted).toEqual([]);
    expect([...DEFAULT_PARAMETER.keys()].filter((key) => !found.includes(key))).toEqual([]); // no stale entry; also proves the scan sees them
  });

  it("no file under src/app imports the built-in catalogue unaliased, except the two that use it as a parameter default", () => {
    const offenders = readdirSync(APP).filter((file) => /\.tsx?$/.test(file) && !DEFAULT_ONLY.has(file))
      .filter((file) => /import\s*\{[^}]*\bcatalogue\b(?!\s+as)[^}]*\}\s*from\s*"\.\.\/assets\/catalogue"/.test(readFileSync(join(APP, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("a composition path for a listed moon takes its parent from the scene's catalogue", () => {
    const definition = definitionOf(new Scene().addBody(sun).addBody(uranus).addBody("miranda", { orbit: true }), [{ name: "astraeus-data-uranus", provides: ["miranda"] }]);
    const path = definition.composition!.paths!.find((p) => p.body === "miranda")!;
    expect(() => compositionPathLayer(path, {} as StateResolver)).toThrow(/unknown body "miranda"/); // the built-in catalogue lacks it
    expect(compositionPathLayer(path, {} as StateResolver, definition.catalogue)).toMatchObject({ center: "uranus" });
  });
});
