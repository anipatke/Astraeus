/**
 * The looks (O-056 T-261, review F11): presentation settings that change how the scene is drawn, never where anything is. Each has a default, is set when building
 * (`Scene.setLook`, type `LookInput` in `api/look.ts`) and may be overridden by the page address when the host turned `address` on. This is the one table that maps each address
 * parameter to its `LookInput` key and parser; every reader takes the resolved `LookInput` from `resolveLook`, so none parses the address itself. Precedence: address over `setLook` over default.
 */
import type { LookInput } from "../api/look";
export type { LookInput } from "../api/look";

/** The address parameters that set a look. */
export type LookParam = "stars" | "milkyway" | "milkywaybrightness" | "sky" | "sunglow" | "sunbrightness" | "sunglowscale" | "markerpx" | "featurepx" | "loadfade";

/** How a look is written: a number in a range, an `on`/`off` switch, or a switch the address can only turn off. */
export type LookKind =
  | { readonly kind: "range"; readonly min: number; readonly max: number }
  | { readonly kind: "onoff" }
  | { readonly kind: "offOnly" };

/** One look: where it sits in `LookInput` (`["sunGlow", "sizePx"]` for a nested one), its address parameter and how it is written. */
export interface LookField { readonly path: readonly [string] | readonly [string, string]; readonly param: LookParam; readonly spec: LookKind }

const range = (path: LookField["path"], param: LookParam, min: number, max: number): LookField => ({ path, param, spec: { kind: "range", min, max } });

/** Every look. The one table; the order is the order of `LookInput`. */
export const LOOK_FIELDS: readonly LookField[] = [
  range(["starBrightness"], "stars", 0, 2),
  { path: ["milkyWay"], param: "milkyway", spec: { kind: "onoff" } },
  range(["milkyWayBrightness"], "milkywaybrightness", 0, 2),
  { path: ["skyVisible"], param: "sky", spec: { kind: "offOnly" } },
  range(["sunGlow", "sizePx"], "sunglow", 0, 400),
  range(["sunGlow", "brightness"], "sunbrightness", 0, 2),
  range(["sunGlow", "scale"], "sunglowscale", 1, 6),
  range(["markerSwapRadiusPx"], "markerpx", 0, 100),
  range(["featureMinBodyPx"], "featurepx", 0, 2000),
  range(["loadFadeSeconds"], "loadfade", 0, 3),
];

/** The name a look is called in a message: `sunGlow.sizePx`. */
export const lookName = (field: LookField): string => field.path.join(".");

type Tree = Record<string, unknown>;

/** The value a look has in `look`, or undefined. */
export function lookValue(look: LookInput, field: LookField): number | boolean | undefined {
  const [first, second] = field.path;
  const top = (look as Tree)[first];
  return (second === undefined ? top : (top as Tree | undefined)?.[second]) as number | boolean | undefined;
}

function withValue(look: LookInput, field: LookField, value: number | boolean): LookInput {
  const [first, second] = field.path;
  const copy: Tree = { ...(look as Tree) };
  copy[first] = second === undefined ? value : { ...((copy[first] as Tree | undefined) ?? {}), [second]: value };
  return copy as LookInput;
}

/** Sets a look in a copy of `look` (used by `Scene.setLook` to build the checked look). */
export const lookWith = withValue;

function rawParam(search: string, param: LookParam): string | null {
  return new URLSearchParams(search).get(param);
}

/** What one address parameter says: the value, or undefined when it is absent or unusable (an unusable number warns on the console, never throws). */
function fromAddress(search: string, field: LookField): number | boolean | undefined {
  const raw = rawParam(search, field.param);
  if (raw === null) return undefined;
  const { spec } = field;
  if (spec.kind === "onoff") return raw === "on" ? true : raw === "off" ? false : undefined;
  if (spec.kind === "offOnly") return raw === "off" ? false : undefined;
  const value = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
    console.warn(`?${field.param}=${raw} ignored: the value must be a number from ${spec.min} to ${spec.max}`);
    return undefined;
  }
  return value;
}

/** The looks in force: `base` (what the scene set) with the address text laid over it (`search` is empty when the host's `address` option is off). Pure; a live change (T-262) resolves a new base the same way. */
export function resolveLook(base: LookInput | undefined, search: string): LookInput {
  let look: LookInput = base ?? {};
  for (const field of LOOK_FIELDS) {
    const asked = fromAddress(search, field);
    if (asked !== undefined) look = withValue(look, field, asked);
  }
  return look;
}
