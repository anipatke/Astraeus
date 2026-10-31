// O-049 T-212: a listed moon lives in the scene's own catalogue only, so no drawing code may look a body up in the built-in one (the first browser run of the Uranus journey failed with `unknown body "miranda"` from PathView).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene, sun, uranus } from "astraeus";
import { compositionPathLayer } from "../src/app/PathView";
import { StateResolver } from "../src/core/stateResolver";

const APP = join(__dirname, "..", "src", "app");
/** Files that import the built-in catalogue unaliased only as the default of a `source` parameter that callers pass. */
const DEFAULT_ONLY = new Set(["sceneFraming.ts", "sceneLayout.ts"]);

describe("the scene's own catalogue reaches the drawing code", () => {
  it("no file under src/app imports the built-in catalogue unaliased, except the two that use it as a parameter default", () => {
    const offenders = readdirSync(APP).filter((file) => /\.tsx?$/.test(file) && !DEFAULT_ONLY.has(file))
      .filter((file) => /import\s*\{[^}]*\bcatalogue\b(?!\s+as)[^}]*\}\s*from\s*"\.\.\/assets\/catalogue"/.test(readFileSync(join(APP, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("a composition path for a listed moon takes its parent from the scene's catalogue", () => {
    const definition = new Scene().addBody(sun).addBody(uranus).addBody("miranda", { orbit: true }).toDefinition([{ name: "astraeus-data-uranus", provides: ["miranda"] }]);
    const path = definition.composition!.paths!.find((p) => p.body === "miranda")!;
    expect(() => compositionPathLayer(path, {} as StateResolver)).toThrow(/unknown body "miranda"/); // the built-in catalogue lacks it
    expect(compositionPathLayer(path, {} as StateResolver, definition.catalogue)).toMatchObject({ center: "uranus" });
  });
});
