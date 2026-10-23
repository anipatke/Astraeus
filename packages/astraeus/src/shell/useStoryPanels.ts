import { useCallback, useEffect, useRef, useState } from "react";
import type { ClockSnapshot } from "../core/clock";
import { CrossingTracker, type StoryPanel } from "./storyPanels";

export interface StoryPanelSettings {
  readonly autoOpen: boolean;
  readonly pauseSeconds: number;
}

/**
 * Which story panel is open and whether playback is held for it. A panel opens by itself only when forward playback
 * carries the clock across its time; a seek (slider, Previous, Next, a link) re-bases the crossing check and opens nothing.
 * Only one panel is open at a time: the newest replaces the one before.
 */
export function useStoryPanels(
  panels: readonly StoryPanel[],
  settings: StoryPanelSettings,
  snapshot: ClockSnapshot,
  setPlaying: ((playing: boolean) => void) | undefined,
) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const tracker = useRef(new CrossingTracker(snapshot.timeUtcMs));
  const latest = useRef({ panels, settings, snapshot, setPlaying, holding });
  latest.current = { panels, settings, snapshot, setPlaying, holding };

  useEffect(() => {
    const { panels: list, settings: now, snapshot: shot, setPlaying: control } = latest.current;
    const newest = tracker.current.advance(list, shot.timeUtcMs, shot.playing, now.autoOpen);
    if (newest === null) return;
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
  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => {
    setOpenId(null);
    if (latest.current.holding) latest.current.setPlaying?.(true);
    setHolding(false);
  }, []);
  const continuePlayback = useCallback(() => {
    setHolding(false);
    latest.current.setPlaying?.(true);
  }, []);

  return { openPanel: panels.find((panel) => panel.id === openId) ?? null, holding, open, close, continuePlayback, noteSeek };
}
