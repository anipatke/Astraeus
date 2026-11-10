import type { ViewerChangeCause, ViewerState } from "../app/viewerPort";
import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import type { LinkAccess } from "./viewerLink";

/** What a host is told when the viewer's selected object changes. */
export interface SelectionChange {
  /** The id of the newly selected object; absent when the selection was dropped and nothing took its place. */
  readonly object?: string;
  /** The viewer's time at the report, Unix milliseconds UTC. */
  readonly timeUtcMs: number;
  /** `visitor`: the object menu, a click, or a clock or view change the visitor made; `host`: a host call (`setSelected`, or `setTime`, `setRate`, `setPlaying`, `setView`) moved the clock or view and the selection followed; `playback`: the clock running moved it. */
  readonly cause: ViewerChangeCause;
}

/** The host link's selection: the selected object read and the `onSelect` callbacks. */
export class ViewerSelection {
  readonly #listeners = new Set<(change: SelectionChange) => void>();
  /** The selection last read or reported; meaningful only while `#known` (the viewer is attached). */
  #last: string | undefined;
  #known = false;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (its first reading: the opening selection is read, not reported) or detached (undefined). */
  reset(first: ViewerState | undefined): void {
    this.#known = first !== undefined;
    this.#last = first?.selected;
  }

  clearListeners(): void { this.#listeners.clear(); }

  /** The id of the selected object; undefined before the viewer is drawn, after it is gone and when nothing is selected. */
  get selected(): string | undefined { return this.access.control()?.read().selected; }

  /**
   * Selects an object the showing view shows, or a sky figure (`handle.skyFigures`), or clears the selection with `undefined`; the caller then publishes it as a host change (`onSelect` with `cause: "host"`; nothing is reported when the selection is already that).
   * Any other id (unknown, hidden by the showing view, empty) or a non-string throws `bad-selection`; before the viewer is drawn or after it is gone, `not-mounted`.
   */
  setSelected(id: unknown): void {
    const control = this.access.open("setSelected");
    if (id !== undefined) {
      const shown = [...control.cameraTargets(), ...(control.skyFigures ?? []).map((figure) => figure.id)];
      if (typeof id !== "string" || !shown.includes(id)) {
        throw new SceneError("bad-selection", `setSelected: ${typeof id === "string" ? `"${id}"` : String(id)} is not an object the showing view shows, or a sky figure (${shown.join(", ")}); give one of them, or undefined to clear`);
      }
    }
    control.setSelected(id);
  }

  /** Calls `listener` when the selected object changes; returns the function that stops it. */
  onSelect(listener: (change: SelectionChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    if (!this.#known || state.selected === this.#last) return;
    this.#last = state.selected;
    callListeners(this.#listeners, { ...(state.selected === undefined ? {} : { object: state.selected }), timeUtcMs: state.timeUtcMs, cause });
  }
}
