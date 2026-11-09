/**
 * Saturn, Uranus, Neptune and Pluto (O-033 T-116): defined once here, placed Sun-centred from the planet curve fits (`data/ephemerides/planets/`,
 * each the system barycentre as JPL Horizons reports the planet, O-063 T-290), turned by the IAU pole and prime meridian. Their radii and
 * gravitational parameters are the Horizons physical-data headers saved in each system's moon index (`data/ephemerides/<planet>-moons/index.json`).
 * Each is placed at the system barycentre plus its own offset when its moon system is loaded: that binding is `planetBinding` in `planetTrajectory.ts`.
 */
import type { CelestialBodyDefinition, EphemerisRecord } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance, type Provenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

const HEADER_NOTE = "JPL Horizons physical data for the planet (the body's header, saved in the system's moon index), fetched 2026-10-20";

function planetDimensions(label: string, radiusText: string, gmText: string): Provenance {
  return createProvenance({
    sourceType: "observed",
    sources: [`${HEADER_NOTE}: ${radiusText}; ${gmText}`],
    accuracy: `${label}'s volumetric mean radius and its 1-bar equatorial and polar radii as printed in the Horizons header; ${label} is drawn as a spheroid. The 1-bar level is not a solid surface.`,
    notes: "Gravitational parameter in km^3/s^2 from the same header.",
  });
}

function giantPlanet(
  id: string, label: string, radii: { mean: number; equatorial: number; polar: number }, gmKm3S2: number,
  texts: { radius: string; gm: string }, ephemeris: EphemerisRecord, extraLimitations: readonly string[],
): CelestialBodyDefinition {
  return Object.freeze({
    id, label,
    radiusKm: radii.mean, equatorialRadiusKm: radii.equatorial, polarRadiusKm: radii.polar,
    gmKm3S2,
    parentId: "sun",
    orientation: "iau-rotation",
    accuracy: Object.freeze({
      dimensions: planetDimensions(label, texts.radius, texts.gm),
      position: ephemeris.provenance,
      validUtc: PLANET_VALIDATED_UTC,
      orientationLimitations: Object.freeze([ROTATION_LIMITATION, ...extraLimitations, `Constants: ${IAU_REPORT}.`]),
    }),
  });
}

const GAS_BAND = (label: string) => `${label}'s cloud bands rotate at different rates, so any prime meridian is approximate: the texture's orientation is a visual stand-in, not a measured longitude.`;

/** Pole and prime meridian from the IAU 2015 report as transcribed in NAIF pck00011.tpc (saved in docs/evidence/o019-t078-iau-rotation-*): degrees, pole per Julian century, W per day. */
export const SATURN_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({ poleRaDeg: [40.589, -0.036], poleDecDeg: [83.537, -0.004], primeMeridianDeg: [38.90, 810.7939024], citation: IAU_REPORT });
export const URANUS_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({ poleRaDeg: [257.311, 0], poleDecDeg: [-15.175, 0], primeMeridianDeg: [203.81, -501.1600928], citation: IAU_REPORT });
export const NEPTUNE_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({ poleRaDeg: [299.36, 0], poleDecDeg: [43.46, 0], primeMeridianDeg: [249.978, 541.1397757], citation: IAU_REPORT });
export const PLUTO_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({ poleRaDeg: [132.993, 0], poleDecDeg: [-6.163, 0], primeMeridianDeg: [302.695, 56.3625225], citation: IAU_REPORT });

