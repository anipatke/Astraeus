import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "../app/style.css";
import { App } from "../app/App";
import { makeContainingBlock } from "./containingBlock";
import { SceneError } from "./errors";
import { prepareScene } from "./prepared";
import type { DataSource, Scene } from "./scene";
import { viewerHandleOf, type ViewerHandle } from "./viewerHandle";
import { ViewerLink, type ViewerChange } from "./viewerLink";

/** Options of `mount`. */
export interface MountOptions {
  /** Data packages the scene's bodies need, such as moon pictures or positions; nothing is looked up behind the caller's back. */
  readonly data?: readonly DataSource[];
  /** Called whenever the viewer's time, speed or playing state changes: playback running, a visitor using the timeline, or the host's own `setTime` / `setRate` / `setView`. About ten times a second while playing. */
  readonly onChange?: (change: ViewerChange) => void;
  /** Whether the viewer reads the page address and offers a copy-link button that writes it (default false: the address stays the host page's own). See the README's "Page address" section. */
  readonly address?: boolean;
  /** Whether the viewer shows the Developer toggle and drawer (default false: an outside page gets no developer cog and the drawer's code is never fetched). The "Copy view link" button lives in the drawer, so `address: true` without this has no copy button. A switch placed `"developer"` shows only when this is on. */
  readonly developerTools?: boolean;
}

/** What `mount` returns: the viewer handle plus `ready` and `unmount`. */
export interface MountedScene extends ViewerHandle {
  /** Resolves once the scene's data has loaded, it is drawn and the host link is attached, so `time`, `rate`, `view` and every set call work from then on. Rejects with its own error if loading failed, and with `SceneError` `not-mounted` if `unmount` came first; it never stays pending. */
  readonly ready: Promise<void>;
  /** Removes the scene, its canvas and its listeners from the page. Safe to call twice. */
  unmount(): void;
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
  // The viewer's root fills this element (position: absolute; inset: 0), so the element is its containing block; the viewer no longer styles the host's #app.
  makeContainingBlock(element);
  const root = createRoot(element);
  let open = true;
  const link = new ViewerLink();
  if (options.onChange !== undefined) link.onChange(options.onChange);
  // Resolves once the viewer has attached its clock (its effect runs after the render), so every handle call works straight after `await ready`.
  const attached = loaded.then(() => {
    if (!open) throw new SceneError("not-mounted", "mount: unmounted before the viewer was drawn");
    root.render(createElement(App, { definition, writeTitle: false, address: options.address === true, developerTools: options.developerTools === true, host: link }));
    return link.whenAttached();
  });
  // Only the expected "taken down early" rejection (`not-mounted`) is marked handled, so a host that never awaits `ready` is not sent an unhandled rejection for it;
  // any other rejection (a failed load) stays unhandled until someone awaits `ready`, as before. Whoever awaits `ready` hears either error.
  const ready: Promise<void> = new Promise<void>((resolve, reject) => {
    attached.then(resolve, (error: unknown) => {
      reject(error);
      if (error instanceof SceneError && error.code === "not-mounted") ready.catch(() => undefined);
    });
  });
  // The shared handle is the prototype (a spread would copy its getters' values once); `ready` and `unmount` are this handle's own.
  return Object.assign(Object.create(viewerHandleOf(link)) as ViewerHandle, {
    ready,
    unmount() {
      if (!open) return;
      open = false;
      link.close();
      root.unmount();
    },
  });
}
