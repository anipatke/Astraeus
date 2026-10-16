// The sky as the app uses it: render-frame directions and buffers, the shell item that cites the sources, the settings check.
import { createProvenance, type Provenance } from "../core/provenance";
import { colourFromTemperature, galacticToEqj, FETCH_STARS_COMMAND, DEFAULT_SKY_MAP, SKY_SOURCES, starAppearance, temperatureFromBV, eqjUnit, type PictureFrame, type SkyMapSource, type SkySettings, type StarRow } from "../assets/sky";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";

/** The unit direction of a star in the render frame: its catalogue RA/Dec through the fixed render-axis conversion. */
export function starRenderDirection(star: StarRow): RenderVector {
  return eqjToRenderVector(eqjUnit(star[0], star[1]));
}

export interface StarBuffers {
  readonly count: number;
  /** Unit render-frame directions, Float32. */
  readonly directions: Float32Array;
  /** sRGB colour times brightness. */
  readonly colours: Float32Array;
  readonly sizesPx: Float32Array;
}

/** Fills GPU buffers from a catalogue. Directions are computed in Float64 and narrowed once, to Float32 (about 1e-7 rad). */
export function buildStarBuffers(stars: readonly StarRow[]): StarBuffers {
  const directions = new Float32Array(stars.length * 3);
  const colours = new Float32Array(stars.length * 3);
  const sizesPx = new Float32Array(stars.length);
  stars.forEach((star, i) => {
    const [x, y, z] = starRenderDirection(star);
    directions.set([x, y, z], i * 3);
    const { sizePx, brightness } = starAppearance(star[2]);
    const [r, g, b] = star[3] === null ? [1, 1, 1] : colourFromTemperature(temperatureFromBV(star[3]));
    colours.set([r * brightness, g * brightness, b * brightness], i * 3);
    sizesPx[i] = sizePx;
  });
  return { count: stars.length, directions, colours, sizesPx };
}

/** Whether the star file was found: still loading, absent, or loaded with a count. */
export type StarStatus = { readonly kind: "loading" } | { readonly kind: "absent" } | { readonly kind: "loaded"; readonly count: number };

export const SKY_OBJECT_ID = "sky";

/** The sky's one shell item: it cites both sources and states what is and is not drawn. */
export function skyObject(status: StarStatus): ExperienceObject {
  const starLine = status.kind === "loaded"
    ? `${status.count} stars of magnitude 6.5 or brighter are drawn from the locally fetched Yale catalogue.`
    : status.kind === "loading"
      ? "Looking for the locally fetched star catalogue."
      : `Stars are not drawn: the star catalogue is not fetched on this machine. Run "${FETCH_STARS_COMMAND}" to fetch it. The Milky Way picture, when switched on, is drawn without them.`;
  const provenance: Provenance = createProvenance({
    sourceType: "observed",
    sources: SKY_SOURCES,
    accuracy: "Star directions are the catalogue's J2000 positions to about an arcsecond. The Milky Way picture is either the ESO photographic panorama, placed by its galactic coordinates (agrees with the stars only to a few degrees), or, only when asked for and fetched locally, the NASA Deep Star Maps 2020 render in J2000 (registered exactly; its own faint stars are baked in and are drawn weaker so they do not double the catalogue stars).",
    notes: starLine,
  });
  return {
    id: SKY_OBJECT_ID,
    label: "Sky",
    description: "Stars and the Milky Way, drawn at infinity behind the scene. The sky turns only with the camera; the scene centre, scale and followed object do not move it.",
    provenance,
    knownLimitations: [
      "Fixed to the J2000 frame: no precession and no star proper motion, so it does not change with the clock.",
      "Stars are tinted from the B-V colour index and sized by magnitude; they are not photometrically exact.",
    ],
  };
}

/** The experience config with the sky's item appended, or unchanged when the sky is hidden. */
export function withSkyObject(config: ExperienceConfig, visible: boolean, status: StarStatus): ExperienceConfig {
  if (!visible || config.objects.some((object) => object.id === SKY_OBJECT_ID)) return config;
  return { ...config, objects: [...config.objects, skyObject(status)] };
}

