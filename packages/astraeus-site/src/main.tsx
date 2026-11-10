import { SceneError, mount, type DataSource, type MountedScene, type Scene } from "astraeus";
import { dataSource as pictureData } from "astraeus-data";
import { PLANET_SYSTEMS } from "astraeus-demo-planets/experiences/planets/planetSystems";
import { createAddressNavigation, switchAddress } from "./addressNavigation";
import { createBootCover, hideBootLoader } from "./bootCover";
import { pageTitle } from "./pageTitle";
import { addSkyTraceControl } from "./skyTraceControl";
import { chooseEntry } from "./entryChoice";
import { pickerOf } from "./listChoice";
import type { PlanetEntry } from "./planetChoice";
import { showerEntryName, type ShowerEntry } from "./showerSwitch";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
const host: HTMLElement = app;
// The entry chooses the experience: Apollo by default, the planets with ?experience=planets (&planet=<name> picks one; ?experience=jupiter-io still opens Jupiter), the meteor showers with ?experience=showers (&shower=<name> picks one), a made-up one with ?experience=synthetic (synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach; synthetic-listed, made-up orbits listed one by one; synthetic-eccentric, the belt with a made-up 51 AU orbit; synthetic-probe, a made-up probe path fixed to the Sun beside enlarged planets, O-046; synthetic-journey, a made-up 1977-to-170-AU probe journey past Jupiter and Saturn with their moons at their dates, O-047; synthetic-views, two made-up probes with three views, O-051; synthetic-lookout, a made-up scene that opens looking out from Earth, O-064).
// Each is its own chunk, fetched only for the experience asked for (I-022), so the others' code and data never download.
// The made-up (synthetic) ones are test experiences: the dev server mounts them, a public build (ASTRAEUS_PUBLIC_BUILD=1) leaves them out of the bundle, so they fall back to the default experience (T-068).
// Each is a `Scene` built on the public API; `mount` draws it, with the data it needs.
// A scene the site mounts: what `mount` draws, the data it needs, the page heading's name, and the picker's address parameters (a scene with a picker) and whether the dev page exposes its handle.
interface Built {
  readonly scene: Scene;
  readonly data: readonly DataSource[];
  readonly label?: string;
  /** The address parameters the picker keeps across a choice (the clock's `t`); absent: the scene has no picker. */
  readonly keep?: readonly string[];
  /** O-051 T-221: the dev page hands the handle of the made-up views scene to the browser check as `window.astraeusHost`. */
  readonly exposeHost?: boolean;
  /** O-065 T-298: a control the site draws beside the viewer over the handle (the sky-figure trace buttons); returns what removes it. */
  readonly hostControl?: (host: HTMLElement, handle: MountedScene) => () => void;
}
const own = (scene: Scene, extra: readonly DataSource[] = []): Built => ({ scene, data: [pictureData, ...extra] });
const SYNTHETIC: Readonly<Record<string, () => Promise<Built>>> = __PUBLIC_BUILD__ ? {} : {
  synthetic: async () => own((await import("./synthetic/syntheticScene")).buildSyntheticScene()),
  "synthetic-ring": async () => own((await import("./synthetic/syntheticRingScene")).buildSyntheticRingScene()),
  "synthetic-belt": async () => own((await import("./synthetic/syntheticBeltScene")).buildSyntheticBeltScene()),
  "synthetic-listed": async () => own((await import("./synthetic/syntheticListedScene")).buildSyntheticListedScene()),
  "synthetic-eccentric": async () => own((await import("./synthetic/syntheticEccentricScene")).buildSyntheticEccentricScene()),
  "synthetic-views": async () => ({ ...own((await import("./synthetic/syntheticViewsScene")).buildSyntheticViewsScene()), exposeHost: true }),
  // A made-up scene that opens looking out from Earth (O-064): needs the planet series loaded before it builds, as the journey does.
  "synthetic-lookout": async () => {
    const { buildSyntheticLookOutScene, loadLookOutPlanets } = await import("./synthetic/syntheticLookOutScene");
    await loadLookOutPlanets();
    return { ...own(buildSyntheticLookOutScene()), exposeHost: true, hostControl: addSkyTraceControl };
  },
  "synthetic-probe": async () => own((await import("./synthetic/syntheticProbeScene")).buildSyntheticProbeScene()),
  // The journey reads Earth, Jupiter and Saturn from the planet series (`mount` loads it); its moons come from data sources like the Jupiter and Saturn packages', handed to `mount` as a host hands them.
  "synthetic-journey": async () => {
    const [{ buildSyntheticJourneyScene, loadJourneyPlanets }, { journeyData }] = await Promise.all([import("./synthetic/syntheticJourneyScene"), import("./journeyData")]);
    await loadJourneyPlanets();
    return own(buildSyntheticJourneyScene(), journeyData);
  },
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
const LISTS = { planets: planetEntries, showers: showerEntries, synthetic: Object.keys(SYNTHETIC) };
// A shower's measured orbits are the GMN file (a local fetch in development, the shipped copy in a build), so a shower is built once that has been looked for.
async function build(): Promise<Built> {
  const entry = chooseEntry(window.location.search, LISTS);
  if (entry.kind === "planets") {
    const { choice } = entry;
    const [{ parsePlanetSettings }, { buildPlanetScene }] = await Promise.all([import("astraeus-demo-planets/experiences/planets/planetSettings"), import("astraeus-demo-planets/experiences/planets/planetScene")]);
    const settings = parsePlanetSettings(PLANET_FILES[`../../astraeus-demo-planets/data/planets/${choice.name}.json`]);
    const [systemModule, panels] = await Promise.all([PLANET_SYSTEMS[settings.system]!(), STORY_PANELS[`../${settings.story.panels}`]!()]);
    const system = systemModule[`${settings.system}System`]!;
    // A planet is a scene on the public API (`astraeus`); the moon maps come with `astraeus-data`, the moon positions with the planet's own system, and the planet switch is the picker the site adds.
    const scene = buildPlanetScene(settings, system, panels).setPicker(pickerOf(choice.switcher));
    return { ...own(scene, system.data), label: settings.experienceLabel, keep: choice.switcher.keep ?? [] };
  }
  if (entry.kind === "showers") {
    const { choice } = entry;
    const [{ parseShowerSettings }, { buildShowerScene, loadShowerPanelsFile }, { loadMeasuredOrbits }] = await Promise.all([
      import("astraeus-demo-showers/experiences/showers/showerSettings"),
      import("astraeus-demo-showers/experiences/showers/showerScene"),
      import("astraeus-demo-showers/experiences/showers/measuredOrbits"),
    ]);
    const settings = parseShowerSettings(SHOWER_FILES[`../../astraeus-demo-showers/data/showers/${choice.name}.json`]);
    // Only the chosen shower's panels file is fetched, beside its orbits.
    const [load, panelsFile] = await Promise.all([loadMeasuredOrbits(settings.stream.iauCode, settings.id), loadShowerPanelsFile(settings, STORY_PANELS)]);
    // A shower is a story on the public API (`astraeus`), with the shower switch as the picker the site adds.
    const scene = buildShowerScene(settings, load, panelsFile).setPicker(pickerOf(choice.switcher));
    return { ...own(scene), label: settings.label, keep: choice.switcher.keep ?? [] };
  }
  if (entry.kind === "synthetic") return SYNTHETIC[entry.name]!();
  // Apollo 11 is the default: a story built on the public API (`astraeus`).
  const { APOLLO11_LABEL, buildApollo11Scene } = await import("astraeus-demo-apollo11/experiences/apollo11/apollo11Scene");
  return { ...own(buildApollo11Scene()), label: APOLLO11_LABEL };
}

/** The fade time when the viewer's look is not yet readable: the engine's default. */
const DEFAULT_FADE_SECONDS = 0.6;

const cover = createBootCover(document);
// The viewer on show: a new scene unmounts it whole (its canvas and the scene's GPU resources are disposed) before the new one starts.
let current: MountedScene | undefined;
let removeHostControl: (() => void) | undefined;
const navigation = createAddressNavigation({
  push: (address) => window.history.pushState(null, "", address),
  showCover: cover.show,
  rebuild: async (isCurrent) => {
    const built = await build();
    if (isCurrent()) show(built);
  },
  fail: (error) => { cover.fail(); throw error; },
});
function show(built: Built): void {
  removeHostControl?.();
  removeHostControl = undefined;
  current?.unmount();
  const reach = cover.claim();
  const handle = mount(host, built.scene, { data: built.data, address: true, developerTools: true });
  current = handle;
  document.title = pageTitle(built.label);
  removeHostControl = built.hostControl?.(host, handle);
  if (built.exposeHost === true) (window as unknown as { astraeusHost?: MountedScene }).astraeusHost = handle;
  // The first drawn frame fades this mounting's cover, unless a later showing took it back (I-074).
  handle.onFirstDraw(() => hideBootLoader(reach, handle.look?.loadFadeSeconds ?? DEFAULT_FADE_SECONDS));
  // A press on the picker only reports; the site opens the address, keeping the clock's time where the picker says so.
  if (built.keep !== undefined) {
    const keep = built.keep;
    handle.onPick(({ picker, value }) => navigation.open(switchAddress(window.location.href, picker, value, keep, handle.timeUtcMs)));
  }
  // A failed load shows the failure cover and is reported; a viewer taken down early (a newer scene, `not-mounted`) is no failure.
  handle.ready.catch((error: unknown) => { if (current === handle && !(error instanceof SceneError && error.code === "not-mounted")) { cover.fail(); throw error; } });
}
window.addEventListener("popstate", navigation.popped);
build().then(show).catch((error: unknown) => { cover.fail(); throw error; });
