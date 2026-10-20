import fits from "../../data/ephemerides/planets/planets.json";
import { chunkCovers, chunkPositionInto, decodeChunk, type SeriesChunk } from "./chebyshevSeries";
import { PLANET_IDS, type PlanetId, type PlanetModel, type PlanetModels } from "./planetSeries";
import { assertTimeScaleTable, ttMinusUtcSeconds, type TimeScaleTable } from "./timeScale";

/** The astronomical unit in km that the astronomy adapter multiplies the model's au by; the fits are stored in km with the same value. */
const AU_KM = 149_597_870.7;
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12);

interface StoredPlanet {
  readonly startS: number;
  readonly segmentSeconds: number;
  readonly segmentCount: number;
  readonly coefficientCount: number;
  readonly quantumKm: number;
  readonly data: string;
}

function decodeBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function planetModel(chunk: SeriesChunk, table: TimeScaleTable): PlanetModel {
  const km = new Float64Array(3);
  return {
    xyz(date: Date) {
      const utcMs = date.getTime();
      const tt = (utcMs - J2000_UNIX_MS) / 1000 + ttMinusUtcSeconds(table, utcMs);
      if (!chunkCovers(chunk, tt)) throw new RangeError(`the planet curve fits do not cover ${date.toISOString()}`);
      chunkPositionInto(chunk, tt, km, 0);
      return { x: km[0] / AU_KM, y: km[1] / AU_KM, z: km[2] / AU_KM, coordinate_keywords: "ecliptic rectangular j2000", unit_keywords: "au" };
    },
  };
}

/**
 * The planet models from the stored curve fits (`data/ephemerides/planets/`, O-025 T-101): heliocentric ecliptic-J2000 positions as piecewise
 * Chebyshev series in TT, refitted from Orb's full VSOP87A series within 1 km (Pluto: fitted to Horizons states; tools/import/planet-fits.mjs). UTC to TT uses the table stored
 * beside them. Dates outside the fitted span (1969 to 2045) throw rather than extrapolate. Only planetSeries.ts imports this, lazily.
 */
export function createPlanetModels(): PlanetModels {
  const table = fits.timeScale as TimeScaleTable;
  assertTimeScaleTable(table);
  const planets = fits.planets as Record<PlanetId, StoredPlanet>;
  const model = (id: PlanetId): PlanetModel => {
    const p = planets[id];
    const chunk = decodeChunk(decodeBase64(p.data), { startTdbS: p.startS, segmentSeconds: p.segmentSeconds, segmentCount: p.segmentCount, coefficientCount: p.coefficientCount, quantumKm: p.quantumKm });
    return planetModel(chunk, table);
  };
  return Object.fromEntries(PLANET_IDS.map((id) => [id, model(id)])) as PlanetModels;
}