/** The validated, complete settings. */
export function resolveSkySettings(settings: SkySettings | undefined): { readonly visible: boolean; readonly starBrightness: number; readonly milkyWayBrightness: number; readonly milkyWay: boolean; readonly source: SkyMapSource } {
  const check = (name: string, value: number): number => {
    if (!Number.isFinite(value) || value < 0 || value > 2) throw new RangeError(`sky.${name} must be between 0 and 2, got ${value}`);
    return value;
  };
  return {
    visible: settings?.visible ?? true,
    starBrightness: check("starBrightness", settings?.starBrightness ?? 1),
    milkyWayBrightness: check("milkyWayBrightness", settings?.milkyWayBrightness ?? 1),
    milkyWay: settings?.milkyWay ?? false,
    source: settings?.source ?? DEFAULT_SKY_MAP,
  };
}

export interface PictureMesh {
  /** Render-frame unit directions, three per vertex. */
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
}

/** What `buildPictureMesh` needs of one tile: its place in the grid and the frame the picture is registered in. */
export interface TileSection {
  readonly column: number;
  readonly row: number;
  readonly columns: number;
  readonly rows: number;
  readonly frame: PictureFrame;
}

/**
 * One tile of the picture sphere as a mesh. The picture (RA or galactic longitude at the centre increasing leftwards, latitude +90
 * at the top) is cut into `section.columns` x `section.rows` tiles, column 0 at the left and row 0 at the top. `columns` and `rows`
 * count the whole sphere, so every tile is the same size; each vertex is placed in the render frame (through the galactic-to-J2000
 * rotation for a galactic picture, directly from RA and Dec for an equatorial one) and carries its own tile's 0..1 picture coordinates.
 * The legacy `{ index, count }` section is a strip of a galactic picture, left to right.
 */
export function buildPictureMesh(columns = 128, rows = 64, section: TileSection | { readonly index: number; readonly count: number } = { index: 0, count: 1 }): PictureMesh {
  const tile: TileSection = "count" in section ? { column: section.index, row: 0, columns: section.count, rows: 1, frame: "galactic" } : section;
  const across = columns / tile.columns;
  const down = rows / tile.rows;
  if (!Number.isInteger(across) || !Number.isInteger(down) || tile.column < 0 || tile.column >= tile.columns || tile.row < 0 || tile.row >= tile.rows) {
    throw new RangeError(`picture tile ${tile.column},${tile.row} of ${tile.columns}x${tile.rows} needs columns (${columns}) and rows (${rows}) divisible by the grid`);
  }
  const vertexCount = (across + 1) * (down + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  for (let j = 0; j <= down; j += 1) {
    for (let i = 0; i <= across; i += 1) {
      const localU = i / across;
      const localV = j / down; // 0 at the tile's bottom edge, 1 at its top
      const u = (tile.column + localU) / tile.columns;
      const v = (tile.rows - tile.row - 1 + localV) / tile.rows;
      const k = j * (across + 1) + i;
      positions.set(eqjToRenderVector(pictureDirection(tile.frame, u, v)), k * 3);
      uvs.set([localU, localV], k * 2);
    }
  }
  const indices = new Uint32Array(across * down * 6);
  let n = 0;
  for (let j = 0; j < down; j += 1) {
    for (let i = 0; i < across; i += 1) {
      const a = j * (across + 1) + i;
      const b = a + 1;
      const c = a + across + 1;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], n);
      n += 6;
    }
  }
  return { positions, uvs, indices };
}

/** The EQJ unit direction of a whole-picture coordinate (u from the left, v up, both 0..1) in a frame. */
export function pictureDirection(frame: PictureFrame, u: number, v: number): [number, number, number] {
  const longitude = (0.5 - u) * 360;
  const latitude = (v - 0.5) * 180;
  return frame === "galactic" ? galacticToEqj(longitude, latitude) : eqjUnit(longitude, latitude);
}
