import type { StoryPanel } from "../presentation/storyPanels";

export {
  checkPanelPlayback,
  checkStoryPanel,
  DEFAULT_PANEL_PAUSE_SECONDS,
  MAX_PANEL_PAUSE_SECONDS,
  resolveStoryPanels,
  StoryPanelError,
  type PanelLookup,
  type StoryPanel,
  type StoryPanelSet,
  type StoryStep,
  neighbourStep,
} from "../presentation/storyPanels";

/**
 * The panels forward playback just passed: those with `previousMs < time <= currentMs`, in time order.
 * A backward step or no movement crosses nothing, so loops and rewinds never open a panel.
 */
export function panelsCrossed(panels: readonly StoryPanel[], previousMs: number, currentMs: number): readonly StoryPanel[] {
  if (!(currentMs > previousMs)) return [];
  return panels.filter((panel) => panel.timeUtcMs > previousMs && panel.timeUtcMs <= currentMs);
}

/** A moment panel's close moment (`timeUtcMs` plus its span: the panel's own `closeAfterSeconds`, else the playback's), or null when it has no span and never closes. */
export function panelCloseMs(panel: Pick<StoryPanel, "timeUtcMs" | "closeAfterSeconds">, playbackSpan: number | undefined): number | null {
  const span = panel.closeAfterSeconds ?? playbackSpan;
  return span === undefined ? null : panel.timeUtcMs + span * 1000;
}

/** Whether a panel opening with the clock at `atMs` is one the close applies to: the clock is still before its close moment (or it has none). A panel opened at or past its close moment stays open until closed. */
export function panelArmedAt(panel: Pick<StoryPanel, "timeUtcMs" | "closeAfterSeconds">, playbackSpan: number | undefined, atMs: number): boolean {
  const closeMs = panelCloseMs(panel, playbackSpan);
  return closeMs === null || atMs < closeMs;
}

/**
 * Whether an open moment panel closes on this tick: it is `armed` (it opened while the clock was before its close moment), the clock moves forward (`previousMs < currentMs`, playing or just stopped after playing)
 * and ends at or past the close moment. It is a state test, not a crossing, so a span shorter than one frame still closes on a later tick; the caller never asks on the tick that opened the panel.
 * With no span it never closes; a seek, a rewind, a pause or no movement closes nothing.
 */
export function panelSpanPassed(panel: Pick<StoryPanel, "timeUtcMs" | "closeAfterSeconds">, playbackSpan: number | undefined, previousMs: number, currentMs: number, moving: boolean, armed = true): boolean {
  const closeMs = panelCloseMs(panel, playbackSpan);
  if (closeMs === null || !armed || !moving || !(currentMs > previousMs)) return false;
  return currentMs >= closeMs;
}

/**
 * Decides, tick by tick, whether playback has just carried the clock across a panel. It remembers the last time it saw;
 * `rebase` moves that memory when a person seeks, so a jump is never read as playback and opens nothing.
 */
export class CrossingTracker {
  #previousMs: number;
  #wasPlaying = false;

  constructor(startMs: number) {
    this.#previousMs = startMs;
  }

  /** Whether the next tick counts as playback (the clock was playing on the last one); with `previousMs`, what `panelSpanPassed` needs before `advance` moves them. */
  get wasPlaying(): boolean { return this.#wasPlaying; }
  get previousMs(): number { return this.#previousMs; }
  /** The clock as the panel logic knows it: rebased by a seek, moved on by every tick. A panel's arming reads this, so one opened right after a jump counts the clock it jumped to. */
  get timeUtcMs(): number { return this.#previousMs; }

  rebase(timeUtcMs: number): void {
    this.#previousMs = timeUtcMs;
    this.#wasPlaying = false;
  }

  /**
   * The newest panel crossed since the last tick, or null: nothing crossed, the clock is not playing, or auto-open is off.
   * A tick that finds the clock stopped but saw it playing on the last tick counts as playback too, so a stop on the timeline's end opens the panel there.
   */
  advance(panels: readonly StoryPanel[], timeUtcMs: number, playing: boolean, autoOpen: boolean): StoryPanel | null {
    const crossed = autoOpen && (playing || this.#wasPlaying) ? panelsCrossed(panels, this.#previousMs, timeUtcMs) : [];
    this.#previousMs = timeUtcMs;
    this.#wasPlaying = playing;
    return crossed[crossed.length - 1] ?? null;
  }
}
