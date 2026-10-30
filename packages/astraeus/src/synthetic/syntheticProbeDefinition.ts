// O-046 T-193: a made-up probe crossing the solar system, built only through the public Scene API (ARCH-01: no real mission, name or data).
// It starts inside Earth's orbit on 1 January 2026, meets Earth on day 200 (a planet whose place needs no loaded series, so this module builds at import) and flies on. The path is given in the ecliptic plane (`plane: "ecliptic-j2000"`),
// measured from the Sun (`center: "sun"`), its line is fixed to the Sun, Earth, Venus and Mars are enlarged with their orbit lines on and the scene opens on the Solar system scale.
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { earth, mars, sun, venus } from "../api/bodies";
import { Scene } from "../api/scene";
import { solarSystemScale } from "../core/scalePolicy";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";

export const PROBE_START_UTC_MS = Date.parse("2026-01-01T00:00:00Z");
const DAY_MS = 86_400_000;
/** The moment the made-up probe is at Earth. */
export const PROBE_FLYBY_UTC_MS = PROBE_START_UTC_MS + 200 * DAY_MS;
/** The engine's own ecliptic-to-equator rotation (row-major 3x3); its transpose turns equator vectors back to the ecliptic (STYLE-07: no second obliquity constant). */
const ECLIPTIC_TO_EQJ = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();

const scene = new Scene().addBody(sun).addBody(venus, { enlarge: 60, orbit: true }).addBody(earth, { enlarge: 60, orbit: true }).addBody(mars, { enlarge: 60, orbit: true }).setTime(PROBE_START_UTC_MS);

/** A planet's place from the Sun at `timeUtcMs`, turned from the equator frame the scene answers in to the ecliptic frame the path is given in (km). */
function eclipticPlace(id: string, timeUtcMs: number): number[] {
  const [x, y, z] = scene.stateOf(id, timeUtcMs).positionKm as unknown as number[];
  const m = ECLIPTIC_TO_EQJ;
  return [m[0]! * x! + m[3]! * y! + m[6]! * z!, m[1]! * x! + m[4]! * y! + m[7]! * z!, m[2]! * x! + m[5]! * y! + m[8]! * z!];
}

// A straight leg from a point 0.6 of the way from the Sun to Earth's place at the start, to Earth's place at the flyby, ten samples, then on along the same line for five more.
const from = eclipticPlace("earth", PROBE_START_UTC_MS).map((v) => v * 0.6);
const to = eclipticPlace("earth", PROBE_FLYBY_UTC_MS);
const samples = Array.from({ length: 16 }, (_, i) => ({ time: PROBE_START_UTC_MS + i * 20 * DAY_MS, positionKm: from.map((v, k) => v + ((to[k]! - v) * i) / 10) }));

scene.addTrajectory({
  id: "probe",
  label: "Made-up probe",
  samples,
  center: "sun",
  plane: "ecliptic-j2000",
  lineFixedTo: "sun",
  provenance: { sourceType: "illustrative", sources: ["Made up for the Sun-centred path test; not a real spacecraft"], accuracy: "None claimed. A straight line ending at Earth's place on day 200.", notes: "Exists to prove a recorded path can be drawn fixed to the Sun beside enlarged planets." },
  description: "An invented probe that starts inside Earth's orbit and is at Earth on day 200.",
  knownLimitations: ["Made up; not a real spacecraft.", "A straight line: it ignores the Sun's gravity."],
  anchors: [{ id: "probe-flyby", time: PROBE_FLYBY_UTC_MS }],
});
scene.addEvents([{ id: "probe-flyby", label: "Made-up flyby of Earth", time: PROBE_FLYBY_UTC_MS }], { provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Not a real flyby." } });
scene.setScale(solarSystemScale);
scene.camera.fitOrbit(mars);

export const syntheticProbeDefinition: ExperienceDefinition = scene.toDefinition();
