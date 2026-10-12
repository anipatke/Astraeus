import { catalogue, type BodyCatalogue } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { CameraReach } from "./experienceDefinition";

/** A tracked body is a point: the camera may come very close and is framed in Earth radii. */
export const TRACKED_MIN_DISTANCE = 0.002;
export const TRACKED_DEFAULT_DISTANCE = 0.3;
/** A focused group or path is framed at this many times its widest member's distance from its centre. */
export const GROUP_FRAMING = 2.5;
/** Camera framing span in Earth radii when the scene has no second drawn body to frame by. */
export const BARE_SCENE_SPAN = 60;
/** Closest approach to the scene's own centre body, as a multiple of its drawn radius. */
const CENTRE_MIN_FACTOR = 1.15;
/** Closest approach to any other drawn body, and the default framing, as multiples of its drawn radius. */
const BODY_MIN_FACTOR = 1.6;
const BODY_FRAMING_FACTOR = 4;

/** What framing needs to know about the scene: its centre and how far across it reaches. */
export interface SceneFrame {
  readonly centre: BodyId;
  /** Scaled distance from the centre to the farthest other drawn body; `BARE_SCENE_SPAN` when there is none. */
  readonly span: number;
  /** Where body radii and kinds are read from; the built-in catalogue when omitted. */
  readonly bodies?: BodyCatalogue;
}

/** The drawn radius of a catalogued sphere in scaled units, or null for a marker, a tracked body or any other id. */
function sphereRadius(focus: BodyId, policy: ScalePolicy, source: BodyCatalogue): number | null {
  if (!source.has(focus)) return null;
  const asset = source.get(focus);
  return asset.visual.kind === "sphere" ? policy.mapRadius(asset.definition.radiusKm, asset.definition.id) : null;
}

/** Zoom limits per focus kind; a declared reach replaces only the farthest distance. */
export function focusLimits(focus: BodyId, frame: SceneFrame, policy: ScalePolicy, declared: CameraReach): { min: number; max: number } {
  const max = declared.maxFocusDistance ?? Math.max(30, frame.span * 3.5);
  const radius = sphereRadius(focus, policy, frame.bodies ?? catalogue);
  if (radius === null) return { min: TRACKED_MIN_DISTANCE, max };
  return { min: radius * (focus === frame.centre ? CENTRE_MIN_FACTOR : BODY_MIN_FACTOR), max };
}

/** Default camera distance on focus: the centre body shows the whole scene, any other sphere fills the view, a point stays close. */
export function defaultDistance(focus: BodyId, frame: SceneFrame, policy: ScalePolicy): number {
  const radius = sphereRadius(focus, policy, frame.bodies ?? catalogue);
  if (radius === null) return TRACKED_DEFAULT_DISTANCE;
  return focus === frame.centre ? Math.max(3.2, frame.span * 2.4) : radius * BODY_FRAMING_FACTOR;
}

/** The radius the camera keeps clear of, in scaled units; zero for a point. */
export function focusRadius(focus: BodyId, policy: ScalePolicy, source: BodyCatalogue = catalogue): number {
  return sphereRadius(focus, policy, source) ?? 0;
}

/** Scaled length of a distance in km under a policy. */
export function scaleLength(policy: ScalePolicy, km: number): number {
  return policy.mapPosition([km, 0, 0])[0];
}

/** First render layer used for a lit body; layer 0 holds shared lines and TRACK_LAYER holds overlays. */
const FIRST_BODY_LAYER = 1;
const MAX_LAYER = 31;

/**
 * One render layer per lit sphere, in draw order, skipping the overlay layer; markers draw on the overlay layer.
 * Earth and the Moon keep layers 1 and 2.
 */
export function assignBodyLayers(bodies: readonly BodyId[], overlayLayer: number, source: BodyCatalogue = catalogue): ReadonlyMap<BodyId, number> {
  const layers = new Map<BodyId, number>();
  let next = FIRST_BODY_LAYER;
  for (const id of bodies) {
    if (source.get(id).visual.kind === "marker") {
      layers.set(id, overlayLayer);
      continue;
    }
    if (next === overlayLayer) next += 1;
    if (next > MAX_LAYER) throw new RangeError(`a scene draws at most ${MAX_LAYER - 1} lit bodies; "${id}" would need layer ${next}`);
    layers.set(id, next);
    next += 1;
  }
  return layers;
}
