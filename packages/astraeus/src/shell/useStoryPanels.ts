import { useCallback, useEffect, useRef, useState } from "react";
import type { ClockSnapshot } from "../core/clock";
import { CrossingTracker, type StoryPanel, type StoryStep } from "./storyPanels";

export interface StoryPanelSettings {
  readonly autoOpen: boolean;
  readonly pauseSeconds: number;
}

/** Who opened or closed the panel: the visitor, the host, playback crossing a panel, or a move (a view switch dropped it; the link names whatever last moved the view). */
export type PanelCause = "visitor" | "host" | "playback" | "move";

/**
 * Which story panel is open and whether playback is held for it. A panel opens by itself only when forward playback
 * carries the clock across its time; a seek (slider, Previous, Next, a link) re-bases the crossing check and opens nothing.
 * Only one panel is open at a time: the newest replaces the one before. A step never opens from playback; with steps and no moment panel the first step is open at the start.
 */
export function useStoryPanels(
  panels: readonly StoryPanel[],
  steps: readonly StoryStep[],
  settings: StoryPanelSettings,
  snapshot: ClockSnapshot,
  setPlaying: ((playing: boolean) => void) | undefined,
) {
  const [openId, setOpenId] = useState<string | null>(() => (panels.length === 0 ? steps[0]?.id ?? null : null));
  const cause = useRef<PanelCause>("visitor");
  const [holding, setHolding] = useState(false);
  const tracker = useRef(new CrossingTracker(snapshot.timeUtcMs));
  const latest = useRef({ panels, settings, snapshot, setPlaying, holding });
  latest.current = { panels, settings, snapshot, setPlaying, holding };

  useEffect(() => {
    const { panels: list, settings: now, snapshot: shot, setPlaying: control } = latest.current;
    const newest = tracker.current.advance(list, shot.timeUtcMs, shot.playing, now.autoOpen);
    if (newest === null) return;
    cause.current = "playback";
    setOpenId(newest.id);
    if (now.pauseSeconds > 0 && control !== undefined) {
      control(false);
      setHolding(true);
    }
  }, [snapshot.timeUtcMs]);

  // A person who presses Play during the hold has taken over.
  useEffect(() => {
    if (holding && snapshot.playing) setHolding(false);
  }, [holding, snapshot.playing]);

  useEffect(() => {
    if (!holding) return undefined;
    const timer = window.setTimeout(() => {
      setHolding(false);
      latest.current.setPlaying?.(true);
    }, settings.pauseSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [holding, openId, settings.pauseSeconds]);

  const noteSeek = useCallback((timeUtcMs: number) => {
    tracker.current.rebase(timeUtcMs);
    setHolding(false);
  }, []);
  const open = useCallback((id: string, by: PanelCause = "visitor") => { cause.current = by; setOpenId(id); }, []);
  const close = useCallback((by: PanelCause = "visitor") => {
    cause.current = by;
    setOpenId(null);
    if (latest.current.holding) latest.current.setPlaying?.(true);
    setHolding(false);
  }, []);
  const continuePlayback = useCallback(() => {
    setHolding(false);
    latest.current.setPlaying?.(true);
  }, []);

  const openPanel: StoryPanel | StoryStep | null = panels.find((panel) => panel.id === openId) ?? steps.find((step) => step.id === openId) ?? null;
  return { openPanel, holding, open, close, continuePlayback, noteSeek, cause: openPanel === null && openId !== null ? "move" as const : cause.current };
}
