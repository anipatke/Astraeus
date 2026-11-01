import type { PanelBadge, StoryPanel } from "../core/storyPanels";

export {
  DEFAULT_PANEL_PAUSE_SECONDS,
  MAX_PANEL_PAUSE_SECONDS,
  PANEL_BADGES,
  parseStoryPanels,
  StoryPanelError,
  type PanelBadge,
  type PanelLookup,
  type StoryPanel,
  type StoryPanelSet,
} from "../core/storyPanels";

/**
 * The panels forward playback just passed: those with `previousMs < time <= currentMs`, in time order.
 * A backward step or no movement crosses nothing, so loops and rewinds never open a panel.
 */
export function panelsCrossed(panels: readonly StoryPanel[], previousMs: number, currentMs: number): readonly StoryPanel[] {
  if (!(currentMs > previousMs)) return [];
  return panels.filter((panel) => panel.timeUtcMs > previousMs && panel.timeUtcMs <= currentMs);
}

export const BADGE_LABELS: Readonly<Record<PanelBadge, string>> = {
  observed: "Observed",
  modelled: "Modelled",
  illustrative: "Illustrative",
};

/**
 * Decides, tick by tick, whether playback has just carried the clock across a panel. It remembers the last time it saw;
 * `rebase` moves that memory when a person seeks, so a jump is never read as playback and opens nothing.
 */
export class CrossingTracker {
  #previousMs: number;

  constructor(startMs: number) {
    this.#previousMs = startMs;
  }

  rebase(timeUtcMs: number): void {
    this.#previousMs = timeUtcMs;
  }

  /** The newest panel crossed since the last tick, or null: nothing crossed, the clock is not playing, or auto-open is off. */
  advance(panels: readonly StoryPanel[], timeUtcMs: number, playing: boolean, autoOpen: boolean): StoryPanel | null {
    const crossed = autoOpen && playing ? panelsCrossed(panels, this.#previousMs, timeUtcMs) : [];
    this.#previousMs = timeUtcMs;
    return crossed[crossed.length - 1] ?? null;
  }
}
