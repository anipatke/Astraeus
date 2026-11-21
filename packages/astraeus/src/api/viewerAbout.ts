import { callListeners } from "./listeners";
import { checkedAbout, type AboutInput } from "./aboutInput";
import type { LinkAccess } from "./viewerLink";
import type { ViewerControl } from "../app/viewerPort";

/** The host link's About: the live About read and replaced. The viewer draws the bar's title and its panel from here; a replace is not a signal to the host. */
export class ViewerAbout {
  /** The viewer's own redraw callbacks (the About changed). */
  readonly #watchers = new Set<() => void>();
  #about: AboutInput | undefined;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (the scene's own About, if any, is the live one) or detached (nothing). */
  reset(control: ViewerControl | undefined): void {
    this.#about = control?.about;
    this.#tell();
  }

  /** The About now; undefined before the viewer is drawn, after it is gone and in a scene with none (until the host sets one). */
  get about(): AboutInput | undefined { return this.#about; }

  /** The viewer redraws when the About changes; returns the function that stops it. */
  watch(watcher: () => void): () => void {
    this.#watchers.add(watcher);
    return () => { this.#watchers.delete(watcher); };
  }

  /** Replaces the whole About (checked as `Scene.setAbout` checks it, `bad-about`); before the viewer is drawn or after it is gone, `not-mounted`. */
  setAbout(input: AboutInput): void {
    this.access.open("setAbout");
    this.#about = checkedAbout(input, "setAbout");
    this.#tell();
  }

  #tell(): void { callListeners(this.#watchers, undefined); }
}
