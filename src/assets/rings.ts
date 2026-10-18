/**
 * A planet's ring system as flat bands in its equator plane: each band's real radii (km) and its look (colour and opacity). Data
 * (`data/rings/<body>.json`, format `astraeus.ring-system/1`), checked here once (STYLE-06). Appearance only: it never feeds a position.
 */
export const RING_SYSTEM_FORMAT = "astraeus.ring-system/1";

export interface RingBand {
  readonly id: string;
  readonly label: string;
  readonly innerKm: number;
  readonly outerKm: number;
  readonly color: string;
  /** 0 to 1. */
  readonly opacity: number;
}

export interface RingSystem {
  readonly body: string;
  readonly bands: readonly RingBand[];
  /** Where the radii and the look come from, as plain lines for the record. */
  readonly sources: readonly string[];
}

export class RingSystemError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "RingSystemError";
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function parseRingSystem(raw: unknown): RingSystem {
  const fail = (message: string): never => { throw new RingSystemError(message); };
  if (typeof raw !== "object" || raw === null) fail("ring system must be an object");
  const record = raw as Record<string, unknown>;
  if (record.format !== RING_SYSTEM_FORMAT) fail(`ring system format must be "${RING_SYSTEM_FORMAT}"`);
  if (typeof record.body !== "string" || record.body === "") fail("ring system needs its body");
  if (!Array.isArray(record.bands) || record.bands.length === 0) fail("ring system needs bands");
  const bands = (record.bands as Record<string, unknown>[]).map((band, index): RingBand => {
    const where = `bands[${index}]`;
    const { id, label, innerKm, outerKm, color, opacity } = band;
    if (typeof id !== "string" || id === "" || typeof label !== "string" || label === "") fail(`${where} needs an id and a label`);
    if (typeof innerKm !== "number" || typeof outerKm !== "number" || !(innerKm > 0) || !(outerKm > innerKm)) fail(`${where} needs 0 < innerKm < outerKm`);
    if (typeof color !== "string" || !HEX.test(color)) fail(`${where}.color must be #rrggbb`);
    if (typeof opacity !== "number" || !(opacity >= 0 && opacity <= 1)) fail(`${where}.opacity must be from 0 to 1`);
    return Object.freeze({ id: id as string, label: label as string, innerKm: innerKm as number, outerKm: outerKm as number, color: color as string, opacity: opacity as number });
  });
  const sources = Object.values((record.sources ?? {}) as Record<string, { title?: string; url?: string }>).map((source) => [source.title, source.url].filter(Boolean).join(", "));
  return Object.freeze({ body: record.body as string, bands: Object.freeze(bands), sources: Object.freeze(sources) });
}

/** The live ring settings: per band, colour and opacity over the data's own. */
export type RingLook = Readonly<Record<string, { readonly color?: string; readonly opacity?: number }>>;

/** The bands with the live look laid over them. */
export function ringBandsWithLook(system: RingSystem, look: RingLook | undefined): readonly RingBand[] {
  if (look === undefined) return system.bands;
  return system.bands.map((band) => ({ ...band, ...look[band.id] }));
}
