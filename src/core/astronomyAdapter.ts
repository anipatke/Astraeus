import { Luna } from "@lizard-isana/orb";
import { transformationMatrix, transform, makeState } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { earthEpv00, sunEpv00 } from "@lizard-isana/orb/models/earth-epv00";
import { assertUtcUnixMs } from "./state";

export interface AstronomyAdapter {
  moonPositionKm(timeUtcMs: number): Float64Array;
  earthPositionFromSunKm(timeUtcMs: number): Float64Array;
  sunPositionFromEarthKm(timeUtcMs: number): Float64Array;
  earthFixedToEqjMatrix(timeUtcMs: number): Float64Array;
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

    earthFixedToEqjMatrix(timeUtcMs: number): Float64Array {
      return Float64Array.from(transformationMatrix("ecef", "equatorial-j2000", instantAt(timeUtcMs)));
    },
  });
}
