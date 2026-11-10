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

/** The field of view a sky reading may carry, in degrees (a look-out camera's zoom). */
export const SKY_FOV_RANGE_DEG = { min: 5, max: 100 } as const;

/**
 * A camera standing inside `lookOut` (a body's id) and looking out: `raDeg` and `decDeg` are where it points in J2000 equatorial degrees
 * (right ascension 0 up to 360, declination within ±90), `fovDeg` the vertical field of view. Text and number checks only: no body is named here.
 */
export interface SkyView {
  readonly lookOut: string;
  readonly raDeg: number;
  readonly decDeg: number;
  readonly fovDeg: number;
}

/** Either kind of camera reading: an orbit view (has `distance`) or a sky view (has `lookOut`). */
export type CameraView = StartView | SkyView;

/** True for a sky view: the one test that tells the two kinds apart. */
export function isSkyView(view: CameraView): view is SkyView {
  return "lookOut" in view;
}

/** The unit vector (J2000 equatorial axes) toward a right ascension and declination in degrees. */
export function eqjUnitVector(raDeg: number, decDeg: number): [number, number, number] {
  const [ra, dec] = [(raDeg * Math.PI) / 180, (decDeg * Math.PI) / 180];
  return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
}

/** Checks a right ascension and declination, naming the offending field; returns the pair with the right ascension wrapped to 0 up to 360. */
export function validateSkyDirection(raDeg: unknown, decDeg: unknown, where: string): { readonly raDeg: number; readonly decDeg: number } {
  if (typeof raDeg !== "number" || !Number.isFinite(raDeg)) throw new RangeError(`${where}.raDeg must be a finite number, got ${String(raDeg)}`);
  if (typeof decDeg !== "number" || !Number.isFinite(decDeg)) throw new RangeError(`${where}.decDeg must be a finite number, got ${String(decDeg)}`);
  if (Math.abs(decDeg) > 90) throw new RangeError(`${where}.decDeg must be within ±90, got ${decDeg}`);
  return { raDeg: wrapAzimuth(raDeg), decDeg };
}

/** Checks a field of view in degrees against the range a look-out camera takes. */
export function validateSkyFov(fovDeg: unknown, where: string): number {
  if (typeof fovDeg !== "number" || !(fovDeg >= SKY_FOV_RANGE_DEG.min && fovDeg <= SKY_FOV_RANGE_DEG.max)) {
    throw new RangeError(`${where}.fovDeg must be a number from ${SKY_FOV_RANGE_DEG.min} to ${SKY_FOV_RANGE_DEG.max}, got ${String(fovDeg)}`);
  }
  return fovDeg;
}

/** Checks a sky view's fields, naming the offending one. Returns the view with the right ascension wrapped. */
export function validateSkyView(raw: unknown, where = "sky view"): SkyView {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new RangeError(`${where} must be an object with lookOut, raDeg, decDeg and fovDeg`);
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!["lookOut", "raDeg", "decDeg", "fovDeg"].includes(key)) throw new RangeError(`${where}.${key} is not a sky view field`);
  }
  if (typeof record.lookOut !== "string" || record.lookOut === "") throw new RangeError(`${where}.lookOut must be a non-empty id, got ${String(record.lookOut)}`);
  const direction = validateSkyDirection(record.raDeg, record.decDeg, where);
  return { lookOut: record.lookOut, ...direction, fovDeg: validateSkyFov(record.fovDeg, where) };
}

/** Checks either kind of reading: one with `lookOut` is a sky view, anything else an orbit view. */
export function validateCameraView(raw: unknown, where = "view"): CameraView {
  const isSky = typeof raw === "object" && raw !== null && "lookOut" in raw;
  return isSky ? validateSkyView(raw, where) : validateStartView(raw, where);
}
