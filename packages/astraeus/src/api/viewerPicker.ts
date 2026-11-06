import { callListeners } from "./listeners";
import { SceneError } from "./errors";
import type { PickChange } from "./pickerInput";
import type { LinkAccess } from "./viewerLink";
import type { ViewerControl } from "../app/viewerPort";

/** The host link's picker: the pressed option read and moved, and the `onPick` callbacks a visitor's press calls. The viewer draws the pressed option from here and moves nothing itself. */
export class ViewerPicker {
  readonly #listeners = new Set<(change: PickChange) => void>();
  /** The viewer's own redraw callbacks (the pressed option moved). */
  readonly #watchers = new Set<() => void>();
  #pressed: string | undefined;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (the scene's own starting option is pressed) or detached (nothing). */
  reset(control: ViewerControl | undefined): void {
    this.#pressed = control?.picker?.start;
    this.#tell();
  }

  clearListeners(): void { this.#listeners.clear(); }

  /** The value of the pressed option; undefined before the viewer is drawn, after it is gone and in a scene without a picker. */
  get pick(): string | undefined { return this.#pressed; }

  /** The viewer redraws when the pressed option moves; returns the function that stops it. */
  watch(watcher: () => void): () => void {
    this.#watchers.add(watcher);
    return () => { this.#watchers.delete(watcher); };
  }

  /** Moves the pressed option; no signal. A scene without a picker, or an unknown value, throws `bad-picker`. */
  setPick(value: string): void {
    const picker = this.access.open("setPick").picker;
    if (picker === undefined) throw new SceneError("bad-picker", "setPick: the scene has no picker; call Scene.setPicker first");
    if (!picker.values.includes(value)) throw new SceneError("bad-picker", `setPick: "${String(value)}" is not one of the picker's options (${picker.values.join(", ")})`);
    this.#pressed = value;
    this.#tell();
  }

  /** Calls `listener` when a visitor presses an option other than the pressed one; returns the function that stops it. */
  onPick(listener: (change: PickChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  /** A visitor pressed an option (the viewer only calls this for one that is not pressed). The pressed option stays where it is. */
  press(value: string): void {
    const picker = this.access.control()?.picker;
    if (picker === undefined || value === this.#pressed) return;
    callListeners(this.#listeners, { picker: picker.id, value });
  }

  #tell(): void { callListeners(this.#watchers, undefined); }
}
