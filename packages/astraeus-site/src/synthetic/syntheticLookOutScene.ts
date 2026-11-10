// O-064 T-293: a made-up scene that opens looking out from Earth, built only through the public Scene API (ARCH-01: no real mission, name or story).
// The Sun, Earth and Mars on the solar-system scale. The camera opens standing at Earth's centre looking toward the Sun's place on the opening date; the camera menu offers Look out from Earth and from Mars
// (`camera.setLookOutChoices`), and Focus, Follow and Overview return to the orbit camera. Earth is not drawn while the camera stands in it. O-066 T-302: Lantern and Kettle have invented cards, and a three-step story (steps, no moments) turns the view, selects and traces them. O-065 T-298: two invented sky figures (Lantern and Kettle), one invented boundary outline and the four sky switches (the site's trace buttons are in skyTraceControl.ts).
// The planets' places come from the planet series, so `loadLookOutPlanets` must have resolved before this builds (the site does).
import { earth, mars, Scene, solarSystemScale, sun, type SkyFigureInput, type StoryPanelInput } from "astraeus";

export const LOOKOUT_START_UTC_MS = Date.UTC(2030, 0, 1, 12);
const DAY_MS = 86_400_000;
/** Playback speeds are simulated seconds per real second: an hour a second keeps the Sun in the opening view for a while; a day a second and a week a second are offered. */
const HOUR_S = 3_600;
const DAY_S = 86_400;
/** Where the Sun lies on 1 January, as seen from Earth: J2000 right ascension and declination in degrees (about 18 h 45 m, minus 23 degrees). */
export const LOOKOUT_OPEN_DIRECTION = { raDeg: 281.6, decDeg: -23 } as const;

/** Loads the planet series the builder below reads (a scene holding the planets, then `load`, as any host does). */
export async function loadLookOutPlanets(): Promise<void> {
  await new Scene().addBody(sun).addBody(earth).addBody(mars).load();
}

const FIGURE_PROVENANCE = { sourceType: "illustrative", sources: ["Made up for the sky-story fixture; not a real constellation"], accuracy: "None claimed. The star numbers are real Hipparcos numbers; the figure drawn between them is invented.", notes: "Exists to prove that a sky figure's card, a selection and a trace can be driven by a story." } as const;

/** Two invented figures built from real Hipparcos numbers (and one point of the sky by position), and an invented outline around the Sun's place on 1 January. No real constellation name (ARCH-01). */
export const LOOKOUT_SKY_FIGURES: readonly SkyFigureInput[] = [
  // Both figures are hidden until traced (the outline is always shown). Lantern: a bent line of four stars about the Sun's place; its second segment crosses the Sun's glow.
  { id: "lantern", label: "Lantern", shown: "whenTraced", labelAt: { raDeg: 288.5, decDeg: -18 }, description: "A made-up figure of four stars bent round the place the Sun holds in early January.", facts: [{ label: "Stars", value: "5 joined by 4 lines (made up)" }, { label: "Invented", value: "For this fixture only" }], sources: ["Made up for the sky-story fixture; not a real figure"], provenance: FIGURE_PROVENANCE, segments: [
    [{ star: 92855 }, { star: 93085 }], [{ star: 93085 }, { star: 93683 }], [{ star: 93683 }, { star: 94141 }], [{ star: 92041 }, { star: 93085 }],
  ] },
  // Kettle: a hook of stars west of the Sun's place, ending on a point of the sky given by position.
  { id: "kettle", label: "Kettle", shown: "whenTraced", description: "A made-up hook of stars west of the Sun's January place, ending on a bare point of the sky.", facts: [{ label: "Stars", value: "4 joined by 4 lines (made up)" }, { label: "Invented", value: "For this fixture only" }], sources: ["Made up for the sky-story fixture; not a real figure"], provenance: FIGURE_PROVENANCE, segments: [
    [{ star: 90496 }, { star: 89931 }], [{ star: 89931 }, { star: 88635 }], [{ star: 88635 }, { star: 90185 }], [{ star: 90185 }, { raDeg: 268, decDeg: -40 }],
  ] },
  { id: "lantern-field", label: "Lantern field", kind: "boundary", points: [{ raDeg: 276, decDeg: -17 }, { raDeg: 291, decDeg: -17 }, { raDeg: 291, decDeg: -31 }, { raDeg: 276, decDeg: -31 }], labelAt: { raDeg: 283.5, decDeg: -30 } },
];

const STORY_PROVENANCE = { sourceType: "illustrative", sources: ["Made up for the sky-story fixture; not a real story"], accuracy: "None claimed.", notes: "Three steps that turn the view, select and trace the two invented figures." } as const;
/** Three steps, no moments: the first holds the opening view, the second turns to Lantern, selects and traces it, the third turns to Kettle. Each camera names a body to stand in, so a step works from an orbit view too. */
export const LOOKOUT_STORY: readonly StoryPanelInput[] = [
  { id: "step-start", title: "Looking out", body: ["You stand at Earth's centre looking toward where the Sun sits in early January.", "Press Next to be shown the made-up figure Lantern."], provenance: STORY_PROVENANCE, camera: { lookOut: "earth", direction: LOOKOUT_OPEN_DIRECTION, fovDeg: 60 } },
  { id: "step-lantern", title: "Lantern", body: ["The view turns to Lantern, a bent line of four stars. It is selected, and its lines are traced.", "Open its card from the menu or tap its name."], provenance: STORY_PROVENANCE, object: "lantern", camera: { lookOut: "earth", direction: "lantern", fovDeg: 40 }, select: true, trace: { durationSeconds: 1, after: "stay" } },
  { id: "step-kettle", title: "Kettle", body: ["The view turns west to Kettle, a hook of stars. Leaving Lantern cleared its trace; Kettle is traced now."], provenance: STORY_PROVENANCE, object: "kettle", camera: { lookOut: "earth", direction: "kettle", fovDeg: 40 }, select: true, trace: { durationSeconds: 1, after: "stay" } },
];

/** The made-up look-out scene. Needs the planet series loaded. */
export function buildSyntheticLookOutScene(): Scene {
  const scene = new Scene()
    .addBody(sun)
    .addBody(earth, { enlarge: 60, orbit: true })
    .addBody(mars, { enlarge: 60, orbit: true })
    .addSkyFigures(LOOKOUT_SKY_FIGURES)
    .addStoryPanels(LOOKOUT_STORY)
    .setSwitches({ skyFigures: { place: "top-bar" }, skyBoundaries: { place: "panel", on: true }, ecliptic: { place: "panel" }, celestialEquator: { place: "panel" } })
    .setScale(solarSystemScale)
    .setTimeline({ start: LOOKOUT_START_UTC_MS, end: LOOKOUT_START_UTC_MS + 120 * DAY_MS, rates: [HOUR_S, DAY_S, 7 * DAY_S], rate: HOUR_S })
    .setTime(LOOKOUT_START_UTC_MS);
  scene.camera.lookOut("earth", { direction: LOOKOUT_OPEN_DIRECTION, fovDeg: 60 }).setLookOutChoices(["earth", "mars"]);
  return scene;
}
