import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { needsPlanetSeries } from "./app/planetNeeds";
import { isPlanetId, loadPlanetSeries } from "./core/planetSeries";
import { chooseShower, type ShowerEntry } from "./experiences/showers/showerChoice";
import { showerEntryName } from "./experiences/showers/showerEntry";
import type { ShowerSettings } from "./experiences/showers/showerSettings";
import type { ExperienceDefinition } from "./app/experienceDefinition";
import { failBootLoader } from "./shell/bootLoader";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the Earth–Moon Explorer with ?experience=earth-moon, Jupiter and Io with ?experience=jupiter-io, the meteor showers with ?experience=showers (&shower=<name> picks one), a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit).
// Each is its own chunk, fetched only for the experience asked for (I-022), so the others' code and data never download.
// The made-up (synthetic) ones are test experiences: the dev server mounts them, a public build (ASTRAEUS_PUBLIC_BUILD=1) leaves them out of the bundle, so they fall back to the default experience (T-068).
const SYNTHETIC: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = __PUBLIC_BUILD__ ? {} : {
  synthetic: async () => (await import("./synthetic/syntheticDefinition")).syntheticDefinition,
  "synthetic-bare": async () => (await import("./synthetic/syntheticDefinition")).syntheticBareDefinition,
  "synthetic-ring": async () => (await import("./synthetic/syntheticRingDefinition")).syntheticRingDefinition,
  "synthetic-belt": async () => (await import("./synthetic/syntheticRingDefinition")).syntheticBeltDefinition,
  "synthetic-listed": async () => (await import("./synthetic/syntheticListedDefinition")).syntheticListedDefinition,
  "synthetic-eccentric": async () => (await import("./synthetic/syntheticEccentricDefinition")).syntheticEccentricDefinition,
};
const DEFINITIONS: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = {
  "earth-moon": async () => (await import("./experiences/earth-moon/earthMoonExplorer")).earthMoonExplorer,
  "jupiter-io": async () => (await import("./experiences/jupiter-io/jupiterIo")).jupiterIoExplorer,
  ...SYNTHETIC,
};
// Every data/showers/<name>.json is a shower of the one Showers experience, ?experience=showers&shower=<name> (the lowest "order" opens by default); a new file needs no change here.
// The settings files are small and already in the entry; the measured orbits (the large data) are fetched only for the chosen shower.
const SHOWER_FILES = import.meta.glob<{ readonly label: string; readonly order?: number }>("../data/showers/*.json", { eager: true, import: "default" });
const showerEntries: ShowerEntry[] = Object.entries(SHOWER_FILES).map(([path, json]) => ({ name: showerEntryName(path), label: json.label, order: json.order ?? 0 }));
const requested = new URLSearchParams(window.location.search).get("experience") ?? "";
const showerChoice = requested === "showers" ? chooseShower(showerEntries, new URLSearchParams(window.location.search).get("shower")) : undefined;
// A shower's measured orbits are the GMN file (a local fetch in development, the shipped copy in a build), so a shower is built once that has been looked for.
async function chooseDefinition(): Promise<ExperienceDefinition> {
  if (showerChoice !== undefined) {
    const [{ parseShowerSettings }, { buildShowerDefinition, showerComposition }, { loadMeasuredOrbits }] = await Promise.all([
      import("./experiences/showers/showerSettings"),
      import("./experiences/showers/showerDefinition"),
      import("./experiences/showers/measuredOrbits"),
    ]);
    const parsed = parseShowerSettings(SHOWER_FILES[`../data/showers/${showerChoice.name}.json`]);
    // ?span=activity|year overrides the settings file's timeline span, for comparison.
    const span = new URLSearchParams(window.location.search).get("span");
    const settings: ShowerSettings = span === "activity" || span === "year" ? { ...parsed, timeline: { ...parsed.timeline, span } } : parsed;
    // ?orbits=all|reliable picks the orbit set; the settings file's own choice otherwise.
    const orbits = new URLSearchParams(window.location.search).get("orbits");
    const set = orbits === "all" || orbits === "reliable" ? orbits : settings.stream.quality.default;
    // Building a shower already reads planet positions (the planets' orbit paths), so the series load first when its composition has a planet.
    if (showerComposition(settings).bodies.some(isPlanetId)) await loadPlanetSeries();
    return { ...buildShowerDefinition(settings, await loadMeasuredOrbits(settings.stream.iauCode, settings.id), set), switcher: showerChoice.switcher };
  }
  return Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested]!() : (await import("./experiences/apollo11/apollo11Definition")).apollo11Definition;
}
// The planet series (about 1.4 MB) load only for a composition that contains a planet.
async function start(): Promise<void> {
  const definition = await chooseDefinition();
  if (definition.prepare !== undefined) await definition.prepare();
  if (needsPlanetSeries(definition)) await loadPlanetSeries();
  createRoot(app!).render(<StrictMode><App definition={definition} /></StrictMode>);
}
start().catch((error: unknown) => { failBootLoader(); throw error; });
