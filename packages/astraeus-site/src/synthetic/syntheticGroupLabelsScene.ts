// O-101 T-463: a made-up scene for host group labels, built only through the public Scene API (ARCH-01: invented names and orbits, illustrative provenance).
// A made-up planet at about 5 AU, two invented swarms about 60 degrees ahead of and behind it (four brightness groups each, none showing its own name), one host label on each swarm,
// a ring group that shows its own name on its dots and one text-only label on a fixed point.
import { Scene, sun, type GroupInput, type GroupOrbitInput, type LabelInput, type Provenance } from "astraeus";
import { AU_KM, julianDateOf, madeUpOrbitRecord, meanAnomalyDegOf, seededRandom } from "./madeUpOrbits";

export const GROUP_LABELS_START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const DAY_MS = 86_400_000;
const PLANET_AU = 5;
const PLANET_ECCENTRICITY = 0.05;
const ORBITS_PER_GROUP = 60;
const SHADES = ["#ffe3a3", "#ffc766", "#f5a133", "#c77a14"] as const;

/** The ids the browser step reads. */
export const AHEAD_LABEL_ID = "swarm-ahead";
export const BEHIND_LABEL_ID = "swarm-behind";
export const RING_GROUP_ID = "made-up-ring";
export const FIXED_LABEL_ID = "fixed-point";
export const AHEAD_GROUP_IDS = SHADES.map((_, n) => `ahead-${n + 1}`);
export const BEHIND_GROUP_IDS = SHADES.map((_, n) => `behind-${n + 1}`);

const provenance = (what: string): Provenance => ({
  sourceType: "illustrative",
  sources: ["Made up for the group label test; not a real population"],
  accuracy: `None claimed. ${what}`,
  notes: "Exists to prove a host label sits on, and selects, a swarm drawn as several groups.",
});

/** One brightness group of a swarm: orbits of the planet's own shape, each placed by its measured mean anomaly about `centreDeg` ahead of (+) or behind (-) the planet, spread a few degrees. */
function swarmGroup(id: string, label: string, color: string, seed: number, centreDeg: number): GroupInput {
  const random = seededRandom(seed);
  const orbits: GroupOrbitInput[] = Array.from({ length: ORBITS_PER_GROUP }, (_, k) => {
    // The planet is nearest the Sun at the start (true anomaly 0), so a true anomaly of `centreDeg` is its mean anomaly below; the spread is applied to the mean anomaly.
    const meanAnomalyDeg = meanAnomalyDegOf(centreDeg, PLANET_ECCENTRICITY) + (2 * random() - 1) * 4;
    return {
      id: `${id}-${String(k + 1).padStart(3, "0")}`,
      semiMajorAxisKm: (PLANET_AU + (2 * random() - 1) * 0.04) * AU_KM,
      eccentricity: PLANET_ECCENTRICITY,
      inclinationDeg: random() * 1.5,
      raanDeg: 0,
      argumentOfPeriapsisDeg: 0,
      time: GROUP_LABELS_START_UTC_MS,
      meanAnomalyDeg,
    };
  });
  return {
    id,
    label,
    center: "sun",
    plane: "ecliptic-j2000",
    orbits,
    color,
    dotSizePx: 3,
    showLabel: false,
    provenance: provenance("Invented members on Sun-centred two-body orbits sharing a made-up planet's orbit."),
    description: `${label}: ${ORBITS_PER_GROUP} invented members of a made-up swarm.`,
  };
}

/** The made-up scene: the Sun, a planet at about 5 AU, two swarms of four groups each, a ring that shows its name, and a text-only label. */
export function buildSyntheticGroupLabelsScene(): Scene {
  const scene = new Scene()
    .addBody(sun, { labelPriority: 95, description: "The Sun, the centre the swarms and the ring circle." })
    .addBodyFromElements(
      madeUpOrbitRecord({
        id: "made-up-planet",
        label: "Made-up planet",
        epochUtcMs: GROUP_LABELS_START_UTC_MS,
        color: "#8fd0ff",
        sizePx: 7,
        what: "group label",
        elements: {
          semiMajorAxisAu: PLANET_AU,
          eccentricity: PLANET_ECCENTRICITY,
          inclinationDeg: 0,
          ascendingNodeDeg: 0,
          argumentOfPerihelionDeg: 0,
          perihelionJdTdb: julianDateOf(GROUP_LABELS_START_UTC_MS),
        },
      }),
      {
        orbit: true,
        labelPriority: 70,
        description: "An invented planet about 5 AU from the Sun; the swarms share its orbit.",
      },
    );
  for (const [ids, name, centreDeg, seed] of [
    [AHEAD_GROUP_IDS, "ahead", 60, 11],
    [BEHIND_GROUP_IDS, "behind", -60, 23],
  ] as const) {
    ids.forEach((id, n) => {
      scene.addGroup(swarmGroup(id, `Swarm ${name}, shade ${n + 1}`, SHADES[n]!, seed + n, centreDeg));
    });
  }
  const ringRandom = seededRandom(5);
  scene.addGroup({
    id: RING_GROUP_ID,
    label: "Made-up ring",
    center: "sun",
    plane: "ecliptic-j2000",
    orbits: Array.from({ length: 80 }, (_, k) => ({
      id: `ring-${String(k + 1).padStart(3, "0")}`,
      semiMajorAxisKm: 3 * AU_KM,
      eccentricity: 0,
      inclinationDeg: 0,
      raanDeg: ringRandom() * 360,
      argumentOfPeriapsisDeg: 0,
    })),
    color: "#b9a5ff",
    dotSizePx: 3,
    provenance: provenance("Invented circular orbits at about 3 AU; where each dot sits is a drawing choice."),
    description: "A made-up ring of 80 invented members at about 3 AU; it shows its own name on its dots.",
  });
  const swarmLabel = (id: string, label: string, groups: readonly string[]): LabelInput => ({
    id,
    label,
    anchor: { groups },
    selects: { groups },
    description: `${label}: four brightness groups of one invented swarm, selected together.`,
    provenance: provenance("Invented swarm sharing a made-up planet's orbit."),
  });
  scene
    .addLabels([
      swarmLabel(AHEAD_LABEL_ID, "Swarm ahead (made up)", AHEAD_GROUP_IDS),
      swarmLabel(BEHIND_LABEL_ID, "Swarm behind (made up)", BEHIND_GROUP_IDS),
      {
        id: FIXED_LABEL_ID,
        label: "A fixed point (made up)",
        anchor: { positionKm: [-2 * AU_KM, 0, 0], plane: "ecliptic-j2000", center: "sun" },
      },
    ])
    .addEvents([{ id: "labels-start", label: "Swarms placed", time: GROUP_LABELS_START_UTC_MS }])
    .setTimeline({
      start: GROUP_LABELS_START_UTC_MS,
      end: GROUP_LABELS_START_UTC_MS + 4_000 * DAY_MS,
      rates: [86_400, 864_000, 2_592_000],
      rate: 864_000,
    })
    .setTime(GROUP_LABELS_START_UTC_MS);
  // Opens above the ecliptic with the planet's axis across the screen, so both swarms (about 4 AU either side of it) and the ring fit a phone's narrow view.
  scene.camera.setReach(600_000).setStartView({ focus: "sun", azimuthDeg: 180, elevationDeg: 85, distance: 430_000 });
  return scene;
}
