// The ephemeris records live with the body definitions in the core; this keeps the app's existing imports working.
export type { EphemerisRecord } from "../core/body";
export { EARTH_EPHEMERIS, MOON_EPHEMERIS } from "../core/bodies";
