// O-047 T-203: a made-up probe journey from 1977 out to 170 AU, built only through the public Scene API (ARCH-01: no real mission, name or data).
// It leaves Earth's place on 5 September 1977, passes Jupiter on 5 March 1979 and Saturn on 12 November 1980, then flies straight out to 170 AU by 1 January 2026.
// The giant planets draw their rings by default (catalogue data, O-048 T-205), Europa, Ganymede and Titan draw their orbit lines (T-206) and each pass names its planet as the event's object (T-207).
// In one scene it proves: moons at historical dates (the data packages are handed to `toDefinition`), Saturn's orbit line, paced playback, provenance that changes along the path,
// the opening selection and a camera that zooms out to the whole path (I-114). The planets' places come from the planet series, so the series must be loaded before this builds (the site does).
import { Scene } from "../api/scene";
import { callisto, dione, earth, enceladus, europa, ganymede, iapetus, io, jupiter, mimas, rhea, saturn, sun, tethys, titan } from "../api/bodies";
import type { Provenance } from "../core/provenance";
import { solarSystemScale } from "../core/scalePolicy";

const DAY_MS = 86_400_000;
const YEAR_S = 31_557_600;
const AU_KM = 149_597_870.7;
export const JOURNEY_LAUNCH_UTC_MS = Date.UTC(1977, 8, 5);
export const JOURNEY_JUPITER_UTC_MS = Date.UTC(1979, 2, 5);
export const JOURNEY_SATURN_UTC_MS = Date.UTC(1980, 10, 12);
export const JOURNEY_END_UTC_MS = Date.UTC(2026, 0, 1);
/** The distance the journey ends at, AU (I-114). */
export const JOURNEY_END_AU = 170;
/** How far past each giant planet the made-up probe passes, km (outward from the Sun). */
const PASS_KM = 1_500_000;

type Vec = [number, number, number];
const length = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
const mix = (a: Vec, b: Vec, f: number): Vec => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const scaled = (a: readonly number[], k: number): Vec => [a[0]! * k, a[1]! * k, a[2]! * k];

const made = (stretch: string, accuracy: string, sourceType: Provenance["sourceType"]): Provenance => ({ sourceType, sources: [`Made up for the journey test (${stretch}); not a real spacecraft`], accuracy, notes: "Exists to prove a long recorded path, moons at their dates and paced playback." });

/** The made-up journey as a Scene. Needs the planet series loaded (it reads Earth, Jupiter and Saturn from the Sun). */
export function buildSyntheticJourneyScene(): Scene {
  const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 60, orbit: true }).addBody(jupiter, { orbit: true }).addBody(io, { orbit: true }).addBody(europa, { orbit: true }).addBody(ganymede, { orbit: true }).addBody(callisto)
    .addBody(saturn, { orbit: true }).addBody(mimas).addBody(enceladus).addBody(tethys).addBody(dione).addBody(rhea).addBody(titan, { orbit: true }).addBody(iapetus).setTime(JOURNEY_LAUNCH_UTC_MS);
  const place = (id: string, time: number): Vec => [...scene.stateOf(id, time).positionKm] as Vec;
  const pass = (id: string, time: number): Vec => { const p = place(id, time); return scaled(p, 1 + PASS_KM / length(p)); };
  const launch = place("earth", JOURNEY_LAUNCH_UTC_MS);
  const atJupiter = pass("jupiter", JOURNEY_JUPITER_UTC_MS);
  const atSaturn = pass("saturn", JOURNEY_SATURN_UTC_MS);
  const out = scaled(atSaturn, (JOURNEY_END_AU * AU_KM) / length(atSaturn));
  const leg = (from: Vec, to: Vec, t0: number, t1: number, stepMs: number) => {
    const n = Math.max(1, Math.round((t1 - t0) / stepMs));
    return Array.from({ length: n }, (_, i) => ({ time: Math.round(t0 + ((t1 - t0) * i) / n), positionKm: mix(from, to, i / n) }));
  };
  const samples = [
    ...leg(launch, atJupiter, JOURNEY_LAUNCH_UTC_MS, JOURNEY_JUPITER_UTC_MS, 15 * DAY_MS),
    ...leg(atJupiter, atSaturn, JOURNEY_JUPITER_UTC_MS, JOURNEY_SATURN_UTC_MS, 15 * DAY_MS),
    ...leg(atSaturn, out, JOURNEY_SATURN_UTC_MS, JOURNEY_END_UTC_MS, 365.25 * DAY_MS),
    { time: JOURNEY_END_UTC_MS, positionKm: out },
  ];
  scene.addTrajectory({
    id: "traveller",
    label: "Made-up traveller",
    samples,
    center: "sun",
    lineFixedTo: "sun",
    provenance: made("whole journey", "None claimed.", "illustrative"),
    provenanceSpans: [
      { start: JOURNEY_LAUNCH_UTC_MS, end: JOURNEY_SATURN_UTC_MS + 90 * DAY_MS, provenance: made("planet passes", "None claimed. Straight legs between two planets' places.", "reconstructed") },
      { start: JOURNEY_SATURN_UTC_MS + 90 * DAY_MS, end: JOURNEY_END_UTC_MS, provenance: made("outbound cruise", "None claimed. A straight line out to 170 AU.", "illustrative") },
    ],
    description: "An invented probe that leaves Earth in 1977, passes Jupiter in 1979 and Saturn in 1980, then flies straight out to 170 AU by 2026.",
    knownLimitations: ["Made up; not a real spacecraft.", "Straight legs: it ignores gravity and does not follow any real trajectory."],
    anchors: [{ id: "traveller-jupiter", time: JOURNEY_JUPITER_UTC_MS }, { id: "traveller-saturn", time: JOURNEY_SATURN_UTC_MS }],
  });
  scene.addEvents([
    { id: "traveller-jupiter", label: "Made-up pass of Jupiter", time: JOURNEY_JUPITER_UTC_MS, type: "encounter", object: "jupiter" },
    { id: "traveller-saturn", label: "Made-up pass of Saturn", time: JOURNEY_SATURN_UTC_MS, type: "encounter", object: "saturn" },
  ], { provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Not real passes." } });
  scene.setTimeline({
    start: JOURNEY_LAUNCH_UTC_MS,
    end: JOURNEY_END_UTC_MS,
    rates: [DAY_MS / 1000, 30 * DAY_MS / 1000, YEAR_S],
    rate: 30 * DAY_MS / 1000,
    pacing: [
      { near: { type: "encounter", within: 30 * DAY_MS / 1000 }, rate: DAY_MS / 1000 },
      { from: JOURNEY_SATURN_UTC_MS + 120 * DAY_MS, to: JOURNEY_END_UTC_MS, rate: YEAR_S },
    ],
  });
  scene.setScale(solarSystemScale);
  scene.camera.follow("traveller", { distance: 20_000 });
  return scene;
}
