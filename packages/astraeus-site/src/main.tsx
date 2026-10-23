import "./registerData";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "astraeus/app/App";
import { needsPlanetSeries } from "astraeus/app/planetNeeds";
import { isPlanetId, loadPlanetSeries } from "astraeus/core/planetSeries";
import { choosePlanet, type PlanetEntry } from "astraeus-demo-planets/experiences/planets/planetChoice";
import { chooseShower, showerEntryName, type ShowerEntry } from "astraeus-demo-showers/experiences/showers/showerEntry";
import type { ShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import type { ExperienceDefinition } from "astraeus/app/experienceDefinition";
import { PLANET_SYSTEMS } from "astraeus-demo-planets/experiences/planets/planetSystems";
import { createAddressNavigation } from "astraeus/app/addressNavigation";
import { failBootLoader, showBootLoader } from "astraeus/shell/bootLoader";
import "astraeus/app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the planets with ?experience=planets (&planet=<name> picks one; ?experience=jupiter-io still opens Jupiter), the meteor showers with ?experience=showers (&shower=<name> picks one), a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit).
// Each is its own chunk, fetched only for the experience asked for (I-022), so the others' code and data never download.
// The made-up (synthetic) ones are test experiences: the dev server mounts them, a public build (ASTRAEUS_PUBLIC_BUILD=1) leaves them out of the bundle, so they fall back to the default experience (T-068).
const SYNTHETIC: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = __PUBLIC_BUILD__ ? {} : {
  synthetic: async () => (await import("astraeus/synthetic/syntheticDefinition")).syntheticDefinition,
  "synthetic-bare": async () => (await import("astraeus/synthetic/syntheticDefinition")).syntheticBareDefinition,
  "synthetic-ring": async () => (await import("astraeus/synthetic/syntheticRingDefinition")).syntheticRingDefinition,
  "synthetic-belt": async () => (await import("astraeus/synthetic/syntheticRingDefinition")).syntheticBeltDefinition,
  "synthetic-listed": async () => (await import("astraeus/synthetic/syntheticListedDefinition")).syntheticListedDefinition,
  "synthetic-eccentric": async () => (await import("astraeus/synthetic/syntheticEccentricDefinition")).syntheticEccentricDefinition,
};
const DEFINITIONS: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = {
  ...SYNTHETIC,
};
// Every data/showers/<name>.json is a shower of the one Showers experience, ?experience=showers&shower=<name> (the lowest "order" opens by default); a new file needs no change here.
// The settings files are small and already in the entry; the measured orbits (the large data) are fetched only for the chosen shower.
const SHOWER_FILES = import.meta.glob<{ readonly label: string; readonly order?: number }>("../../astraeus-demo-showers/data/showers/*.json", { eager: true, import: "default" });
const showerEntries: ShowerEntry[] = Object.entries(SHOWER_FILES).map(([path, json]) => ({ name: showerEntryName(path), label: json.label, order: json.order ?? 0 }));
// Every data/planets/<name>.json is a planet of the one Planets experience (the old ?experience=jupiter-io address too); a new file needs no change here.
// The settings files are small and already in the entry; a planet's system (moon list, positions, pictures) and story are fetched only for the chosen one.
// The public build offers Jupiter alone (owner, 2026-10-22): its globs name only Jupiter's files (the systems map is in the planets package), so Vite leaves the other eight planets' settings, systems and maps out of the bundle.
type PlanetFile = { readonly label: string; readonly order: number; readonly default?: boolean };
const PLANET_FILES = __PUBLIC_BUILD__
  ? import.meta.glob<PlanetFile>("../../astraeus-demo-planets/data/planets/jupiter.json", { eager: true, import: "default" })
  : import.meta.glob<PlanetFile>("../../astraeus-demo-planets/data/planets/*.json", { eager: true, import: "default" });
// The stories' panels files sit in the packages of the demos that own them; they are keyed by the repo-relative path the settings files name (`data/stories/<story>/panels.json`), as before.
const storyPanels = (files: Record<string, () => Promise<unknown>>): Record<string, () => Promise<unknown>> =>
  Object.fromEntries(Object.entries(files).map(([path, load]) => [`../${path.slice(path.indexOf("data/stories/"))}`, load]));
const STORY_PANELS = {
  ...storyPanels(import.meta.glob<unknown>("../../astraeus-demo-apollo11/data/stories/*/panels.json", { import: "default" })),
  ...storyPanels(import.meta.glob<unknown>("../../astraeus-demo-showers/data/stories/*/panels.json", { import: "default" })),
  ...storyPanels(import.meta.glob<unknown>("../../astraeus-demo-planets/data/stories/*/panels.json", { import: "default" })),
};
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
    const [{ parsePlanetSettings }, { buildPlanetDefinition }] = await Promise.all([import("astraeus-demo-planets/experiences/planets/planetSettings"), import("astraeus-demo-planets/experiences/planets/planetDefinition")]);
    const settings = parsePlanetSettings(PLANET_FILES[`../../astraeus-demo-planets/data/planets/${planetChoice.name}.json`]);
    const [systemModule, panels] = await Promise.all([PLANET_SYSTEMS[settings.system]!(), STORY_PANELS[`../${settings.story.panels}`]!()]);
    return { ...buildPlanetDefinition(settings, systemModule[`${settings.system}System`]!, panels), switcher: planetChoice.switcher };
  }
  if (showerChoice !== undefined) {
    const [{ parseShowerSettings }, { buildShowerDefinition, loadShowerPanelsFile, showerComposition }, { loadMeasuredOrbits }] = await Promise.all([
      import("astraeus-demo-showers/experiences/showers/showerSettings"),
      import("astraeus-demo-showers/experiences/showers/showerDefinition"),
      import("astraeus-demo-showers/experiences/showers/measuredOrbits"),
    ]);
    const parsed = parseShowerSettings(SHOWER_FILES[`../../astraeus-demo-showers/data/showers/${showerChoice.name}.json`]);
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
  if (Object.hasOwn(DEFINITIONS, requested)) return DEFINITIONS[requested]!();
  // Apollo 11 is the default: a story built on the public API (`astraeus`), given to the app as its definition.
  const { APOLLO11_LABEL, buildApollo11Scene } = await import("astraeus-demo-apollo11/experiences/apollo11/apollo11Scene");
  return { ...buildApollo11Scene().toDefinition(), label: APOLLO11_LABEL };
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
