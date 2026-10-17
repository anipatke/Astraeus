// The phone layout's live numbers and the one place that decides "this is a phone" (T-081, O-020). The shell sets `data-phone` from this and the
// stylesheet keys on that attribute, so the breakpoint is written once. Every number is a setting with a live control in Developer > Display settings.
import { useEffect, useState, type CSSProperties } from "react";

/** Phone: a narrow screen, or a short touch screen (a phone turned sideways, which is wider than 700 px). */
export const PHONE_QUERY = "(max-width: 700px), (max-height: 500px) and (pointer: coarse)";

/** How the phone drawers and sheets move and how tall they grow. */
export interface PhoneLayoutSettings {
  /** How long a drawer or sheet takes to slide, in milliseconds; 0 for none. */
  readonly animationMs: number;
  /** The most the timeline drawer grows to, as a percent of the screen height. */
  readonly timelineDrawerMaxPercent: number;
  /** The most the top drawer grows to, as a percent of the screen height. */
  readonly controlsDrawerMaxPercent: number;
  /** The most an information or story sheet grows to, as a percent of the screen height. */
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
export const PHONE_LAYOUT_LIMITS: Readonly<Record<keyof PhoneLayoutSettings, { readonly min: number; readonly max: number; readonly step: number }>> = {
  animationMs: { min: 0, max: 800, step: 20 },
  timelineDrawerMaxPercent: { min: 25, max: 80, step: 5 },
  controlsDrawerMaxPercent: { min: 25, max: 80, step: 5 },
  sheetMaxPercent: { min: 30, max: 85, step: 5 },
  swipeThresholdPx: { min: 10, max: 120, step: 5 },
};

/** The settings as the custom properties the stylesheet reads. */
export function phoneLayoutStyle(settings: PhoneLayoutSettings): CSSProperties {
  return {
    "--drawer-ms": `${settings.animationMs}ms`,
    "--timeline-drawer-max": `${settings.timelineDrawerMaxPercent}dvh`,
    "--controls-drawer-max": `${settings.controlsDrawerMaxPercent}dvh`,
    "--sheet-max": `${settings.sheetMaxPercent}dvh`,
  } as CSSProperties;
}

const query = (): MediaQueryList | null => (typeof window === "undefined" || typeof window.matchMedia !== "function" ? null : window.matchMedia(PHONE_QUERY));

/** Whether the screen is a phone right now; follows a resize or a turn. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const list = query();
    if (list === null) return undefined;
    const update = () => setPhone(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return phone;
}
