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

export const MAX_ELEVATION_DEG = 89;

export const wrapAzimuth = (deg: number): number => ((deg % 360) + 360) % 360;

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
