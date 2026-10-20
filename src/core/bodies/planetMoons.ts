/**
 * The moon systems of Mars, Saturn, Uranus, Neptune and Pluto (O-033 T-116): each a configuration of the generic loader (`moonSystem.ts`) over
 * `data/ephemerides/<planet>-moons/` (T-114), and the mapped moons defined once: Phobos and Deimos (grey balls, no map), Saturn's seven large moons,
 * Triton and Charon. Radii and GM are the Horizons satellite headers saved in each index; each worst figure is the index's own check against Horizons
 * (tests/planetMoonSystems.test.ts asserts they agree). Synchronous rotators with an IAU record take their prime meridian from `data/orbits/`.
 */
import type { StateSourceBinding } from "../body";
import { iauElementsFromRecord } from "../iauRotation";
import { createPlanetSunTrajectory } from "./planetTrajectory";
import { MARS } from "./mars";
import { createMoonSystem, moonFitSource } from "./moonSystem";
import { NEPTUNE, PLUTO, PLUTO_ROTATION, SATURN, URANUS } from "./outerPlanets";
import { rotation as charonRotation } from "../../../data/orbits/charon.json";
import { rotation as dioneRotation } from "../../../data/orbits/dione.json";
import { rotation as enceladusRotation } from "../../../data/orbits/enceladus.json";
import { rotation as iapetusRotation } from "../../../data/orbits/iapetus.json";
import { rotation as mimasRotation } from "../../../data/orbits/mimas.json";
import { rotation as rheaRotation } from "../../../data/orbits/rhea.json";
import { rotation as tethysRotation } from "../../../data/orbits/tethys.json";
import { rotation as titanRotation } from "../../../data/orbits/titan.json";
import { rotation as tritonRotation } from "../../../data/orbits/triton.json";

export const MARS_MOON_SYSTEM = createMoonSystem({
  centre: "mars", centreLabel: "Mars", centreGmKm3S2: MARS.gmKm3S2!, ephemerisName: "mar099", fitSource: moonFitSource("Mars"),
  loadIndex: async () => (await import("../../../data/ephemerides/mars-moons/index.json")).default as unknown,
});
export const SATURN_MOON_SYSTEM = createMoonSystem({
  centre: "saturn", centreLabel: "Saturn", centreGmKm3S2: SATURN.gmKm3S2!, ephemerisName: "sat441l", fitSource: moonFitSource("Saturn"),
  loadIndex: async () => (await import("../../../data/ephemerides/saturn-moons/index.json")).default as unknown,
});
export const URANUS_MOON_SYSTEM = createMoonSystem({
  centre: "uranus", centreLabel: "Uranus", centreGmKm3S2: URANUS.gmKm3S2!, ephemerisName: "ura184_merged", fitSource: moonFitSource("Uranus"),
  loadIndex: async () => (await import("../../../data/ephemerides/uranus-moons/index.json")).default as unknown,
});
export const NEPTUNE_MOON_SYSTEM = createMoonSystem({
  centre: "neptune", centreLabel: "Neptune", centreGmKm3S2: NEPTUNE.gmKm3S2!, ephemerisName: "nep098_merged", fitSource: moonFitSource("Neptune"),
  loadIndex: async () => (await import("../../../data/ephemerides/neptune-moons/index.json")).default as unknown,
});
export const PLUTO_MOON_SYSTEM = createMoonSystem({
  centre: "pluto", centreLabel: "Pluto", centreGmKm3S2: PLUTO.gmKm3S2!, ephemerisName: "plu060_merged", fitSource: moonFitSource("Pluto"),
  loadIndex: async () => (await import("../../../data/ephemerides/pluto-moons/index.json")).default as unknown,
});


// Mars: Horizons prints a triaxial size and a mass; the sphere is the satellite mean radius (JPL SSD satellite physical parameters, in data/moons/mars.json) and GM is mass times G.
const marsMoon = (id: string, label: string, radiusKm: number, massKg: number, worstM: number, header: string) => MARS_MOON_SYSTEM.mappedMoon({
  id, label, radiusKm, gmKm3S2: massKg * 6.6743e-20, worstM, header,
  dimensionsNote: `Mean radius ${radiusKm} km (JPL SSD satellite physical parameters; the header gives the triaxial size ${header.split("Radius (km)  = ")[1]?.split(" Density")[0] ?? ""}); GM is the header's mass times G (6.6743e-20 km^3 kg^-1 s^-2), so it carries the header's few digits. ${label} is drawn as a grey sphere at its mean radius, without a map.`,
});
export const PHOBOS = marsMoon("phobos", "Phobos", 11.08, 1.08e16, 0.0593, "Radius (km)  = 13.1 x11.1 x9.3 Density (g cm^-3)  =  1.90 +- 0.08; Mass (10^20 kg ) = 1.08 (10^-4)");
export const DEIMOS = marsMoon("deimos", "Deimos", 6.2, 1.8e15, 0.5101, "Radius (km)  = 7.8 x 6.0 x 5.1 Density (g cm^-3)  =  1.76 +- 0.30; Mass (10^20 kg ) = 1.80 (10^-5)");

