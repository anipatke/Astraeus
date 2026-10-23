// The shipped panels file a shower's settings name, read from disk: what the app's entry loads lazily and hands to the shower builder (T-152).
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ShowerSettings } from "../../src/experiences/showers/showerSettings";

// A story's panels file lives in the package of the demo that owns the story (packages/<package>/data/stories/<story>/panels.json); the settings name it by the path under that package.
const PACKAGES = ["astraeus-demo-showers", "astraeus-demo-planets", "astraeus-demo-apollo11"];
const panelsPath = (path: string): string => PACKAGES.map((name) => resolve(process.cwd(), "packages", name, path)).find((candidate) => existsSync(candidate)) ?? resolve(process.cwd(), path);

export const shippedPanelsOf = (settings: ShowerSettings): unknown =>
  typeof settings.story?.panels === "string" ? JSON.parse(readFileSync(panelsPath(settings.story.panels), "utf8")) : undefined;
