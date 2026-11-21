// The phone layout's live numbers (T-081, O-020). What counts as a phone is decided once, in `areas/screen.ts` (viewer-interface note, section 2); this file keeps
// the numbers and the pick rule. Every number is a setting with a live control in Developer > Display settings.
import type { CSSProperties } from "react";

export { PHONE_QUERY } from "./areas/screen";

/** A body tapped or clicked in the scene opens its information card on a wide screen (T-138); on a phone the tap only flies there, so the card does not cover the view. */
export function pickOpensInfo(phone: boolean): boolean {
  return !phone;
}

/** How the phone drawers and sheets move and how tall they grow. */
export interface PhoneLayoutSettings {
  /** How long a drawer or sheet takes to slide, in milliseconds; 0 for none. */
  readonly animationMs: number;
  /** The most the timeline drawer grows to, as a percent of the viewer's own height. */
  readonly timelineDrawerMaxPercent: number;
  /** The most the top drawer grows to, as a percent of the viewer's own height. */
  readonly controlsDrawerMaxPercent: number;
  /** The most an information or story sheet grows to, as a percent of the viewer's own height. */
  readonly sheetMaxPercent: number;
  /** How far (px) a drag on a handle must travel to count as a swipe rather than a tap. */
  readonly swipeThresholdPx: number;
}

export const DEFAULT_PHONE_LAYOUT: PhoneLayoutSettings = {
  animationMs: 240,
  timelineDrawerMaxPercent: 55,
  controlsDrawerMaxPercent: 60,
  sheetMaxPercent: 50,
  swipeThresholdPx: 30,
};

/** The range each setting's live control offers. */
export const PHONE_LAYOUT_LIMITS: Readonly<
  Record<keyof PhoneLayoutSettings, { readonly min: number; readonly max: number; readonly step: number }>
> = {
  animationMs: { min: 0, max: 800, step: 20 },
  timelineDrawerMaxPercent: { min: 25, max: 80, step: 5 },
  controlsDrawerMaxPercent: { min: 25, max: 80, step: 5 },
  sheetMaxPercent: { min: 30, max: 85, step: 5 },
  swipeThresholdPx: { min: 10, max: 120, step: 5 },
};

/** The settings as the custom properties the stylesheet reads (`animationMs` is the interface look's `motionMs`: one value, `--astraeus-motion`). The height limits are in `cqh`, a share of the viewer's own height (the root is the `astraeus-viewer` container), not the window's. */
export function phoneLayoutStyle(settings: PhoneLayoutSettings): CSSProperties {
  return {
    "--astraeus-motion": `${settings.animationMs}ms`,
    "--timeline-drawer-max": `${settings.timelineDrawerMaxPercent}cqh`,
    "--controls-drawer-max": `${settings.controlsDrawerMaxPercent}cqh`,
    "--sheet-max": `${settings.sheetMaxPercent}cqh`,
  } as CSSProperties;
}
