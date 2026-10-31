import type { CelestialBodyDefinition, EphemerisRecord } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";

/** Source of the Moon's rotation constants (PROV-01). The 2015 report gives none for the Moon, so these are the 2009 report's, as NAIF saved them. */
export const MOON_IAU_REPORT = "Archinal et al., Report of the IAU Working Group on Cartographic Coordinates and Rotational Elements: 2009, Celestial Mechanics and Dynamical Astronomy 109, 101 (2011), as transcribed in NAIF pck00011.tpc (2022-12-27), BODY301 and BODY3_NUT_PREC_ANGLES";

/**
 * The Moon's pole and prime meridian, including the report's libration terms E1 to E13 (the pole and W terms the report lists): degrees, pole per Julian
 * century, W per day, from J2000 TDB. The report's -1.4e-12 d^2 term in W is left out (0.0005 degrees at 50 years from J2000). Body +X is longitude 0, +Z the pole.
 */
export const MOON_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [269.9949, 0.0031],
  poleDecDeg: [66.5392, 0.013],
  primeMeridianDeg: [38.3213, 13.17635815],
  periodic: Object.freeze({
    anglesDeg: [
      [125.045, -1935.5364525], [250.089, -3871.072905], [260.008, 475263.3328725], [176.625, 487269.629985],
      [357.529, 35999.0509575], [311.589, 964468.49931], [134.963, 477198.869325], [276.617, 12006.300765],
      [34.226, 63863.5132425], [15.134, -5806.6093575], [119.743, 131.84064], [239.961, 6003.1503825],
      [25.053, 473327.79642],
    ],
    poleRaDeg: [-3.8787, -0.1204, 0.07, -0.0172, 0, 0.0072, 0, 0, 0, -0.0052, 0, 0, 0.0043],
    poleDecDeg: [1.5419, 0.0239, -0.0278, 0.0068, 0, -0.0029, 0.0009, 0, 0, 0.0008, 0, 0, -0.0009],
    primeMeridianDeg: [3.561, 0.1208, -0.0642, 0.0158, 0.0252, -0.0066, -0.0047, -0.0046, 0.0028, 0.0052, 0.004, 0.0019, -0.0044],
  }),
  citation: MOON_IAU_REPORT,
});

const ROTATION_LIMITATION = "The Moon's orientation is the IAU mean-Earth rotation model with its libration terms, so the Moon shows libration in longitude and latitude. It is a published series, not the JPL lunar ephemeris: its sub-Earth point and pole differ from Horizons' by at most 0.01 degrees (about 0.3 km on the surface) at the seven dates from 1969 to 2050 that were checked, and its accuracy elsewhere is not stated by the source.";
const LANDING_SITE_OFFSET = "A landing site placed by the IAU model (a mission reconstruction's, measured at the Sea of Tranquility) sits 0.01 km (under 0.001 degrees) from the same selenographic coordinates on this Moon at touchdown, because the reconstruction and the drawn Moon use the same IAU model (docs/ASTRAEUS_SPIKE_02.md measured 254 km, 8.4 degrees, under the earlier tidal lock).";

export const MOON_EPHEMERIS: EphemerisRecord = {
  provenance: createProvenance({
    sourceType: "ephemeris",
    sources: ["@lizard-isana/orb 3.1.1 Luna: truncated Meeus-style lunar series, converted to Earth-centred J2000 equatorial"],
    accuracy: "Position checked against JPL Horizons (DE441) samples within the project's acceptance targets, which are not a guaranteed bound for every date.",
    notes: "Body size is the volumetric mean radius (NASA NSSDC fact sheet).",
  }),
  knownLimitations: [
    ROTATION_LIMITATION,
    "No velocity is modelled for the Moon, so it has no speed readout.",
  ],
};

/** One sidereal month, days: the Moon's period about Earth. */
export const MOON_SIDEREAL_PERIOD_DAYS = 27.321661;

export const MOON: CelestialBodyDefinition = Object.freeze({
  id: "moon",
  label: "Moon",
  // Volumetric mean radius in km from the NASA NSSDC Moon fact sheet.
  radiusKm: 1737.4,
  gmKm3S2: 4902.800066,
  parentId: "earth",
  orbitPeriodDays: MOON_SIDEREAL_PERIOD_DAYS,
  orbitLineFades: true,
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: ["NASA NSSDC Moon fact sheet (volumetric mean radius)"],
      accuracy: "Mean radius only; the Moon is drawn as a sphere.",
      notes: "Gravitational parameter matches the @lizard-isana/orb 3.1.1 table (a test asserts it).",
    }),
    position: MOON_EPHEMERIS.provenance,
    // The sampled Horizons comparison range (tests/fixtures/moon-horizons.json); the truncated series states no validity range of its own.
    validUtc: Object.freeze({ startUtcMs: Date.UTC(2022, 5, 1), endUtcMs: Date.UTC(2025, 5, 1) }),
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, LANDING_SITE_OFFSET]),
  }),
});