export const SATURN_EPHEMERIS = planetEphemeris("Saturn", "699", "DE441 with the Saturn satellite ephemeris sat441l", "With the Saturn moon package loaded (it covers 1950 to 2029), within 0.5 km of Horizons' Saturn on 2 January of each year 1972 to 2029 and 0.11 to 0.31 km at the Voyager 1 and 2 closest approaches (O-063 T-290).", "Until the Saturn moon package is loaded for the date Saturn sits at its system barycentre, up to 304 km from its centre (measured 1972 to 2044).");
export const URANUS_EPHEMERIS = planetEphemeris("Uranus", "799", "DE441 with the Uranus satellite ephemeris ura184_merged, whose system barycentre differs from DE441's barycentre body 7 by up to about 3,400 km away from the 1986 Voyager 2 encounter; the series follows Horizons' Uranus", "With the Uranus moon package loaded (it covers 1950 to 2029), within 0.6 km of Horizons' Uranus on 2 January of each year 1972 to 2029 and 0.20 km at Voyager 2's closest approach (O-063 T-290).", "Until the Uranus moon package is loaded for the date Uranus sits at its system barycentre, up to 45 km from its centre (measured 1972 to 2044).");
export const NEPTUNE_EPHEMERIS = planetEphemeris("Neptune", "899", "DE441 with the Neptune satellite ephemeris nep098_merged, whose system barycentre differs from DE441's barycentre body 8 by up to about 740 km away from the 1989 Voyager 2 encounter; the series follows Horizons' Neptune", "With the Neptune moon package loaded (it covers 1950 to 2029), within 0.5 km of Horizons' Neptune on 2 January of each year 1972 to 2029 and 0.27 km at Voyager 2's closest approach (O-063 T-290).", "Until the Neptune moon package is loaded for the date Neptune sits at its system barycentre, up to 74 km from its centre (measured 1972 to 2044).");
export const PLUTO_EPHEMERIS: EphemerisRecord = planetEphemeris("Pluto", "999", "DE441 with the Pluto satellite ephemeris plu060_merged (whose barycentre agrees with DE441's body 9: the fit's bytes are the same as T-116's fit of body 9)", "With the Pluto moon package loaded (it covers 2010 to 2029), within 1.5 km of Horizons' Pluto at the archived dates 2010 to 2030 (tests/planetMoonSystems.test.ts); the barycentre fit is within 0.79 km of Horizons at independent dates 1950 to 2045.", "Until Pluto's moon package is loaded for the date Pluto sits at its system barycentre, up to about 2,100 km from its centre.");

export const SATURN = giantPlanet("saturn", "Saturn", { mean: 58232, equatorial: 60268, polar: 54364 }, 37_931_206.234,
  { radius: "Equat. radius (1 bar) = 60268+-4 km, Polar radius (km) = 54364+-10, Vol. Mean Radius (km) = 58232+-6", gm: "GM (km^3/s^2) = 37931206.234" }, SATURN_EPHEMERIS, [GAS_BAND("Saturn")]);
export const URANUS = giantPlanet("uranus", "Uranus", { mean: 25362, equatorial: 25559, polar: 24973 }, 5_793_950.6103,
  { radius: "Equat. radius (1 bar) = 25559+-4 km, Polar radius (km) = 24973+-20, Vol. Mean Radius (km) = 25362+-12", gm: "GM (km^3/s^2) = 5793950.6103" }, URANUS_EPHEMERIS, [GAS_BAND("Uranus")]);
export const NEPTUNE = giantPlanet("neptune", "Neptune", { mean: 24624, equatorial: 24766, polar: 24342 }, 6_835_099.97,
  { radius: "Equat. radius (1 bar) = 24766+-15 km, Polar radius (km) = 24342+-30, Vol. mean radius (km) = 24624+-21", gm: "GM (km^3/s^2) = 6835099.97" }, NEPTUNE_EPHEMERIS, [GAS_BAND("Neptune")]);

/** Pluto is a solid sphere (IAU 2015 radius 1188.3 km). */
export const PLUTO: CelestialBodyDefinition = Object.freeze({
  id: "pluto",
  label: "Pluto",
  radiusKm: 1188.3,
  gmKm3S2: 869.326,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [`${HEADER_NOTE}: GM (planet) km^3/s^2 = 869.326, Vol. mean radius (km) = 1188.3+-1.6`],
      accuracy: "Volumetric mean radius and GM as printed in the Horizons header (radius is IAU 2015); Pluto is drawn as a sphere.",
      notes: "Gravitational parameter in km^3/s^2 from the same header.",
    }),
    position: PLUTO_EPHEMERIS.provenance,
    validUtc: PLANET_VALIDATED_UTC,
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, `Constants: ${IAU_REPORT}.`]),
  }),
});
