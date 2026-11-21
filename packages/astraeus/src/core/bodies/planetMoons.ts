/**
 * The moon systems of Mars, Saturn, Uranus, Neptune and Pluto (O-033 T-116): each a configuration of the generic loader (`moonSystem.ts`) over
 * `data/ephemerides/<planet>-moons/` (T-114), and the mapped moons defined once: Phobos and Deimos (grey balls, no map), Saturn's seven large moons,
 * Triton and Charon. Radii and GM are the Horizons satellite headers saved in each index; each worst figure is the index's own check against Horizons
 * (tests/planetMoonSystems.test.ts asserts they agree). Synchronous rotators with an IAU record take their prime meridian from `data/orbits/`.
 */
import type { StateSourceBinding } from "../body";
import { iauElementsFromRecord } from "../iauRotation";
import { recordPeriodDays } from "../siderealPeriod";
import { MARS } from "./mars";
import { createMoonSystem, HISTORICAL_MOON_FIT_SPAN, moonFitSource } from "./moonSystem";
import { NEPTUNE, PLUTO, SATURN, URANUS } from "./outerPlanets";
import charonOrbit from "../../../data/orbits/charon.json" with { type: "json" };
import dioneOrbit from "../../../data/orbits/dione.json" with { type: "json" };
import enceladusOrbit from "../../../data/orbits/enceladus.json" with { type: "json" };
import iapetusOrbit from "../../../data/orbits/iapetus.json" with { type: "json" };
import mimasOrbit from "../../../data/orbits/mimas.json" with { type: "json" };
import rheaOrbit from "../../../data/orbits/rhea.json" with { type: "json" };
import tethysOrbit from "../../../data/orbits/tethys.json" with { type: "json" };
import titanOrbit from "../../../data/orbits/titan.json" with { type: "json" };
import tritonOrbit from "../../../data/orbits/triton.json" with { type: "json" };

export const MARS_MOON_SYSTEM = createMoonSystem({
  centre: "mars",
  centreLabel: "Mars",
  centreGmKm3S2: MARS.gmKm3S2!,
  ephemerisName: "mar099",
  fitSource: moonFitSource("Mars"),
});
export const SATURN_MOON_SYSTEM = createMoonSystem({
  centre: "saturn",
  centreLabel: "Saturn",
  centreGmKm3S2: SATURN.gmKm3S2!,
  ephemerisName: "sat441l",
  fitSource: moonFitSource("Saturn"),
});
export const URANUS_MOON_SYSTEM = createMoonSystem({
  centre: "uranus",
  centreLabel: "Uranus",
  centreGmKm3S2: URANUS.gmKm3S2!,
  ephemerisName: "ura184_merged",
  fitSource: moonFitSource("Uranus"),
});
export const NEPTUNE_MOON_SYSTEM = createMoonSystem({
  centre: "neptune",
  centreLabel: "Neptune",
  centreGmKm3S2: NEPTUNE.gmKm3S2!,
  ephemerisName: "nep098_merged",
  fitSource: moonFitSource("Neptune"),
});
export const PLUTO_MOON_SYSTEM = createMoonSystem({
  centre: "pluto",
  centreLabel: "Pluto",
  centreGmKm3S2: PLUTO.gmKm3S2!,
  balancePoint: { body: "charon", gmKm3S2: 106.1 },
  ephemerisName: "plu060_merged",
  fitSource: moonFitSource("Pluto"),
});

// Mars: Horizons prints a triaxial size and a mass; the sphere is the satellite mean radius (JPL SSD satellite physical parameters, in data/moons/mars.json) and GM is mass times G.
const marsMoon = (id: string, label: string, radiusKm: number, massKg: number, worstM: number, header: string) =>
  MARS_MOON_SYSTEM.mappedMoon({
    id,
    label,
    radiusKm,
    gmKm3S2: massKg * 6.6743e-20,
    worstM,
    header,
    dimensionsNote: `Mean radius ${radiusKm} km (JPL SSD satellite physical parameters; the header gives the triaxial size ${header.split("Radius (km)  = ")[1]?.split(" Density")[0] ?? ""}); GM is the header's mass times G (6.6743e-20 km^3 kg^-1 s^-2), so it carries the header's few digits. ${label} is drawn as a grey sphere at its mean radius, without a map.`,
  });
const PHOBOS_MOON = marsMoon(
  "phobos",
  "Phobos",
  11.08,
  1.08e16,
  0.0593,
  "Radius (km)  = 13.1 x11.1 x9.3 Density (g cm^-3)  =  1.90 +- 0.08; Mass (10^20 kg ) = 1.08 (10^-4)",
);
const DEIMOS_MOON = marsMoon(
  "deimos",
  "Deimos",
  6.2,
  1.8e15,
  0.5101,
  "Radius (km)  = 7.8 x 6.0 x 5.1 Density (g cm^-3)  =  1.76 +- 0.30; Mass (10^20 kg ) = 1.80 (10^-5)",
);

