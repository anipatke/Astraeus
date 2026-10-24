import { lazy, type ComponentType } from "react";

/**
 * The developer panels, loaded on demand: `./DeveloperSettings` (and the debug
 * readout and frame-rate graph it draws) is fetched only when the Developer
 * switch is on and a panel is first drawn. Draw each inside a `Suspense`.
 */
type Panels = typeof import("./DeveloperSettings");

function onDemand<K extends keyof Panels>(name: K): Panels[K] {
  const Lazy = lazy(() => import("./DeveloperSettings").then((module) => ({ default: module[name] as unknown as ComponentType<object> })));
  return Lazy as unknown as Panels[K];
}

export const StoryPanelSettings = onDemand("StoryPanelSettings");
export const MoonsAndRingsSettings = onDemand("MoonsAndRingsSettings");
export const SkyAndSunSettings = onDemand("SkyAndSunSettings");
export const LabelSettings = onDemand("LabelSettings");
export const ViewLinkReadout = onDemand("ViewLinkReadout");
export const UnderTheHoodSettings = onDemand("UnderTheHoodSettings");
