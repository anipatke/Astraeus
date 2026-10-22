/**
 * A camera view as a short text: `?view=<focus>,<azimuthDeg>,<elevationDeg>,<distance>`, with the scale (`scale=`), up direction (`up=`)
 * and time (`t=`, ISO UTC) beside it. Azimuth and elevation are the scene camera's own angles about the up direction in force;
 * distance is the scene camera's own (scaled units, camera to focus). Pure text handling: no body is named here.
 */
export interface StartView {
  /** The focus target's id (a body, group or path the scene knows). */
  readonly focus: string;
  /** Degrees, 0 up to 360, about the up direction. */
  readonly azimuthDeg: number;
  /** Degrees above the orbit plane, within ±89. */
  readonly elevationDeg: number;
  /** Camera-to-focus distance in scaled units; positive. */
  readonly distance: number;
}

const MAX_ELEVATION_DEG = 89;

const wrapAzimuth = (deg: number): number => ((deg % 360) + 360) % 360;
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

/** `focus,az,el,distance`. */
export function formatView(view: StartView): string {
  return [encodeURIComponent(view.focus), view.azimuthDeg, view.elevationDeg, view.distance].join(",");
}

/** Checks a view's fields, naming the offending one (`where` is its path, e.g. `look.startView`). Returns the view with the azimuth wrapped. */
export function validateStartView(raw: unknown, where = "startView"): StartView {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new RangeError(`${where} must be an object with focus, azimuthDeg, elevationDeg and distance`);
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!["focus", "azimuthDeg", "elevationDeg", "distance"].includes(key)) throw new RangeError(`${where}.${key} is not a view field`);
  }
  if (typeof record.focus !== "string" || record.focus === "") throw new RangeError(`${where}.focus must be a non-empty id, got ${String(record.focus)}`);
  const number = (key: "azimuthDeg" | "elevationDeg" | "distance"): number => {
    const value = record[key];
    if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${where}.${key} must be a finite number, got ${String(value)}`);
    return value;
  };
  const azimuthDeg = number("azimuthDeg");
  const elevationDeg = number("elevationDeg");
  const distance = number("distance");
  if (Math.abs(elevationDeg) > MAX_ELEVATION_DEG) throw new RangeError(`${where}.elevationDeg must be within ±${MAX_ELEVATION_DEG}, got ${elevationDeg}`);
  if (!(distance > 0)) throw new RangeError(`${where}.distance must be positive, got ${distance}`);
  return { focus: record.focus, azimuthDeg: wrapAzimuth(azimuthDeg), elevationDeg, distance };
}

/** Parses `focus,az,el,distance`; throws a RangeError naming the field. */
export function parseView(text: string): StartView {
  const parts = text.split(",");
  if (parts.length !== 4) throw new RangeError(`view must be focus,azimuthDeg,elevationDeg,distance (4 parts), got ${parts.length}`);
  const [focus, az, el, distance] = parts;
  const numeric = (name: string, value: string): number => {
    if (value.trim() === "") throw new RangeError(`view ${name} is empty`);
    return Number(value);
  };
  let decoded: string;
  try { decoded = decodeURIComponent(focus); } catch { throw new RangeError("view focus is not valid text"); }
  return validateStartView({ focus: decoded, azimuthDeg: numeric("azimuth", az), elevationDeg: numeric("elevation", el), distance: numeric("distance", distance) }, "view");
}

/** The view in `?view=`, or undefined when absent or malformed (a bad link opens the experience's own view rather than failing). */
export function viewFromSearch(search: string): StartView | undefined {
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

/** The address search for a view: the current search with `view`, `scale`, `up` and `t` set (other parameters kept). */
export function viewLinkSearch(search: string, state: { view: StartView; scaleId: string; up: string; timeUtcMs: number }): string {
  const params = new URLSearchParams(search);
  params.set("view", formatView(state.view));
  params.set("scale", state.scaleId);
  params.set("up", state.up);
  params.set("t", new Date(Math.round(state.timeUtcMs / 1000) * 1000).toISOString());
  return `?${params.toString().replace(/%2C/gi, ",").replace(/%3A/gi, ":")}`;
}

/**
 * Writes the view link into the address (so a reload keeps the view), then copies the full link. `copied` is false when the clipboard refuses; the caller then shows the link to copy by hand.
 */
export async function shareViewLink(state: { view: StartView; scaleId: string; up: string; timeUtcMs: number }): Promise<{ readonly url: string; readonly copied: boolean }> {
  const search = viewLinkSearch(window.location.search, state);
  try { window.history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`); } catch { /* the link below still works */ }
  const url = `${window.location.origin}${window.location.pathname}${search}`;
  let copied = false;
  try { await navigator.clipboard.writeText(url); copied = true; } catch { copied = false; }
  return { url, copied };
}
