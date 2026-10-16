import { Luna } from "@lizard-isana/orb/src/orb-luna.js";
import { transformationMatrix, transform, makeState } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { earthEpv00, sunEpv00 } from "@lizard-isana/orb/models/earth-epv00";
import { assertUtcUnixMs } from "./state";
import { isPlanetId, planetModels, type PlanetId } from "./planetSeries";

export type { PlanetId };

const AU_KM = 149_597_870.7;
const J2000_TT_JD = 2_451_545.0;

export interface AstronomyAdapter {
  moonPositionKm(timeUtcMs: number): Float64Array;
  earthPositionFromSunKm(timeUtcMs: number): Float64Array;
  sunPositionFromEarthKm(timeUtcMs: number): Float64Array;
  earthFixedToEqjMatrix(timeUtcMs: number): Float64Array;
  /** Planet position about the Sun in EQJ km (VSOP87A); throws for a planet the adapter has no model for. */
  planetPositionFromSunKm(planet: PlanetId, timeUtcMs: number): Float64Array;
  /** Days of terrestrial time since J2000 (JD 2451545.0 TT), the epoch the IAU rotation models count from. */
  daysSinceJ2000Tt(timeUtcMs: number): number;
}

function instantAt(timeUtcMs: number): AstroInstant {
  assertUtcUnixMs(timeUtcMs);
  return AstroInstant.fromUnixMs(timeUtcMs);
}

function finiteVector(values: ArrayLike<number>, label: string): Float64Array {
  const result = Float64Array.from(values);
  if (result.length !== 3 || [...result].some((component) => !Number.isFinite(component))) {
    throw new TypeError(`${label} provider returned an invalid vector`);
  }
  return result;
}

export function createOrbAstronomyAdapter(): AstronomyAdapter {
  const moon = new Luna();
  return Object.freeze({
    moonPositionKm(timeUtcMs: number): Float64Array {
      const instant = instantAt(timeUtcMs);
      const date = new Date(timeUtcMs);
      const ecliptic = moon.xyz(date);
      if (ecliptic.coordinate_keywords !== "ecliptic rectangular"
        || ecliptic.center_keywords !== "earth"
        || ecliptic.unit_keywords !== "km") {
        throw new TypeError("Orb lunar result changed its documented Earth-centered km contract");
      }
      const state = makeState({
        t: instant,
        frame: "ecliptic-of-date",
        center: "earth",
        r: [ecliptic.x, ecliptic.y, ecliptic.z],
      });
      const eqj = transform(state, { frame: "equatorial-j2000" });
      if (eqj.center !== "earth") throw new TypeError("Orb lunar transform changed its center");
      return finiteVector(eqj.r, "Moon");
    },

    earthPositionFromSunKm(timeUtcMs: number): Float64Array {
      const state = earthEpv00.state(instantAt(timeUtcMs));
      if (state.frame !== "equatorial-j2000" || state.center !== "sun") {
        throw new TypeError("Orb Earth EPV00 result changed its EQJ/Sun-centered contract");
      }
      return finiteVector(state.r, "Earth EPV00");
    },

    sunPositionFromEarthKm(timeUtcMs: number): Float64Array {
      const state = sunEpv00.state(instantAt(timeUtcMs));
      if (state.frame !== "equatorial-j2000" || state.center !== "earth") {
        throw new TypeError("Orb Sun EPV00 result changed its EQJ/Earth-centered contract");
      }
      return finiteVector(state.r, "Sun EPV00");
    },

    planetPositionFromSunKm(planet: PlanetId, timeUtcMs: number): Float64Array {
      const instant = instantAt(timeUtcMs);
      if (!isPlanetId(planet)) throw new RangeError(`the astronomy adapter has no model for planet "${planet}"`);
      const model = planetModels()[planet];
      const ecliptic = model.xyz(new Date(timeUtcMs));
      if (ecliptic.coordinate_keywords !== "ecliptic rectangular j2000" || ecliptic.unit_keywords !== "au") {
        throw new TypeError("Orb VSOP87A result changed its heliocentric ecliptic-J2000 au contract");
      }
      const state = makeState({
        t: instant,
        frame: "ecliptic-j2000",
        center: "sun",
        r: [ecliptic.x * AU_KM, ecliptic.y * AU_KM, ecliptic.z * AU_KM],
      });
      const eqj = transform(state, { frame: "equatorial-j2000" });
      if (eqj.center !== "sun") throw new TypeError("Orb VSOP87A transform changed its center");
      return finiteVector(eqj.r, `${planet} VSOP87A`);
    },

    daysSinceJ2000Tt(timeUtcMs: number): number {
      const [jd1, jd2] = instantAt(timeUtcMs).jd2parts("tt");
      const days = (jd1 - J2000_TT_JD) + jd2;
      if (!Number.isFinite(days)) throw new TypeError("Orb terrestrial time conversion returned a non-finite value");
      return days;
    },

    earthFixedToEqjMatrix(timeUtcMs: number): Float64Array {
      return Float64Array.from(transformationMatrix("ecef", "equatorial-j2000", instantAt(timeUtcMs)));
    },
  });
}
