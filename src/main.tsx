import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { needsPlanetSeries } from "./app/planetNeeds";
import { isPlanetId, loadPlanetSeries } from "./core/planetSeries";
import { choosePlanet, type PlanetEntry } from "./experiences/planets/planetChoice";
import { chooseShower, type ShowerEntry } from "./experiences/showers/showerChoice";
import { showerEntryName } from "./experiences/showers/showerEntry";
import type { ShowerSettings } from "./experiences/showers/showerSettings";
import type { ExperienceDefinition } from "./app/experienceDefinition";
import type { PlanetSystem } from "./experiences/planets/planetDefinition";
import { createAddressNavigation } from "./app/addressNavigation";
import { failBootLoader, showBootLoader } from "./shell/bootLoader";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the planets with ?experience=planets (&planet=<name> picks one; ?experience=jupiter-io still opens Jupiter), the meteor showers with ?experience=showers (&shower=<name> picks one), a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit).
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
  ...SYNTHETIC,
};
// Every data/showers/<name>.json is a shower of the one Showers experience, ?experience=showers&shower=<name> (the lowest "order" opens by default); a new file needs no change here.
// The settings files are small and already in the entry; the measured orbits (the large data) are fetched only for the chosen shower.
const SHOWER_FILES = import.meta.glob<{ readonly label: string; readonly order?: number }>("../data/showers/*.json", { eager: true, import: "default" });
const showerEntries: ShowerEntry[] = Object.entries(SHOWER_FILES).map(([path, json]) => ({ name: showerEntryName(path), label: json.label, order: json.order ?? 0 }));
// Every data/planets/<name>.json is a planet of the one Planets experience (the old ?experience=jupiter-io address too); a new file needs no change here.
// The settings files are small and already in the entry; a planet's system (moon list, positions, pictures) and story are fetched only for the chosen one.
// The public build offers Jupiter alone (owner, 2026-10-22): its globs name only Jupiter's files, so Vite leaves the other eight planets' settings, systems and maps out of the bundle.
type PlanetFile = { readonly label: string; readonly order: number; readonly default?: boolean };
const PLANET_FILES = __PUBLIC_BUILD__
  ? import.meta.glob<PlanetFile>("../data/planets/jupiter.json", { eager: true, import: "default" })
  : import.meta.glob<PlanetFile>("../data/planets/*.json", { eager: true, import: "default" });
const PLANET_SYSTEMS = __PUBLIC_BUILD__
  ? import.meta.glob<Record<string, PlanetSystem>>("./experiences/planets/systems/jupiter.ts")
  : import.meta.glob<Record<string, PlanetSystem>>("./experiences/planets/systems/*.ts");
const STORY_PANELS = import.meta.glob<unknown>("../data/stories/*/panels.json", { import: "default" });
const planetEntries: PlanetEntry[] = Object.entries(PLANET_FILES).map(([path, json]) => ({ name: showerEntryName(path), label: json.label, order: json.order, isDefault: json.default === true }));
// The choice is read from the address each time, so a switch inside the page builds the new one.
function currentChoices(search: string) {
  const query = new URLSearchParams(search);
  const requested = query.get("experience") ?? "";
  return {
    requested,
    planetChoice: requested === "planets" || requested === "jupiter-io" ? choosePlanet(planetEntries, query.get("planet")) : undefined,
    showerChoice: requested === "showers" ? chooseShower(showerEntries, query.get("shower")) : undefined,
  };
}
// A shower's measured orbits are the GMN file (a local fetch in development, the shipped copy in a build), so a shower is built once that has been looked for.
async function chooseDefinition(): Promise<ExperienceDefinition> {
  const { requested, planetChoice, showerChoice } = currentChoices(window.location.search);
  if (planetChoice !== undefined) {
    const [{ parsePlanetSettings }, { buildPlanetDefinition }] = await Promise.all([import("./experiences/planets/planetSettings"), import("./experiences/planets/planetDefinition")]);
    const settings = parsePlanetSettings(PLANET_FILES[`../data/planets/${planetChoice.name}.json`]);
    const [systemModule, panels] = await Promise.all([PLANET_SYSTEMS[`./experiences/planets/systems/${settings.system}.ts`]!(), STORY_PANELS[`../${settings.story.panels}`]!()]);
    return { ...buildPlanetDefinition(settings, systemModule[`${settings.system}System`]!, panels), switcher: planetChoice.switcher };
  }
  if (showerChoice !== undefined) {
    const [{ parseShowerSettings }, { buildShowerDefinition, loadShowerPanelsFile, showerComposition }, { loadMeasuredOrbits }] = await Promise.all([
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
    // Only the chosen shower's panels file is fetched, beside its orbits.
    const [load, panelsFile] = await Promise.all([loadMeasuredOrbits(settings.stream.iauCode, settings.id), loadShowerPanelsFile(settings, STORY_PANELS)]);
    return { ...buildShowerDefinition(settings, load, set, panelsFile), switcher: showerChoice.switcher };
  }
  return Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested]!() : (await import("./experiences/apollo11/apollo11Definition")).apollo11Definition;
}
// The planet series (about 1.4 MB) load only for a composition that contains a planet.
async function buildDefinition(): Promise<ExperienceDefinition> {
  const definition = await chooseDefinition();
  if (definition.prepare !== undefined) await definition.prepare();
  if (needsPlanetSeries(definition)) await loadPlanetSeries();
  return definition;
}
const root = createRoot(app);
// Each build is mounted under a new key, so the old app unmounts whole (its canvas and the scene's GPU resources are disposed) before the new one starts.
let mounts = 0;
const navigation = createAddressNavigation({
  push: (address) => window.history.pushState(null, "", address),
  showCover: showBootLoader,
  rebuild: async (isCurrent) => {
    const definition = await buildDefinition();
    if (isCurrent()) mount(definition);
  },
  fail: (error) => { failBootLoader(); throw error; },
});
function mount(definition: ExperienceDefinition): void {
  mounts += 1;
  root.render(<StrictMode><App key={mounts} definition={definition} onOpenAddress={navigation.open} /></StrictMode>);
}
window.addEventListener("popstate", navigation.popped);
buildDefinition().then(mount).catch((error: unknown) => { failBootLoader(); throw error; });
