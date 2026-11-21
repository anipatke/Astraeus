// O-080 T-335: the scene every catalogue example starts from, built only through the public API on made-up data (ARCH-01, ARCH-03): one invented object on an invented orbit round the Sun, drawn as a dot with no picture and no Sun to draw (an orbit line would need the Sun and its picture),
// so a catalogue example loads no texture. An example adds its own parts to the scene this returns.
import { Scene, type ElementsBodyRecord } from "astraeus";

const DAY_MS = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const JULIAN_DATE_AT_START = START / DAY_MS + 2_440_587.5;

const OBJECT: ElementsBodyRecord = {
  id: "lantern",
  label: "Lantern",
  elements: { semiMajorAxisAu: 1.6, eccentricity: 0.2, inclinationDeg: 8, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 60, meanAnomalyDeg: 10 },
  epoch: { jd: JULIAN_DATE_AT_START, timeScale: "UTC" },
  plane: "ecliptic-j2000",
  source: { name: "Made up for the component catalogue", url: "https://example.org/made-up", solution: "None; invented elements", accessed: "2026-11-21" },
  accuracy: { classification: "indicative", statement: "None claimed. A two-body orbit with elements chosen for the catalogue; not a real object.", valid: { start: "2030-01-01T00:00:00Z", end: "2031-01-01T00:00:00Z" }, limitations: ["Made up; not a real object."] },
  marker: { color: "#ffd59a", sizePx: 8 },
};

/** The made-up scene: one invented object on an invented orbit, a year of timeline, opening on 1 January 2030. */
export function madeUpScene(): Scene {
  return new Scene()
    .addBodyFromElements(OBJECT, { description: "An invented object on an invented orbit, here so the catalogue's example has something to show." })
    .setTimeline({ start: START, end: START + 365 * DAY_MS, rates: [DAY_MS / 1000, 7 * DAY_MS / 1000], rate: DAY_MS / 1000 })
    .setTime(START);
}
