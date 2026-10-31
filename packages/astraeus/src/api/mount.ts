import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "../app/style.css";
import { App } from "../app/App";
import { SceneError } from "./errors";
import { prepareScene } from "./prepared";
import type { DataSource, Scene } from "./scene";
import type { TimeInput } from "./time";
import { ViewerLink, type ViewerChange } from "./viewerLink";

/** Options of `mount`. */
export interface MountOptions {
  /** Data packages the scene's bodies need, such as moon pictures or positions; nothing is looked up behind the caller's back. */
  readonly data?: readonly DataSource[];
  /** Called whenever the viewer's time, speed or playing state changes: playback running, a visitor using the timeline, or the host's own `setTime` / `setRate`. About ten times a second while playing. */
  readonly onChange?: (change: ViewerChange) => void;
}

/** What `mount` returns. */
export interface MountedScene {
  /** Resolves once the scene's data has loaded and it is drawn; rejects if loading failed. */
  readonly ready: Promise<void>;
  /** Removes the scene, its canvas and its listeners from the page. Safe to call twice. */
  unmount(): void;
  /** The viewer's time in Unix milliseconds UTC; undefined until `ready` has resolved and after `unmount`. */
  readonly time: number | undefined;
  /** The playback speed (simulated seconds per real second); undefined like `time`. */
  readonly rate: number | undefined;
  /** Moves the viewer to `time` (ISO text, a `Date` or Unix milliseconds). Outside the timeline throws `bad-time`; before `ready` or after `unmount` throws `missing-data`. */
  setTime(time: TimeInput): void;
  /** Sets the playback speed to one of the speeds the timeline offers (`setTimeline({ rates })`); any other number throws `bad-timeline`. Before `ready` or after `unmount` throws `missing-data`. */
  setRate(rate: number): void;
  /** Calls `listener` on every change (see `MountOptions.onChange`); returns the function that stops it. No callbacks arrive after `unmount`. */
  onChange(listener: (change: ViewerChange) => void): () => void;
}

/**
 * Draws `scene` into `element` with the full viewer. The caller writes no React. The element needs a size.
 * @example
 * import { Scene, earth, moon, mount } from "astraeus";
 * const scene = new Scene().addBody(earth).addBody(moon, { orbit: true });
 * const mounted = mount(document.getElementById("app")!, scene);
 * await mounted.ready; // drawn
 * mounted.setTime("2026-08-12T21:00:00Z"); // the viewer moves there; outside the timeline throws bad-time
 * mounted.onChange(({ time, rate }) => console.log(new Date(time).toISOString(), rate));
 * mounted.unmount();   // removes it again
 */
export function mount(element: HTMLElement, scene: Scene, options: MountOptions = {}): MountedScene {
  if (!(element instanceof Object) || typeof element.appendChild !== "function") throw new SceneError("bad-element", "mount: the first argument must be an element of the page");
  const { definition, ready: loaded } = prepareScene(scene, options.data);
  // Its own stacking context, so the viewer's z-index values cannot rise above the host page's overlays.
  element.style.isolation = "isolate";
  const root = createRoot(element);
  let open = true;
  const link = new ViewerLink();
  if (options.onChange !== undefined) link.onChange(options.onChange);
  const ready = loaded.then(() => {
    if (open) root.render(createElement(App, { definition, writeTitle: false, host: link }));
  });
  return {
    ready,
    get time() { return link.time; },
    get rate() { return link.rate; },
    setTime: (time) => link.setTime(time),
    setRate: (rate) => link.setRate(rate),
    onChange: (listener) => link.onChange(listener),
    unmount() {
      if (!open) return;
      open = false;
      link.close();
      root.unmount();
    },
  };
}
