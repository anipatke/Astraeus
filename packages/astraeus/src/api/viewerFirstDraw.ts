import { callListeners } from "./listeners";

/** The host link's first-frame signal: the `onFirstDraw` callbacks and whether the viewer on show has drawn its first frame. */
export class ViewerFirstDraw {
  readonly #listeners = new Set<() => void>();
  #drawn = false;

  clearListeners(): void { this.#listeners.clear(); }

  /** The viewer is going away (or being rebuilt): the next one has drawn nothing yet. */
  reset(): void { this.#drawn = false; }

  /**
   * Calls `listener()` once when a scene's first frame has been drawn; returns the function that stops it. A listener added after that frame is called at once, so one added after `ready` is not left waiting.
   * A viewer rebuild (`AstraeusScene` given a new scene) draws a new first frame, which calls the listeners that are still added again.
   */
  onFirstDraw(listener: () => void): () => void {
    this.#listeners.add(listener);
    if (this.#drawn) callListeners(new Set([listener]), undefined);
    return () => { this.#listeners.delete(listener); };
  }

  /** The scene drew its first frame. */
  publish(): void {
    if (this.#drawn) return;
    this.#drawn = true;
    callListeners(this.#listeners, undefined);
  }
}
