// Shower basics: shared time constants, label priorities, ids and the shower catalogue.
import { catalogue as builtInCatalogue, extendCatalogue, type BodyCatalogue } from "../../assets/catalogue";
import { YEAR_DAYS, type ShowerSettings, type ShowerSource } from "./showerSettings";

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const YEAR_MS = Math.round(YEAR_DAYS * DAY_MS);
/** Label priorities: the stream and the planets Earth meets first, then the Sun, the parent, the paths. */
export const LABEL_PRIORITY = { earth: 100, sun: 95, parent: 90, planet: 80, stream: 70, parentOrbit: 65, earthPath: 60, planetOrbit: 50 } as const;

/** The catalogue this shower draws from: the built-in one, plus the parent when the settings define it. The built-in catalogue is never changed. */
export function showerCatalogue(settings: ShowerSettings): BodyCatalogue {
  if (settings.parentElements === undefined) return builtInCatalogue;
  let held = EXTENDED.get(settings);
  if (held === undefined) {
    held = extendCatalogue(builtInCatalogue, [settings.parentElements]);
    EXTENDED.set(settings, held);
  }
  return held;
}

/** One extended catalogue per settings object, so every part of one experience shares it. */
const EXTENDED = new WeakMap<ShowerSettings, BodyCatalogue>();

export const sourceLine = (source: ShowerSource): string => `${source.name} (${source.url}, accessed ${source.accessed})`;

/** The timeline's bounds: the activity window, or one year (from the settings' year start, else centred on the peak). Everything the timeline bounds (the stream, the clock, the loop) uses these. */
export function timelineBoundsOf(settings: ShowerSettings): { readonly startUtcMs: number; readonly endUtcMs: number } {
  const { startUtc, endUtc } = settings.activity;
  if (settings.timeline.span === "activity") return { startUtcMs: Date.parse(startUtc), endUtcMs: Date.parse(endUtc) };
  return yearBoundsOf(settings);
}

/** One year from the settings' year start, or centred on the peak when there is none: the shower's full default timeline. */
export function yearBoundsOf(settings: ShowerSettings): { readonly startUtcMs: number; readonly endUtcMs: number } {
  const given = settings.timeline.yearStartUtc;
  const start = given === undefined ? Math.round(Date.parse(settings.activity.peakUtc) - YEAR_MS / 2) : Date.parse(given);
  return { startUtcMs: start, endUtcMs: start + YEAR_MS };
}

/** The stream's id in the shell: also what the camera presets target. */
export const streamIdOf = (settings: ShowerSettings): string => `${settings.id}-stream`;
export const windowIdOf = (settings: ShowerSettings): string => `${settings.id}-activity`;
