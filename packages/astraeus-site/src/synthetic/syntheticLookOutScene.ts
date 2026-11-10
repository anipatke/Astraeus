// O-064 T-293: a made-up scene that opens looking out from Earth, built only through the public Scene API (ARCH-01: no real mission, name or story).
// The Sun, Earth and Mars on the solar-system scale. The camera opens standing at Earth's centre looking toward the Sun's place on the opening date; the camera menu offers Look out from Earth and from Mars
// (`camera.setLookOutChoices`), and Focus, Follow and Overview return to the orbit camera. Earth is not drawn while the camera stands in it. No sky lines, figures or labels yet (a later step).
// The planets' places come from the planet series, so `loadLookOutPlanets` must have resolved before this builds (the site does).
import { earth, mars, Scene, solarSystemScale, sun } from "astraeus";

export const LOOKOUT_START_UTC_MS = Date.UTC(2030, 0, 1, 12);
const DAY_MS = 86_400_000;
/** Where the Sun lies on 1 January, as seen from Earth: J2000 right ascension and declination in degrees (about 18 h 45 m, minus 23 degrees). */
export const LOOKOUT_OPEN_DIRECTION = { raDeg: 281.6, decDeg: -23 } as const;

/** Loads the planet series the builder below reads (a scene holding the planets, then `load`, as any host does). */
export async function loadLookOutPlanets(): Promise<void> {
  await new Scene().addBody(sun).addBody(earth).addBody(mars).load();
}

/** The made-up look-out scene. Needs the planet series loaded. */
export function buildSyntheticLookOutScene(): Scene {
  const scene = new Scene()
    .addBody(sun)
    .addBody(earth, { enlarge: 60, orbit: true })
    .addBody(mars, { enlarge: 60, orbit: true })
    .setScale(solarSystemScale)
    .setTimeline({ start: LOOKOUT_START_UTC_MS, end: LOOKOUT_START_UTC_MS + 120 * DAY_MS, rates: [DAY_MS, 7 * DAY_MS], rate: DAY_MS })
    .setTime(LOOKOUT_START_UTC_MS);
  scene.camera.lookOut("earth", { direction: LOOKOUT_OPEN_DIRECTION, fovDeg: 60 }).setLookOutChoices(["earth", "mars"]);
  return scene;
}
