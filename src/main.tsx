import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { earthMoonExplorer } from "./experiences/earth-moon/earthMoonExplorer";
import { jupiterIoExplorer } from "./experiences/jupiter-io/jupiterIo";
import { apollo11Definition } from "./experiences/apollo11/apollo11Definition";
import { syntheticBareDefinition, syntheticDefinition } from "./synthetic/syntheticDefinition";
import { syntheticBeltDefinition, syntheticRingDefinition } from "./synthetic/syntheticRingDefinition";
import { syntheticEccentricDefinition } from "./synthetic/syntheticEccentricDefinition";
import { syntheticListedDefinition } from "./synthetic/syntheticListedDefinition";
import { buildShowerDefinition, showerEntryName } from "./experiences/showers/showerDefinition";
import { loadMeasuredOrbits } from "./experiences/showers/measuredOrbits";
import { parseShowerSettings, type ShowerSettings } from "./experiences/showers/showerSettings";
import type { ExperienceDefinition } from "./app/experienceDefinition";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the Earth–Moon Explorer with ?experience=earth-moon, Jupiter and Io with ?experience=jupiter-io, a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit).
const DEFINITIONS = { "earth-moon": earthMoonExplorer, "jupiter-io": jupiterIoExplorer, synthetic: syntheticDefinition, "synthetic-bare": syntheticBareDefinition, "synthetic-ring": syntheticRingDefinition, "synthetic-belt": syntheticBeltDefinition, "synthetic-listed": syntheticListedDefinition, "synthetic-eccentric": syntheticEccentricDefinition };
// Every data/showers/<name>.json is a shower, mounted as ?experience=shower-<name>; a new file needs no change here. Only the requested one is built.
const SHOWER_FILES = import.meta.glob<unknown>("../data/showers/*.json", { eager: true, import: "default" });
const showerSettingsByName = new Map(Object.entries(SHOWER_FILES).map(([path, json]) => [`shower-${showerEntryName(path)}`, json]));
const requested = new URLSearchParams(window.location.search).get("experience") ?? "";
const showerSettings = showerSettingsByName.get(requested);
// A shower's measured orbits are a locally fetched file (tools/data/fetch-meteoroid-orbits.mjs), so a shower is built once that has been looked for.
async function chooseDefinition(): Promise<ExperienceDefinition> {
  if (showerSettings !== undefined) {
    const parsed = parseShowerSettings(showerSettings);
    // ?span=activity|year overrides the settings file's timeline span, for comparison.
    const span = new URLSearchParams(window.location.search).get("span");
    const settings: ShowerSettings = span === "activity" || span === "year" ? { ...parsed, timeline: { ...parsed.timeline, span } } : parsed;
    // ?orbits=all|reliable picks the orbit set; the settings file's own choice otherwise.
    const orbits = new URLSearchParams(window.location.search).get("orbits");
    const set = orbits === "all" || orbits === "reliable" ? orbits : settings.stream.quality.default;
    // ?source=cams|gmn picks the catalogue the orbits are read from (gmn only for a shower whose settings name it); the settings file's own choice otherwise.
    const requestedSource = new URLSearchParams(window.location.search).get("source");
    const source = requestedSource === "cams" || (requestedSource === "gmn" && settings.stream.sources.gmn !== undefined) ? requestedSource : settings.stream.source;
    return buildShowerDefinition(settings, await loadMeasuredOrbits(settings.stream.iauCode, source, settings.id), set, source);
  }
  return Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested as keyof typeof DEFINITIONS] : apollo11Definition;
}
void chooseDefinition().then((definition) => createRoot(app).render(<StrictMode><App definition={definition} /></StrictMode>));
