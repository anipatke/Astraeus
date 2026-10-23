// The shipped panels file a shower's settings name, read from disk: what the app's entry loads lazily and hands to the shower builder (T-152).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ShowerSettings } from "../../src/experiences/showers/showerSettings";

export const shippedPanelsOf = (settings: ShowerSettings): unknown =>
  typeof settings.story?.panels === "string" ? JSON.parse(readFileSync(resolve(process.cwd(), settings.story.panels), "utf8")) : undefined;
