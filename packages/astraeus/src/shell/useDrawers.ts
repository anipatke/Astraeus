import { useEffect, useState, type RefObject } from "react";
import { keyIsForViewer } from "./viewerKeys";

export interface Drawers {
  readonly controlsOpen: boolean;
  readonly timelineOpen: boolean;
  readonly openControls: (open: boolean) => void;
  readonly openTimeline: (open: boolean) => void;
}

/**
 * The phone's two drawers (controls and timeline). They share the screen, so opening one closes the other, and Escape closes both on a phone (when pressed inside this viewer, `viewer` being its root, or on the bare page).
 * `onControlsOpened` runs when the controls drawer opens, for whatever else wants the same screen.
 */
export function useDrawers(phone: boolean, viewer: RefObject<Element | null>, onControlsOpened: () => void): Drawers {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const openControls = (open: boolean) => {
    setControlsOpen(open);
    if (open) {
      setTimelineOpen(false);
      onControlsOpened();
    }
  };
  const openTimeline = (open: boolean) => { setTimelineOpen(open); if (open) setControlsOpen(false); };
  useEffect(() => {
    if (!phone || (!controlsOpen && !timelineOpen)) return undefined;
    const onKey = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape" && keyIsForViewer(event, viewer.current)) { setControlsOpen(false); setTimelineOpen(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phone, controlsOpen, timelineOpen]);
  return { controlsOpen, timelineOpen, openControls, openTimeline };
}