const saturnMoon = (id: string, label: string, radiusKm: number, gmKm3S2: number, worstM: number, header: string) => SATURN_MOON_SYSTEM.mappedMoon({ id, label, radiusKm, gmKm3S2, worstM, header });
export const MIMAS = saturnMoon("mimas", "Mimas", 198.8, 2.503489, 0.091, "Mean Radius (km) = 198.8 +- 1.5, GM (km^3/s^2) = 2.503489");
export const ENCELADUS = saturnMoon("enceladus", "Enceladus", 252.3, 7.210367, 0.0874, "Mean Radius (km) = 252.3 +- 0.6, GM (km^3/s^2) = 7.210367");
export const TETHYS = saturnMoon("tethys", "Tethys", 536.3, 41.21, 0.0865, "Mean Radius (km) = 536.3 +- 1.5, GM (km^3/s^2) = 41.21 +- 0.007");
export const DIONE = saturnMoon("dione", "Dione", 562.5, 73.116, 0.0886, "Mean Radius (km) = 562.5 +- 5, GM (km^3/s^2) = 73.116 +- 0.02");
export const RHEA = saturnMoon("rhea", "Rhea", 764.5, 153.94, 0.0725, "Mean Radius (km) = 764.5 +- 2, GM (km^3/s^2) = 153.94 +- 0.16");
export const TITAN = saturnMoon("titan", "Titan", 2575.5, 8978.14, 0.55, "Mean Radius (km) = 2575.5 +- 2.0, GM (km^3/s^2) = 8978.14 +- 0.06");
export const IAPETUS = saturnMoon("iapetus", "Iapetus", 734.5, 120.52, 0.0579, "Radius (km) = 734.5 +- 4.0, GM (km^3/s^2) = 120.52 +- 0.03");
export const TRITON = NEPTUNE_MOON_SYSTEM.mappedMoon({ id: "triton", label: "Triton", radiusKm: 1352.6, gmKm3S2: 1428.495, worstM: 0.5121, header: "Mean radius (km) = 1352.6 +- 2.4, GM (km^3/s^2) = 1428.495 +- 0.62" });
export const CHARON = PLUTO_MOON_SYSTEM.mappedMoon({ id: "charon", label: "Charon", radiusKm: 606, gmKm3S2: 106.10, worstM: 0.6237, header: "GM (km^3/s^2) = 106.10 +- 0.3, Radius (km, IAU2015) = 606 +- 0.5" });

/** The mapped moons by system, in the order the moon lists give them. */
export const PLANET_MOON_DEFINITIONS = Object.freeze([PHOBOS, DEIMOS, MIMAS, ENCELADUS, TETHYS, DIONE, RHEA, TITAN, IAPETUS, TRITON, CHARON]);

export const PLANET_MOON_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  MARS_MOON_SYSTEM.binding(PHOBOS.id),
  MARS_MOON_SYSTEM.binding(DEIMOS.id),
  SATURN_MOON_SYSTEM.binding(MIMAS.id, iauElementsFromRecord(mimasRotation)),
  SATURN_MOON_SYSTEM.binding(ENCELADUS.id, iauElementsFromRecord(enceladusRotation)),
  SATURN_MOON_SYSTEM.binding(TETHYS.id, iauElementsFromRecord(tethysRotation)),
  SATURN_MOON_SYSTEM.binding(DIONE.id, iauElementsFromRecord(dioneRotation)),
  SATURN_MOON_SYSTEM.binding(RHEA.id, iauElementsFromRecord(rheaRotation)),
  SATURN_MOON_SYSTEM.binding(TITAN.id, iauElementsFromRecord(titanRotation)),
  SATURN_MOON_SYSTEM.binding(IAPETUS.id, iauElementsFromRecord(iapetusRotation)),
  NEPTUNE_MOON_SYSTEM.binding(TRITON.id, iauElementsFromRecord(tritonRotation)),
  PLUTO_MOON_SYSTEM.binding(CHARON.id, iauElementsFromRecord(charonRotation)),
]);

/**
 * Pluto's own offset from the system barycentre at `timeUtcMs`, from its system's centre series, or null while the system is not loaded or the
 * time lies outside the loaded chunks (Pluto then stays at the barycentre, which its position record says).
 */
function plutoOffsetKm(timeUtcMs: number): ArrayLike<number> | null {
  if (!PLUTO_MOON_SYSTEM.isLoaded()) return null;
  try {
    return PLUTO_MOON_SYSTEM.ephemeris().centreOffsetKm(timeUtcMs);
  } catch {
    return null;
  }
}

/** Pluto: the planet fits give the system barycentre; its own offset is added once its system's fits are loaded. */
export const PLUTO_BINDING: StateSourceBinding = Object.freeze<StateSourceBinding>({ body: PLUTO.id, create: (adapter) => createPlanetSunTrajectory("pluto", PLUTO_ROTATION, adapter, plutoOffsetKm) });
