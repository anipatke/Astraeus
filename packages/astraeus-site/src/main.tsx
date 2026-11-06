import { StrictMode, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { PICTURES, dataSource as pictureData } from "astraeus-data";
import { App } from "astraeus/app/App";
import { needsPlanetSeries } from "astraeus/app/planetNeeds";
import { loadPlanetSeries } from "astraeus/core/planetSeries";
import { choosePlanet, type PlanetEntry } from "./planetChoice";
import { chooseShower, showerEntryName, type ShowerEntry } from "./showerSwitch";
import type { ExperienceDefinition } from "astraeus/app/experienceDefinition";
import { PLANET_SYSTEMS } from "astraeus-demo-planets/experiences/planets/planetSystems";
import { createAddressNavigation } from "astraeus/app/addressNavigation";
import { createBootCover } from "./bootCover";
import "astraeus/app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, the planets with ?experience=planets (&planet=<name> picks one; ?experience=jupiter-io still opens Jupiter), the meteor showers with ?experience=showers (&shower=<name> picks one), a made-up one with ?experience=synthetic (synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit; synthetic-probe, a made-up probe path fixed to the Sun beside enlarged planets, O-046; synthetic-journey, a made-up 1977-to-170-AU probe journey past Jupiter and Saturn with their moons at their dates, O-047; synthetic-views, two made-up probes with three views, O-051).
// Each is its own chunk, fetched only for the experience asked for (I-022), so the others' code and data never download.
// The made-up (synthetic) ones are test experiences: the dev server mounts them, a public build (ASTRAEUS_PUBLIC_BUILD=1) leaves them out of the bundle, so they fall back to the default experience (T-068).
// The host link of the made-up views scene, as `mount` gives one to a host page; no other experience has one (O-051 T-221).
let hostLink: ComponentProps<typeof App>["host"];
// Each is a `Scene` built on the public API; `toDefinition()` is what the app is given until the site mounts it (T-272).
const SYNTHETIC: Readonly<Record<string, () => Promise<ExperienceDefinition>>> = __PUBLIC_BUILD__ ? {} : {
  synthetic: async () => (await import("./synthetic/syntheticScene")).buildSyntheticScene().toDefinition(),
  "synthetic-ring": async () => (await import("./synthetic/syntheticRingScene")).buildSyntheticRingScene().toDefinition(),
  "synthetic-belt": async () => (await import("./synthetic/syntheticBeltScene")).buildSyntheticBeltScene().toDefinition(),
  "synthetic-listed": async () => (await import("./synthetic/syntheticListedScene")).buildSyntheticListedScene().toDefinition(),
  "synthetic-eccentric": async () => (await import("./synthetic/syntheticEccentricScene")).buildSyntheticEccentricScene().toDefinition(),
  // O-051 T-221: two made-up probes with three views; the dev page hands its host link to the browser check as `window.astraeusHost` (see `createViewsHost`).
  "synthetic-views": async () => {
    // The host link is made by the engine fixture's helper until the site mounts through `mount` and is given its host there (T-272).
    const [{ buildSyntheticViewsScene }, { createViewsHost }] = await Promise.all([import("./synthetic/syntheticViewsScene"), import("astraeus/synthetic/syntheticViewsDefinition")]);
    hostLink = createViewsHost();
    return buildSyntheticViewsScene().toDefinition();
  },
  "synthetic-probe": async () => (await import("./synthetic/syntheticProbeScene")).buildSyntheticProbeScene().toDefinition(),
  // The journey reads Earth, Jupiter and Saturn from the planet series; its moons come from data sources like the Jupiter and Saturn packages', handed to `toDefinition` as a host hands them to `mount`.
  "synthetic-journey": async () => {
    const [{ buildSyntheticJourneyScene }, { journeyData }] = await Promise.all([import("./synthetic/syntheticJourneyScene"), import("./journeyData")]);
    await loadPlanetSeries();
    return buildSyntheticJourneyScene().toDefinition(journeyData);
  },
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
    const [{ parsePlanetSettings }, { buildPlanetScene }] = await Promise.all([import("astraeus-demo-planets/experiences/planets/planetSettings"), import("astraeus-demo-planets/experiences/planets/planetScene")]);
    const settings = parsePlanetSettings(PLANET_FILES[`../../astraeus-demo-planets/data/planets/${planetChoice.name}.json`]);
    const [systemModule, panels] = await Promise.all([PLANET_SYSTEMS[settings.system]!(), STORY_PANELS[`../${settings.story.panels}`]!()]);
    const system = systemModule[`${settings.system}System`]!;
    // A planet is a scene on the public API (`astraeus`): `toDefinition(data)` is what the app is given until the site mounts it (T-272), with the page heading and the planet switch the site adds; the moon maps come with `astraeus-data`, the moon positions with the planet's own system.
    return { ...buildPlanetScene(settings, system, panels).toDefinition([pictureData, ...system.data]), label: settings.experienceLabel, switcher: planetChoice.switcher };
  }
  if (showerChoice !== undefined) {
    const [{ parseShowerSettings }, { buildShowerScene, loadShowerPanelsFile }, { loadMeasuredOrbits }] = await Promise.all([
      import("astraeus-demo-showers/experiences/showers/showerSettings"),
      import("astraeus-demo-showers/experiences/showers/showerScene"),
      import("astraeus-demo-showers/experiences/showers/measuredOrbits"),
    ]);
    const settings = parseShowerSettings(SHOWER_FILES[`../../astraeus-demo-showers/data/showers/${showerChoice.name}.json`]);
    // Only the chosen shower's panels file is fetched, beside its orbits.
    const [load, panelsFile] = await Promise.all([loadMeasuredOrbits(settings.stream.iauCode, settings.id), loadShowerPanelsFile(settings, STORY_PANELS)]);
    // A shower is a story on the public API (`astraeus`): its scene's `toDefinition()` is what the app is given, with the page heading and the shower switch the site adds.
    return { ...buildShowerScene(settings, load, panelsFile).toDefinition(), label: settings.label, switcher: showerChoice.switcher };
  }
  if (Object.hasOwn(DEFINITIONS, requested)) return DEFINITIONS[requested]!();
  // Apollo 11 is the default: a story built on the public API (`astraeus`), given to the app as its definition.
  const { APOLLO11_LABEL, buildApollo11Scene } = await import("astraeus-demo-apollo11/experiences/apollo11/apollo11Scene");
  return { ...buildApollo11Scene().toDefinition(), label: APOLLO11_LABEL };
}
// The planet series (about 1.4 MB) load only for a composition that contains a planet.
async function buildDefinition(): Promise<ExperienceDefinition> {
  hostLink = undefined;
  const definition = await chooseDefinition();
  if (definition.prepare !== undefined) await definition.prepare();
  if (needsPlanetSeries(definition)) await loadPlanetSeries();
  // The moon maps, the 8k Venus map and the Milky Way ship in astraeus-data, not the engine; the site hands them to its one viewer through the definition.
  return { ...definition, pictures: { ...PICTURES, ...definition.pictures } };
}
const cover = createBootCover(document);
const root = createRoot(app);
// Each build is mounted under a new key, so the old app unmounts whole (its canvas and the scene's GPU resources are disposed) before the new one starts.
let mounts = 0;
const navigation = createAddressNavigation({
  push: (address) => window.history.pushState(null, "", address),
  showCover: cover.show,
  rebuild: async (isCurrent) => {
    const definition = await buildDefinition();
    if (isCurrent()) mount(definition);
  },
  fail: (error) => { cover.fail(); throw error; },
});
function mount(definition: ExperienceDefinition): void {
  mounts += 1;
  root.render(<StrictMode><App key={mounts} definition={definition} address developerTools claimCover={cover.claim} onOpenAddress={navigation.open} host={hostLink} /></StrictMode>);
}
window.addEventListener("popstate", navigation.popped);
buildDefinition().then(mount).catch((error: unknown) => { cover.fail(); throw error; });
