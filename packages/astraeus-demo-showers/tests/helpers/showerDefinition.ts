// The shower as the plug-in contract the app is given: what the engine builds from the scene (`definitionOf`), the way the site hands it over (tests in this and the site package build showers through it).
import { definitionOf } from "astraeus/tests/definitionOf";
import type { MeasuredLoad } from "../../src/experiences/showers/measuredOrbits";
import { buildShowerScene } from "../../src/experiences/showers/showerScene";
import { streamIdOf } from "../../src/experiences/showers/showerBasics";
import type { ShowerSettings } from "../../src/experiences/showers/showerSettings";

export { streamIdOf };

/** A shower's definition: what the engine builds from its scene with the settings' label. Production is off unless a test says so, so an absent file reads as the development message. */
export function buildShowerDefinition(settings: ShowerSettings, load: MeasuredLoad, panelsFile?: unknown, production = false): ReturnType<typeof definitionOf> & { label: string } {
  return { ...definitionOf(buildShowerScene(settings, load, panelsFile, production)), label: settings.label };
}
