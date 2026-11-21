// How a part asks for a pop-up (viewer-interface note, section 9): a part reports intents (`toggle`, `close`) and never opens or closes another part.
// Job: carry one viewer's pop-up place from the shell to the parts that hold pop-ups. Per viewer (a context value, never a module global), so two viewers
// on a page keep separate state (API-03). A part drawn on its own, with no shell around it, keeps its own pop-up state.
import { createContext, useCallback, useContext, useRef } from "react";
import { POPUP_HOST_ATTRIBUTE, usePanels } from "./usePanels";

const noop = () => undefined;

export interface PopupPlace {
  /** The id of the one open pop-up, or null. */
  readonly openId: string | null;
  readonly toggle: (id: string) => void;
  readonly close: (id?: string) => void;
}

export const PopupPlaceContext = createContext<PopupPlace | null>(null);

/** The timeline's pop-ups: its events list, and a marker group (`marker-group:<key>`). The shell raises the timeline above the panels while one is open. */
export const EVENTS_POPUP = "events";
export const GROUP_POPUP = "marker-group:";

/** The viewer's pop-up place, or a local one when a part is drawn with no shell around it. */
export function usePopupPlace(): PopupPlace {
  const place = useContext(PopupPlaceContext);
  // With no shell around, the same rule (panelRule.ts) runs for this part alone; inside a shell it is off, so a viewer has one Escape and one outside-press listener.
  const none = useRef<Element | null>(null);
  const local = usePanels("wide", none, noop, place === null ? "standalone" : "off");
  return place ?? { openId: local.state.popup, toggle: local.togglePopup, close: local.closePopup };
}

/** One pop-up's handle: whether it is open, how to toggle and close it, and the attributes its host element (button and panel together) carries. */
export function usePopup(id: string) {
  const place = usePopupPlace();
  const toggle = useCallback(() => place.toggle(id), [place, id]);
  const close = useCallback(() => place.close(id), [place, id]);
  return {
    open: place.openId === id,
    toggle,
    close,
    hostProps: { [POPUP_HOST_ATTRIBUTE]: id } as Record<string, string>,
  };
}

/** The key of the open marker group, or null (a group's pop-up id is `marker-group:<key>`). */
export function openGroupKey(openId: string | null): string | null {
  return openId !== null && openId.startsWith(GROUP_POPUP) ? openId.slice(GROUP_POPUP.length) : null;
}
