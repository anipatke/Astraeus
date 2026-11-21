// The areas module's one description of what the screen is (viewer-interface note, section 2). Job: decide the root attributes `data-phone`, `data-pointer`,
// `data-embedded` and `data-motion` from the VIEWER's own size (a ResizeObserver on the viewer root, owner decision "Viewer's own size") plus two media reads
// (pointer, reduced motion). Nothing else in the interface decides "this is a phone" or "this is touch". It must not know any part, and it holds no style.
import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { isEmbedded } from "../embedded";

/** A viewer this wide or narrower is a phone layout. */
export const PHONE_MAX_WIDTH_PX = 700;
/** A viewer this short or shorter is a phone layout when the pointer is coarse (a phone turned sideways). */
export const PHONE_MAX_HEIGHT_PX = 500;
/** The window phone rule, used only until the viewer has a size to measure (first paint, a page with no layout): the same rule on the window. */
export const PHONE_QUERY = `(max-width: ${PHONE_MAX_WIDTH_PX}px), (max-height: ${PHONE_MAX_HEIGHT_PX}px) and (pointer: coarse)`;
const COARSE_QUERY = "(pointer: coarse)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface Screen {
  readonly layout: "phone" | "wide";
  readonly pointer: "coarse" | "fine";
  readonly embedded: boolean;
  readonly motion: "reduced" | "full";
}

/** The layout a viewer of this size has. Pure. */
export function layoutFor(widthPx: number, heightPx: number, coarse: boolean): Screen["layout"] {
  return widthPx <= PHONE_MAX_WIDTH_PX || (heightPx <= PHONE_MAX_HEIGHT_PX && coarse) ? "phone" : "wide";
}

const query = (text: string): MediaQueryList | null => (typeof window === "undefined" || typeof window.matchMedia !== "function" ? null : window.matchMedia(text));
const matches = (text: string): boolean => query(text)?.matches ?? false;

/** The screen as it is now. `size` is the viewer's measured size; absent or empty (nothing laid out yet), the window rule decides the layout. */
export function readScreen(size: { readonly width: number; readonly height: number } | null, embedded: boolean): Screen {
  const coarse = matches(COARSE_QUERY);
  const measured = size !== null && size.width > 0 && size.height > 0;
  return {
    layout: measured ? layoutFor(size.width, size.height, coarse) : matches(PHONE_QUERY) ? "phone" : "wide",
    pointer: coarse ? "coarse" : "fine",
    embedded,
    motion: matches(MOTION_QUERY) ? "reduced" : "full",
  };
}

const same = (a: Screen, b: Screen): boolean => a.layout === b.layout && a.pointer === b.pointer && a.embedded === b.embedded && a.motion === b.motion;

/** The root attributes for a screen. */
export function screenAttributes(screen: Screen): { readonly "data-phone": boolean; readonly "data-pointer": Screen["pointer"]; readonly "data-embedded": boolean; readonly "data-motion": Screen["motion"] } {
  return { "data-phone": screen.layout === "phone", "data-pointer": screen.pointer, "data-embedded": screen.embedded, "data-motion": screen.motion };
}

/** The viewer's screen, following its own size (not the window's), the pointer and the reduced-motion setting. `root` is the viewer's root element. */
export function useScreen(root: RefObject<HTMLElement | null>): Screen {
  const [embedded] = useState(isEmbedded);
  const [screen, setScreen] = useState<Screen>(() => readScreen(null, embedded));
  useLayoutEffect(() => {
    const element = root.current;
    const update = () => {
      const box = element?.getBoundingClientRect();
      const next = readScreen(box === undefined ? null : { width: box.width, height: box.height }, embedded);
      setScreen((was) => (same(was, next) ? was : next));
    };
    update();
    const observer = typeof ResizeObserver === "undefined" || element === null ? null : new ResizeObserver(update);
    if (element !== null) observer?.observe(element);
    return () => observer?.disconnect();
  }, [root, embedded]);
  useEffect(() => {
    const lists = [COARSE_QUERY, MOTION_QUERY, PHONE_QUERY].map(query).filter((list): list is MediaQueryList => list !== null);
    const update = () => {
      const box = root.current?.getBoundingClientRect();
      const next = readScreen(box === undefined ? null : { width: box.width, height: box.height }, embedded);
      setScreen((was) => (same(was, next) ? was : next));
    };
    for (const list of lists) list.addEventListener("change", update);
    return () => { for (const list of lists) list.removeEventListener("change", update); };
  }, [root, embedded]);
  return screen;
}
