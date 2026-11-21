// The public interface look (viewer-interface note, section 10): the colours, font, text size, corner radius and motion time a host sets for one viewer.
// Job: turn the checked settings into the custom properties that `look.css` defines, set as inline style on that viewer's root, so two viewers on one page keep
// separate looks (API-03). It holds no raw value of its own beyond the documented defaults, which `tests/interfaceLook.test.ts` compares with `look.css`.
// It must not touch placement: sizes of the interface come from `look.css` tokens only.
import type { CSSProperties } from "react";

/** The settings a host may set; every field is optional and keeps the default (see `InterfaceLook` in `api/look.ts`). */
export interface InterfaceLookSettings {
  readonly panel?: string;
  readonly text?: string;
  readonly muted?: string;
  readonly accent?: string;
  readonly border?: string;
  readonly data?: string;
  readonly fontFamily?: string;
  readonly textSizePx?: number;
  readonly radiusPx?: number;
  readonly motionMs?: number;
}

/** Every setting filled in (what `ViewerHandle.look.interface` reads). */
export type InterfaceLookRead = Required<InterfaceLookSettings>;

/** The defaults: the values `look.css` defines (compared with it by a test). */
export const DEFAULT_INTERFACE_LOOK: Readonly<InterfaceLookRead> = Object.freeze({
  panel: "rgba(13, 13, 13, .88)",
  text: "#f0e6da",
  muted: "#c7bdb3",
  accent: "#e8b06a",
  border: "rgba(240, 230, 218, .18)",
  data: "#b1a1df",
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  textSizePx: 14,
  radiusPx: 12,
  motionMs: 240,
});

/** Internal look colours a setting control must show as a value (the Developer drawer's glow colour), equal to their `look.css` tokens (tests/lookDrift.test.ts). */
export const INTERNAL_LOOK_COLOURS: Readonly<{ readonly glow: string }> = Object.freeze({ glow: "#cfe0ff" });

/** The range each number setting accepts. */
export const INTERFACE_LOOK_LIMITS = Object.freeze({
  textSizePx: { min: 11, max: 18 },
  radiusPx: { min: 0, max: 20 },
  motionMs: { min: 0, max: 800 },
});

/** The colour settings, each the custom property it sets. */
const COLOUR_PROPERTIES = {
  panel: "--astraeus-panel",
  text: "--astraeus-text",
  muted: "--astraeus-muted",
  accent: "--astraeus-accent",
  border: "--astraeus-border",
  data: "--astraeus-data",
} as const;

/** The settings in force: `look` with every field not named at its default. */
export function interfaceLookOf(look: { readonly interface?: InterfaceLookSettings }): InterfaceLookRead {
  return { ...DEFAULT_INTERFACE_LOOK, ...look.interface };
}

/**
 * The custom properties for a viewer's root. A setting left at its default sets nothing, so a viewer with the default look carries no inline property and
 * `look.css` stands. Reduced motion forces the motion time to 0 whatever the setting says.
 */
export function interfaceLookVars(settings: InterfaceLookSettings | undefined, reducedMotion: boolean): CSSProperties {
  const vars: Record<string, string> = {};
  const set = settings ?? {};
  for (const [key, property] of Object.entries(COLOUR_PROPERTIES) as [keyof typeof COLOUR_PROPERTIES, string][]) {
    const value = set[key];
    if (value !== undefined && value !== DEFAULT_INTERFACE_LOOK[key]) vars[property] = value;
  }
  if (set.fontFamily !== undefined && set.fontFamily !== DEFAULT_INTERFACE_LOOK.fontFamily)
    vars["--astraeus-font"] = set.fontFamily;
  if (set.textSizePx !== undefined && set.textSizePx !== DEFAULT_INTERFACE_LOOK.textSizePx)
    vars["--astraeus-text-size"] = `${set.textSizePx}px`;
  if (set.radiusPx !== undefined && set.radiusPx !== DEFAULT_INTERFACE_LOOK.radiusPx)
    vars["--astraeus-radius"] = `${set.radiusPx}px`;
  if (reducedMotion) vars["--astraeus-motion"] = "0ms";
  else if (set.motionMs !== undefined && set.motionMs !== DEFAULT_INTERFACE_LOOK.motionMs)
    vars["--astraeus-motion"] = `${set.motionMs}ms`;
  return vars as CSSProperties;
}
