/** The astronomical and calendar constants the engine shares. Each is defined here once; lint refuses a copy of these literals elsewhere in engine source. */

/** One astronomical unit in kilometres (IAU 2012 Resolution B2, exact). */
export const AU_KM = 149_597_870.7;

/** Julian date of J2000.0, 2000-01-01T12:00 (TT). */
export const JD_J2000 = 2_451_545;

/** The Unix millisecond of J2000.0 noon, taken as UTC: `Date.UTC(2000, 0, 1, 12)`. */
export const J2000_NOON_UNIX_MS = 946_728_000_000;

/** Julian date of the Unix epoch, 1970-01-01T00:00 UTC. */
export const JD_UNIX_EPOCH = 2_440_587.5;

/** Seconds in a day (SI, 86 400 s). */
export const DAY_S = 86_400;

/** Milliseconds in a day. */
export const DAY_MS = 86_400_000;
