import { AU_KM } from "./constants";
import fits from "../../data/ephemerides/planets/planets.json" with { type: "json" };
import { chunkCovers, chunkPositionInto, decodeChunk, type SeriesChunk } from "./chebyshevSeries";
import { PLANET_IDS, PlanetFitsUncoveredError, type PlanetModel, type PlanetModels } from "./planetSeries";
import type { TimeBounds } from "./trajectory";
import { assertTimeScaleTable, utcMsToTtSeconds, type TimeScaleTable } from "./timeScale";

/** The astronomical unit in km that the astronomy adapter multiplies the model's au by; the fits are stored in km with the same value. */

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

function planetModel(chunk: SeriesChunk<"tt">, table: TimeScaleTable): PlanetModel {
  const km = new Float64Array(3);
  return {
    xyz(date: Date) {
      const tt = utcMsToTtSeconds(table, date.getTime());
      if (!chunkCovers(chunk, tt)) throw new PlanetFitsUncoveredError(date);
      chunkPositionInto(chunk, tt, km, 0);
      return {
        x: km[0] / AU_KM,
        y: km[1] / AU_KM,
        z: km[2] / AU_KM,
        coordinate_keywords: "ecliptic rectangular j2000",
        unit_keywords: "au",
      };
    },
  };
}

/** The years the stored planet fits cover (UTC): from the time-scale table's first piece to where it ends, which the importer sets to the fitted span. */
export function planetSeriesSpan(): TimeBounds {
  const table = fits.timeScale as TimeScaleTable;
  return Object.freeze({ startUtcMs: table.pieces[0].fromUtcMs, endUtcMs: table.validToUtcMs });
}

/** A file in the planet-fit format (`planets.json`, or one a data package ships): its time-scale table and stored fits by body id. */
export interface PlanetFits {
  readonly format?: unknown;
  readonly timeScale?: unknown;
  readonly planets?: Readonly<Record<string, object>>;
}

/**
 * One body's model from a file in the planet-fit format: the one decode the built-in planets and the Sun-circling bodies a data package hands in
 * (`DataSource.bodyPositions`, imported lazily by `installData`) share. Throws on a file that does not fit.
 */
export function createSeriesModel(file: PlanetFits, id: string): PlanetModel {
  if (file.format !== fits.format) throw new TypeError(`format must be "${fits.format}"`);
  const table = file.timeScale as TimeScaleTable;
  assertTimeScaleTable(table);
  const p = file.planets?.[id] as StoredPlanet | undefined;
  if (typeof p?.data !== "string" || !(p.segmentSeconds > 0 && p.quantumKm > 0))
    throw new TypeError(`planets.${id} holds no fit with a positive segment length and quantum`);
  const chunk = decodeChunk<"tt">(decodeBase64(p.data), {
    startTdbS: p.startS,
    segmentSeconds: p.segmentSeconds,
    segmentCount: p.segmentCount,
    coefficientCount: p.coefficientCount,
    quantumKm: p.quantumKm,
  });
  return planetModel(chunk, table);
}

/**
 * The planet models from the stored curve fits (`data/ephemerides/planets/`, O-025 T-101): heliocentric ecliptic-J2000 positions as piecewise
 * Chebyshev series in TT of each planet's system barycentre as JPL Horizons reports the planet, within 1 km (O-063 T-290; tools/import/planet-fits.mjs). UTC to TT uses the table stored
 * beside them. Dates outside the fitted span (1950 to 2045) throw rather than extrapolate. Only planetSeries.ts imports this, lazily.
 */
export function createPlanetModels(): PlanetModels {
  return Object.fromEntries(PLANET_IDS.map((id) => [id, createSeriesModel(fits, id)])) as PlanetModels;
}
