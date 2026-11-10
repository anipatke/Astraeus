import type { ViewerChangeCause, ViewerState } from "../app/viewerPort";
import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import type { LinkAccess } from "./viewerLink";

/** What a host is told when the open story panel changes. */
export interface PanelChange {
  /** The panel now open; absent when it closed. */
  readonly panel?: string;
  /** The viewer's time, Unix milliseconds UTC. */
  readonly timeUtcMs: number;
  /** `visitor`, `host` (`setPanel`, or a drop by the host's `setView`) or `playback` (a moment panel opened by itself). */
  readonly cause: ViewerChangeCause;
}

/** The host link's story panel: the open panel read, `setPanel` checked and the `onPanel` callbacks. */
export class ViewerPanels {
  readonly #listeners = new Set<(change: PanelChange) => void>();
  /** The panel last read or reported; meaningful only while `#known` (the viewer is attached). */
  #last: string | undefined;
  #known = false;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (its first reading: the opening panel is read, not reported) or detached (undefined). */
  reset(first: ViewerState | undefined): void {
    this.#known = first !== undefined;
    this.#last = first?.panel;
  }

  clearListeners(): void { this.#listeners.clear(); }

  /** The id of the open story panel; undefined before the viewer is drawn, after it is gone and when none is open. */
  get panel(): string | undefined { return this.access.control()?.read().panel; }

  /** Opens a story panel the showing view shows, or closes the open one with `undefined`; the caller then publishes it as a host change. Any other id throws `bad-panels`; before the viewer is drawn or after it is gone, `not-mounted`. */
  setPanel(id: unknown): void {
    const control = this.access.open("setPanel");
    if (id !== undefined) {
      const shown = control.panels();
      if (typeof id !== "string" || !shown.includes(id)) {
        throw new SceneError("bad-panels", `setPanel: ${typeof id === "string" ? `"${id}"` : String(id)} is not a story panel the showing view shows (${shown.join(", ")}); give one of them, or undefined to close the open one`);
      }
    }
    control.setPanel(id);
  }

  onPanel(listener: (change: PanelChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    if (!this.#known || state.panel === this.#last) return;
    this.#last = state.panel;
    callListeners(this.#listeners, { ...(state.panel === undefined ? {} : { panel: state.panel }), timeUtcMs: state.timeUtcMs, cause });
  }
}
