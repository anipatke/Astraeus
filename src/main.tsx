import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { needsPlanetSeries } from "./app/planetNeeds";
import { isPlanetId, loadPlanetSeries } from "./core/planetSeries";
import { showerEntryName } from "./experiences/showers/showerEntry";
import type { ShowerSettings } from "./experiences/showers/showerSettings";
import type { ExperienceDefinition } from "./app/experienceDefinition";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the Earth–Moon Explorer with ?experience=earth-moon, Jupiter and Io with ?experience=jupiter-io, a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit).
// Each is its own chunk, fetched only for the experience asked for (I-022), so the others' code and data never download.
const DEFINITIONS: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = {
  "earth-moon": async () => (await import("./experiences/earth-moon/earthMoonExplorer")).earthMoonExplorer,
  "jupiter-io": async () => (await import("./experiences/jupiter-io/jupiterIo")).jupiterIoExplorer,
  synthetic: async () => (await import("./synthetic/syntheticDefinition")).syntheticDefinition,
  "synthetic-bare": async () => (await import("./synthetic/syntheticDefinition")).syntheticBareDefinition,
  "synthetic-ring": async () => (await import("./synthetic/syntheticRingDefinition")).syntheticRingDefinition,
  "synthetic-belt": async () => (await import("./synthetic/syntheticRingDefinition")).syntheticBeltDefinition,
  "synthetic-listed": async () => (await import("./synthetic/syntheticListedDefinition")).syntheticListedDefinition,
  "synthetic-eccentric": async () => (await import("./synthetic/syntheticEccentricDefinition")).syntheticEccentricDefinition,
};
// Every data/showers/<name>.json is a shower, mounted as ?experience=shower-<name>; a new file needs no change here. Only the requested one is built.
const SHOWER_FILES = import.meta.glob<unknown>("../data/showers/*.json", { eager: true, import: "default" });
const showerSettingsByName = new Map(Object.entries(SHOWER_FILES).map(([path, json]) => [`shower-${showerEntryName(path)}`, json]));
const requested = new URLSearchParams(window.location.search).get("experience") ?? "";
const showerSettings = showerSettingsByName.get(requested);
// A shower's measured orbits are a locally fetched file (tools/data/fetch-meteoroid-orbits.mjs), so a shower is built once that has been looked for.
async function chooseDefinition(): Promise<ExperienceDefinition> {
  if (showerSettings !== undefined) {
    const [{ parseShowerSettings }, { buildShowerDefinition, showerComposition }, { loadMeasuredOrbits, offeredSources }] = await Promise.all([
      import("./experiences/showers/showerSettings"),
      import("./experiences/showers/showerDefinition"),
      import("./experiences/showers/measuredOrbits"),
    ]);
    const parsed = parseShowerSettings(showerSettings);
    // ?span=activity|year overrides the settings file's timeline span, for comparison.
    const span = new URLSearchParams(window.location.search).get("span");
    const settings: ShowerSettings = span === "activity" || span === "year" ? { ...parsed, timeline: { ...parsed.timeline, span } } : parsed;
    // ?orbits=all|reliable picks the orbit set; the settings file's own choice otherwise.
    const orbits = new URLSearchParams(window.location.search).get("orbits");
    const set = orbits === "all" || orbits === "reliable" ? orbits : settings.stream.quality.default;
    // ?source=cams|gmn picks the catalogue the orbits are read from (gmn only for a shower whose settings name it); the settings file's own choice otherwise.
    const requestedSource = new URLSearchParams(window.location.search).get("source");
    // A production build reads only what it ships: a source it does not ship is neither offered nor honoured (the address falls back to the settings file's own, shipped, choice), so no choice draws an empty stream.
    const offered = offeredSources(settings.id, settings.stream.iauCode, settings.stream.sources.gmn === undefined ? ["cams"] : ["cams", "gmn"]);
    const wanted = requestedSource === "cams" || (requestedSource === "gmn" && settings.stream.sources.gmn !== undefined) ? requestedSource : settings.stream.source;
    const source = offered.includes(wanted) ? wanted : offered.includes(settings.stream.source) ? settings.stream.source : (offered[0] ?? settings.stream.source);
    // Building a shower already reads planet positions (the planets' orbit paths), so the series load first when its composition has a planet.
    if (showerComposition(settings).bodies.some(isPlanetId)) await loadPlanetSeries();
    return buildShowerDefinition(settings, await loadMeasuredOrbits(settings.stream.iauCode, source, settings.id), set, source, offered);
  }
  return Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested]!() : (await import("./experiences/apollo11/apollo11Definition")).apollo11Definition;
}
// The planet series (about 1.4 MB) load only for a composition that contains a planet.
async function start(): Promise<void> {
  const definition = await chooseDefinition();
  if (needsPlanetSeries(definition)) await loadPlanetSeries();
  createRoot(app!).render(<StrictMode><App definition={definition} /></StrictMode>);
}
void start();