const saturnMoon = (
  id: string,
  label: string,
  radiusKm: number,
  gmKm3S2: number,
  worstM: number,
  header: string,
  orbit: Parameters<typeof recordPeriodDays>[0] & { rotation: Parameters<typeof iauElementsFromRecord>[0] },
) =>
  SATURN_MOON_SYSTEM.mappedMoon({
    id,
    label,
    radiusKm,
    gmKm3S2,
    worstM,
    header,
    orbitPeriodDays: recordPeriodDays(orbit),
    span: HISTORICAL_MOON_FIT_SPAN,
    rotation: iauElementsFromRecord(orbit.rotation),
  });
const MIMAS_MOON = saturnMoon(
  "mimas",
  "Mimas",
  198.8,
  2.503489,
  0.1777,
  "Mean Radius (km) = 198.8 +- 1.5, GM (km^3/s^2) = 2.503489",
  mimasOrbit,
);
const ENCELADUS_MOON = saturnMoon(
  "enceladus",
  "Enceladus",
  252.3,
  7.210367,
  0.155,
  "Mean Radius (km) = 252.3 +- 0.6, GM (km^3/s^2) = 7.210367",
  enceladusOrbit,
);
const TETHYS_MOON = saturnMoon(
  "tethys",
  "Tethys",
  536.3,
  41.21,
  0.1733,
  "Mean Radius (km) = 536.3 +- 1.5, GM (km^3/s^2) = 41.21 +- 0.007",
  tethysOrbit,
);
const DIONE_MOON = saturnMoon(
  "dione",
  "Dione",
  562.5,
  73.116,
  0.1322,
  "Mean Radius (km) = 562.5 +- 5, GM (km^3/s^2) = 73.116 +- 0.02",
  dioneOrbit,
);
const RHEA_MOON = saturnMoon(
  "rhea",
  "Rhea",
  764.5,
  153.94,
  0.1271,
  "Mean Radius (km) = 764.5 +- 2, GM (km^3/s^2) = 153.94 +- 0.16",
  rheaOrbit,
);
const TITAN_MOON = saturnMoon(
  "titan",
  "Titan",
  2575.5,
  8978.14,
  0.5305,
  "Mean Radius (km) = 2575.5 +- 2.0, GM (km^3/s^2) = 8978.14 +- 0.06",
  titanOrbit,
);
const IAPETUS_MOON = saturnMoon(
  "iapetus",
  "Iapetus",
  734.5,
  120.52,
  0.0715,
  "Radius (km) = 734.5 +- 4.0, GM (km^3/s^2) = 120.52 +- 0.03",
  iapetusOrbit,
);
const TRITON_MOON = NEPTUNE_MOON_SYSTEM.mappedMoon({
  id: "triton",
  label: "Triton",
  radiusKm: 1352.6,
  gmKm3S2: 1428.495,
  worstM: 0.5118,
  orbitPeriodDays: recordPeriodDays(tritonOrbit),
  span: HISTORICAL_MOON_FIT_SPAN,
  rotation: iauElementsFromRecord(tritonOrbit.rotation),
  header: "Mean radius (km) = 1352.6 +- 2.4, GM (km^3/s^2) = 1428.495 +- 0.62",
});
const CHARON_MOON = PLUTO_MOON_SYSTEM.mappedMoon({
  id: "charon",
  label: "Charon",
  radiusKm: 606,
  gmKm3S2: 106.1,
  worstM: 0.6237,
  orbitPeriodDays: recordPeriodDays(charonOrbit),
  rotation: iauElementsFromRecord(charonOrbit.rotation),
  header: "GM (km^3/s^2) = 106.10 +- 0.3, Radius (km, IAU2015) = 606 +- 0.5",
});

/** Each mapped moon's definition and binding come from one record of facts, so its orientation label and model cannot differ. */
export const PHOBOS = PHOBOS_MOON.definition;
export const DEIMOS = DEIMOS_MOON.definition;
export const MIMAS = MIMAS_MOON.definition;
export const ENCELADUS = ENCELADUS_MOON.definition;
export const TETHYS = TETHYS_MOON.definition;
export const DIONE = DIONE_MOON.definition;
export const RHEA = RHEA_MOON.definition;
export const TITAN = TITAN_MOON.definition;
export const IAPETUS = IAPETUS_MOON.definition;
export const TRITON = TRITON_MOON.definition;
export const CHARON = CHARON_MOON.definition;

/** The mapped moons by system, in the order the moon lists give them. */
const PLANET_MOONS = Object.freeze([
  PHOBOS_MOON,
  DEIMOS_MOON,
  MIMAS_MOON,
  ENCELADUS_MOON,
  TETHYS_MOON,
  DIONE_MOON,
  RHEA_MOON,
  TITAN_MOON,
  IAPETUS_MOON,
  TRITON_MOON,
  CHARON_MOON,
]);
export const PLANET_MOON_DEFINITIONS = Object.freeze(PLANET_MOONS.map((moon) => moon.definition));
export const PLANET_MOON_BINDINGS: readonly StateSourceBinding[] = Object.freeze(
  PLANET_MOONS.map((moon) => moon.binding),
);
