// Applies the panel rule (panelRule.ts) for one viewer. Job: hold the open-panel state, and be the viewer's one Escape listener and one outside-press listener.
// It must not decide what opens or closes (the rule does) and must not know a panel's content. State is per viewer (API-03): nothing here is module-level.
import { useCallback, useEffect, useReducer, useRef, type RefObject } from "react";
import { keyIsForViewer, VIEWER_ROOT_CLASS } from "../viewerKeys";
import { NO_PANELS, reducePanels, topmost, type Layout, type Occupant, type PanelState } from "./panelRule";

/** Marks the element holding a pop-up and its button; a press inside the open pop-up's host is not an outside press. */
export const POPUP_HOST_ATTRIBUTE = "data-popup-host";
/** The host name of the menu (its button and drop-down): a press on either is not outside it. */
export const MENU_HOST = "menu";

export interface Panels {
  readonly state: PanelState;
  readonly open: (occupant: Occupant) => void;
  readonly close: (occupant: Occupant) => void;
  readonly toggle: (occupant: Occupant) => void;
  readonly set: (occupant: Occupant, open: boolean) => void;
  readonly openPopup: (id: string) => void;
  readonly closePopup: (id?: string) => void;
  readonly togglePopup: (id: string) => void;
  readonly chooseInDrawer: (drawer: "menu" | "timeline") => void;
  readonly viewSwitch: (dropsCard: boolean, dropsStory: boolean, dropsShelf?: boolean) => void;
}

/**
 * `onEscapeClosed` is told which occupant Escape closed, for those whose own state lives elsewhere (the story panel's timing, the host-owned developer mode).
 * `scope` "standalone" is for a part drawn with no shell around it (a test): it hears the whole page. "off" attaches no listeners (the shell's own rule is in force).
 * `viewer` is any element inside this viewer: a key or press elsewhere on the page that is not in this viewer is not this viewer's.
 */
export function usePanels(layout: Layout, viewer: RefObject<Element | null>, onEscapeClosed: (occupant: Occupant) => void, scope: "viewer" | "standalone" | "off" = "viewer"): Panels {
  const [state, dispatch] = useReducer((now: PanelState, action: Parameters<typeof reducePanels>[1]) => reducePanels(now, action, layout), NO_PANELS);
  const latest = useRef({ state, onEscapeClosed, layout });
  latest.current = { state, onEscapeClosed, layout };

  useEffect(() => {
    if (scope === "off") return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape" || (scope === "viewer" && !keyIsForViewer(event, viewer.current))) return;
      const top = topmost(latest.current.state);
      if (top === null) return;
      dispatch({ type: "escape" });
      if (top.occupant !== "popup") latest.current.onEscapeClosed(top.occupant);
    };
    const onPress = (event: PointerEvent) => {
      const { state: now, layout: shown } = latest.current;
      const open = now.popup ?? (shown === "wide" && now.menu ? MENU_HOST : null);
      if (open === null) return;
      // A press inside the menu (a control nested in it has its own host) is not outside it.
      const host = event.target instanceof Element ? event.target.closest(open === MENU_HOST ? `[${POPUP_HOST_ATTRIBUTE}="${MENU_HOST}"]` : `[${POPUP_HOST_ATTRIBUTE}]`) : null;
      const mine = host !== null && (scope === "standalone" || (viewer.current?.closest(`.${VIEWER_ROOT_CLASS}`)?.contains(host) ?? false));
      if (mine && host.getAttribute(POPUP_HOST_ATTRIBUTE) === open) return;
      dispatch({ type: "outsidePress" });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPress); };
  }, [viewer, scope]);

  const open = useCallback((occupant: Occupant) => dispatch({ type: "open", occupant }), []);
  const close = useCallback((occupant: Occupant) => dispatch({ type: "close", occupant }), []);
  const openPopup = useCallback((id: string) => dispatch({ type: "openPopup", id }), []);
  const closePopup = useCallback((id?: string) => dispatch(id === undefined ? { type: "closePopup" } : { type: "closePopup", id }), []);
  const chooseInDrawer = useCallback((drawer: "menu" | "timeline") => dispatch({ type: "chooseInDrawer", drawer }), []);
  const viewSwitch = useCallback((dropsCard: boolean, dropsStory: boolean, dropsShelf = false) => dispatch({ type: "viewSwitch", dropsCard, dropsStory, dropsShelf }), []);
  const toggle = useCallback((occupant: Occupant) => dispatch(latestOpen(latest.current.state, occupant) ? { type: "close", occupant } : { type: "open", occupant }), []);
  const set = useCallback((occupant: Occupant, wanted: boolean) => dispatch({ type: wanted ? "open" : "close", occupant }), []);
  const togglePopup = useCallback((id: string) => dispatch(latest.current.state.popup === id ? { type: "closePopup", id } : { type: "openPopup", id }), []);
  return { state, open, close, toggle, set, openPopup, closePopup, togglePopup, chooseInDrawer, viewSwitch };
}

function latestOpen(state: PanelState, occupant: Occupant): boolean {
  switch (occupant) {
    case "story":
    case "developer":
    case "menu":
    case "timeline": return state[occupant];
    // The left place's occupants (About, the card, moons, a shelf panel).
    default: return state.left === occupant;
  }
}

/**
 * Mirrors the two occupants whose own state lives elsewhere into the rule: the story panel (its timing is useStoryPanels') and the developer panel (its mode is the host's).
 * When the rule closes the developer panel (a phone detail sheet opened over it), the host's mode follows.
 */
export function useMirroredPanels(panels: Panels, storyOpen: boolean, developerMode: boolean, onDeveloperModeChange: (enabled: boolean) => void): void {
  const { set } = panels;
  useEffect(() => set("story", storyOpen), [set, storyOpen]);
  useEffect(() => set("developer", developerMode), [set, developerMode]);
  const wasOpen = useRef(false);
  const developerOpen = panels.state.developer;
  useEffect(() => {
    if (wasOpen.current && !developerOpen && developerMode) onDeveloperModeChange(false);
    wasOpen.current = developerOpen;
    // Only the rule's change of the developer panel is followed; the mode and its setter are read as they are then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerOpen]);
}
