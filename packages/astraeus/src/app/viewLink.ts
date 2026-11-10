import { isSkyView, MAX_ELEVATION_DEG, validateSkyView, validateStartView, wrapAzimuth, type CameraView, type SkyView, type StartView } from "../core/startView";

export { validateStartView, type CameraView, type SkyView, type StartView };

const round = (value: number, places: number): number => Number(value.toFixed(places));

/** The view as the camera reports it (radians), as a StartView rounded the way a link rounds it. */
export function viewFromAngles(focus: string, azimuthRad: number, elevationRad: number, distance: number): StartView {
  const deg = 180 / Math.PI;
  return {
    focus,
    azimuthDeg: round(wrapAzimuth(azimuthRad * deg), 2) % 360,
    elevationDeg: round(Math.max(-MAX_ELEVATION_DEG, Math.min(MAX_ELEVATION_DEG, elevationRad * deg)), 2),
    distance: Number(distance.toPrecision(5)),
  };
}

/** `focus,az,el,distance` for an orbit view; `body,raDeg,decDeg,fovDeg,sky` for a sky view (the fifth part tells them apart). */
export function formatView(view: CameraView): string {
  if (isSkyView(view)) return [encodeURIComponent(view.lookOut), view.raDeg, view.decDeg, view.fovDeg, "sky"].join(",");
  return [encodeURIComponent(view.focus), view.azimuthDeg, view.elevationDeg, view.distance].join(",");
}

/** Parses either form of `formatView`; throws a RangeError naming the field. */
export function parseView(text: string): CameraView {
  const parts = text.split(",");
  if (parts.length === 5 && parts[4] === "sky") return parseSkyView(parts);
  if (parts.length !== 4) throw new RangeError(`view must be focus,azimuthDeg,elevationDeg,distance (4 parts) or body,raDeg,decDeg,fovDeg,sky (5 parts), got ${parts.length}`);
  const [focus, az, el, distance] = parts;
  const numeric = (name: string, value: string): number => {
    if (value.trim() === "") throw new RangeError(`view ${name} is empty`);
    return Number(value);
  };
  let decoded: string;
  try { decoded = decodeURIComponent(focus); } catch { throw new RangeError("view focus is not valid text"); }
  return validateStartView({ focus: decoded, azimuthDeg: numeric("azimuth", az), elevationDeg: numeric("elevation", el), distance: numeric("distance", distance) }, "view");
}

function parseSkyView(parts: readonly string[]): SkyView {
  const [body, ra, dec, fov] = parts;
  const numeric = (name: string, value: string): number => {
    if (value.trim() === "") throw new RangeError(`view ${name} is empty`);
    return Number(value);
  };
  let decoded: string;
  try { decoded = decodeURIComponent(body); } catch { throw new RangeError("view body is not valid text"); }
  return validateSkyView({ lookOut: decoded, raDeg: numeric("right ascension", ra), decDeg: numeric("declination", dec), fovDeg: numeric("field of view", fov) }, "view");
}

/** The view in `?view=`, or undefined when absent or malformed (a bad link opens the experience's own view rather than failing). */
export function viewFromSearch(search: string): CameraView | undefined {
  const raw = new URLSearchParams(search).get("view");
  if (raw === null) return undefined;
  try { return parseView(raw); } catch { return undefined; }
}

/** `?t=<ISO UTC>` as milliseconds, or undefined. */
export function timeFromSearch(search: string): number | undefined {
  const raw = new URLSearchParams(search).get("t");
  if (raw === null) return undefined;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : undefined;
}

/** `?scale=<id>`, or undefined. The caller checks the id against the scale choices it offers. */
export function scaleFromSearch(search: string): string | undefined {
  const raw = new URLSearchParams(search).get("scale");
  return raw === null || raw === "" ? undefined : raw;
}

/** What a copied link carries. `show` is the id of the scene view showing, left out in a scene without views. */
export interface ViewLinkState { view: CameraView; scaleId: string; up: string; timeUtcMs: number; show?: string }

/** `?show=<view id>` (a scene's `setViews` id), or undefined. The caller checks the id against the scene's views. */
export function showFromSearch(search: string): string | undefined {
  const raw = new URLSearchParams(search).get("show");
  return raw === null || raw === "" ? undefined : raw;
}

/** The address search for a view: the current search with `view`, `scale`, `up`, `t` and, with views, `show` set (other parameters kept). */
export function viewLinkSearch(search: string, state: ViewLinkState): string {
  const params = new URLSearchParams(search);
  params.set("view", formatView(state.view));
  params.set("scale", state.scaleId);
  params.set("up", state.up);
  params.set("t", new Date(Math.round(state.timeUtcMs / 1000) * 1000).toISOString());
  if (state.show !== undefined && state.show !== "") params.set("show", state.show);
  return `?${params.toString().replace(/%2C/gi, ",").replace(/%3A/gi, ":")}`;
}
