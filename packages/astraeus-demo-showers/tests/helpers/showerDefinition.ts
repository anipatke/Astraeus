// The shower as the plug-in contract the app is given: the scene's `toDefinition()`, the way the site hands it over (tests in this and the site package build showers through it).
import type { ExperienceDefinition } from "astraeus/app/experienceDefinition";
import type { MeasuredLoad } from "../../src/experiences/showers/measuredOrbits";
import { buildShowerScene } from "../../src/experiences/showers/showerScene";
import { streamIdOf } from "../../src/experiences/showers/showerBasics";
import type { ShowerSettings } from "../../src/experiences/showers/showerSettings";

export { streamIdOf };

/** A shower's definition: its scene's `toDefinition()` with the settings' label. Production is off unless a test says so, so an absent file reads as the development message. */
export function buildShowerDefinition(settings: ShowerSettings, load: MeasuredLoad, panelsFile?: unknown, production = false): ExperienceDefinition {
  return { ...buildShowerScene(settings, load, panelsFile, production).toDefinition(), label: settings.label };
}
