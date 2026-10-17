// Scene debug output: data attributes on the canvas, frame statistics and the frame-rate readout.
import type { BodyId } from "../core/body";
import type { SimulationClock } from "../core/clock";
import { rootBodyId } from "../assets/catalogue";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import { buildDebugReadout, type DebugReadout } from "./DebugOverlay";
import type { FloatingOrigin } from "./floatingOrigin";
import type { FrameStats } from "./frameStats";
import type { GroupFill } from "./FrameRateSection";
import type { PointsView } from "./PointsView";
import type { RenderVector } from "./renderCoordinates";

/** Sets one `data-` attribute on the canvas, only when it changed (the browser scripts read these). */
export function setDatum(canvas: HTMLElement, key: string, value: string): void {
  if (canvas.dataset[key] !== value) canvas.dataset[key] = value;
}

/** What the browser scripts read back from the canvas about the body markers and the camera's up. */
export function publishSceneData(canvas: HTMLElement, state: { readonly markerBodies: readonly BodyId[]; readonly viewUp: RenderVector; readonly markerMinSpherePx: number }): void {
  setDatum(canvas, "markerBodies", state.markerBodies.join(","));
  setDatum(canvas, "cameraUp", `${state.viewUp[0].toFixed(6)},${state.viewUp[1].toFixed(6)},${state.viewUp[2].toFixed(6)}`);
  setDatum(canvas, "markerPx", String(state.markerMinSpherePx));
}

/** While Developer mode measures frames: ticks the frame timer and records each point group's refill count. */
export function recordFrameStats(stats: FrameStats | null, groupFills: GroupFill[], groupViews: readonly PointsView[]): void {
  if (stats === null) return;
  stats.tick(performance.now());
  groupViews.forEach((view, i) => {
    const fill = groupFills[i];
    if (fill === undefined) groupFills[i] = { id: view.id, count: view.fillCount };
    else fill.count = view.fillCount;
  });
}

export interface FrameReadoutInput {
  readonly pair: { readonly parent: BodyId; readonly child: BodyId } | null;
  readonly pairLabels: { readonly parent: string; readonly child: string } | undefined;
  readonly clock: SimulationClock;
  readonly resolver: StateResolver;
  readonly absoluteOf: (id: BodyId) => RenderVector;
  readonly timeUtcMs: number;
  readonly policy: ScalePolicy;
  readonly origin: FloatingOrigin;
}

/** The Developer readout for the scene's parent and child bodies; null when the scene has no such pair. */
export function buildFrameReadout(input: FrameReadoutInput): DebugReadout | null {
  const { pair, resolver, timeUtcMs } = input;
  if (pair === null) return null;
  const earthAbsolute = input.absoluteOf(pair.parent);
  const moonAbsolute = input.absoluteOf(pair.child);
  return buildDebugReadout({
    pair: input.pairLabels,
    timeUtcMs,
    rate: input.clock.rate,
    policy: input.policy,
    earth: resolver.stateOf(pair.parent, timeUtcMs, rootBodyId()),
    moonFromEarth: resolver.stateOf(pair.child, timeUtcMs, pair.parent),
    sunFromEarth: resolver.sunFrom(pair.parent, timeUtcMs),
    placed: { earthAbsolute, moonAbsolute },
    renderedDistanceUnits: Math.hypot(moonAbsolute[0] - earthAbsolute[0], moonAbsolute[1] - earthAbsolute[1], moonAbsolute[2] - earthAbsolute[2]),
    origin: input.origin,
  });
}
