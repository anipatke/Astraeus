import { createElement, type ReactElement } from "react";
import { SceneError } from "./errors";

/** Whether this browser or device offers WebGL 2 (the one thing the viewer draws with). Asks a fresh canvas and gives the context straight back, so probing never holds one of the browser's few contexts. A `null` or a throw is "no". */
export function hasWebgl2(): boolean {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    if (context === null || context === undefined) return false;
    (context as WebGL2RenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** The error both entry points report when `hasWebgl2` says no. */
export const noWebglError = (): SceneError =>
  new SceneError("no-webgl", "the viewer needs WebGL 2, which this browser or device has turned off or does not offer");

/** The short message that stays in the viewer's place when nothing can be drawn. */
export const noWebglMessage = (): ReactElement =>
  createElement(
    "div",
    { className: "astraeus-shell astraeus-no-webgl", "data-astraeus-no-webgl": "", role: "status" },
    "This 3D view needs WebGL, which this browser or device has turned off or does not offer.",
  );
