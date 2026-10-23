import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "../app/style.css";
import { App } from "../app/App";
import { SceneError } from "./errors";
import type { DataSource, Scene } from "./scene";

export interface MountOptions {
  /** Data packages the scene's bodies need, such as moon pictures or positions; nothing is looked up behind the caller's back. */
  readonly data?: readonly DataSource[];
}

/** What `mount` returns. */
export interface MountedScene {
  /** Resolves once the scene's data has loaded and it is drawn; rejects if loading failed. */
  readonly ready: Promise<void>;
  /** Removes the scene, its canvas and its listeners from the page. Safe to call twice. */
  unmount(): void;
}

/** Draws `scene` into `element` with the full viewer. The caller writes no React. */
export function mount(element: HTMLElement, scene: Scene, options: MountOptions = {}): MountedScene {
  if (!(element instanceof Object) || typeof element.appendChild !== "function") throw new SceneError("bad-element", "mount: the first argument must be an element of the page");
  const definition = scene.toDefinition(options.data ?? []);
  const root = createRoot(element);
  let open = true;
  const ready = (definition.prepare?.() ?? Promise.resolve()).then(() => {
    if (open) root.render(createElement(App, { definition }));
  });
  return {
    ready,
    unmount() {
      if (!open) return;
      open = false;
      root.unmount();
    },
  };
}
