// The sky as the app uses it: render-frame directions and buffers, the shell item that cites the sources, the settings check.
import { createProvenance, type Provenance } from "../core/provenance";
import { colourFromTemperature, galacticToEqj, FETCH_STARS_COMMAND, SKY_SOURCES, starAppearance, temperatureFromBV, eqjUnit, type SkySettings, type StarRow } from "../assets/sky";
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
    accuracy: "Star directions are the catalogue's J2000 positions to about an arcsecond. The Milky Way picture is a photographic panorama placed by its galactic coordinates and agrees with the stars only to a few degrees.",
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
export function resolveSkySettings(settings: SkySettings | undefined): { readonly visible: boolean; readonly starBrightness: number; readonly milkyWayBrightness: number; readonly milkyWay: boolean } {
  const check = (name: string, value: number): number => {
    if (!Number.isFinite(value) || value < 0 || value > 2) throw new RangeError(`sky.${name} must be between 0 and 2, got ${value}`);
    return value;
  };
  return {
    visible: settings?.visible ?? true,
    starBrightness: check("starBrightness", settings?.starBrightness ?? 1),
    milkyWayBrightness: check("milkyWayBrightness", settings?.milkyWayBrightness ?? 1),
    milkyWay: settings?.milkyWay ?? false,
  };
}

export interface PictureMesh {
  /** Render-frame unit directions, three per vertex. */
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
}

/**
 * One section of the Milky Way sphere as a mesh: a grid in galactic longitude and latitude whose vertices are placed in the render
 * frame through the galactic-to-J2000 rotation. The picture (longitude 0 at the centre, increasing leftwards; latitude +90 at the
 * top) is cut into `count` equal strips from the left; section `index` carries the picture coordinates of its own strip, 0 to 1
 * across the strip's own texture. `columns` counts the whole sphere, so every section is the same size. The picture is placed by
 * the mesh, with no per-pixel trigonometry.
 */
export function buildPictureMesh(columns = 128, rows = 64, section: { readonly index: number; readonly count: number } = { index: 0, count: 1 }): PictureMesh {
  const { index, count } = section;
  const across = columns / count;
  if (!Number.isInteger(across) || index < 0 || index >= count) throw new RangeError(`picture section ${index} of ${count} needs columns (${columns}) divisible by the count`);
  const vertexCount = (across + 1) * (rows + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  for (let j = 0; j <= rows; j += 1) {
    for (let i = 0; i <= across; i += 1) {
      const local = i / across;
      const u = (index + local) / count;
      const v = j / rows;
      const k = j * (across + 1) + i;
      positions.set(eqjToRenderVector(galacticToEqj((0.5 - u) * 360, (v - 0.5) * 180)), k * 3);
      uvs.set([local, v], k * 2);
    }
  }
  const indices = new Uint32Array(across * rows * 6);
  let n = 0;
  for (let j = 0; j < rows; j += 1) {
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
