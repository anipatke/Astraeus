import type { StoryPanel } from "../core/storyPanels";

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
} from "../core/storyPanels";

/**
 * The panels forward playback just passed: those with `previousMs < time <= currentMs`, in time order.
 * A backward step or no movement crosses nothing, so loops and rewinds never open a panel.
 */
export function panelsCrossed(panels: readonly StoryPanel[], previousMs: number, currentMs: number): readonly StoryPanel[] {
  if (!(currentMs > previousMs)) return [];
  return panels.filter((panel) => panel.timeUtcMs > previousMs && panel.timeUtcMs <= currentMs);
}

/**
 * Whether forward playback just carried the clock past a panel's close time (`timeUtcMs + span`): `previousMs < close <= currentMs` while the clock is moving.
 * The span is the panel's own `closeAfterSeconds`, else the playback's; with neither it never closes. A seek, a rewind, a pause or no movement closes nothing.
 */
export function panelSpanPassed(panel: Pick<StoryPanel, "timeUtcMs" | "closeAfterSeconds">, playbackSpan: number | undefined, previousMs: number, currentMs: number, moving: boolean): boolean {
  const span = panel.closeAfterSeconds ?? playbackSpan;
  if (span === undefined || !moving || !(currentMs > previousMs)) return false;
  const closeMs = panel.timeUtcMs + span * 1000;
  return closeMs > previousMs && closeMs <= currentMs;
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
