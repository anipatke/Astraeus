// Scene debug output: data attributes on the canvas, frame statistics and the frame-rate readout.
import type { BodyId } from "../core/body";
import type { SimulationClock } from "../core/clock";
import { rootBodyId } from "../assets/catalogue";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import type { Camera } from "three";
import type { PathView } from "./PathView";
import type { BodyScreenReadout } from "./sceneBodies";
import { buildDebugReadout, type DebugReadout } from "./debugReadout";
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

/**
 * What the browser scripts read back about every drawn path line (`data-paths`, JSON): per path its id, whether it is drawn, its vertex count, how many
 * vertices are in view and the share of the view they span (with the box's edges, the major axis angle on screen and the view's aspect), and for an orbit its look in force. This is the line itself, so a check that a path is drawn never depends on its label.
 */
export function publishPathData(canvas: HTMLElement, views: readonly PathView[], camera: Camera): void {
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  const paths = views.map((view) => {
    const r = view.screenReadout(camera);
    const none = r.inView === 0;
    return { id: r.id, visible: r.visible, vertices: r.vertices, inView: r.inView, spanX: none ? 0 : round(r.maxX - r.minX), spanY: none ? 0 : round(r.maxY - r.minY), minX: none ? 0 : round(r.minX), maxX: none ? 0 : round(r.maxX), minY: none ? 0 : round(r.minY), maxY: none ? 0 : round(r.maxY), lineMinX: r.lineMinX > r.lineMaxX ? null : round(r.lineMinX), lineMaxX: r.lineMinX > r.lineMaxX ? null : round(r.lineMaxX), lineMinY: r.lineMinY > r.lineMaxY ? null : round(r.lineMinY), lineMaxY: r.lineMinY > r.lineMaxY ? null : round(r.lineMaxY), axisDeg: round(r.axisDeg), aspect: round(r.aspect), look: r.look === null ? null : { ...r.look, ringOpacity: round(r.look.ringOpacity) } };
  });
  setDatum(canvas, "paths", JSON.stringify(paths));
}

/**
 * What the browser scripts read back about every point group (`data-points`, JSON): per group its id, whether it is drawn, its member count, how many members
 * are in view (an even sample scaled up) and the share of the view they span. This is the dots themselves, so a check that a stream is drawn never depends on pixels.
 */
export function publishPointsData(canvas: HTMLElement, views: readonly PointsView[], camera: Camera, others: readonly { screenReadout(): ReturnType<PointsView["screenReadout"]> }[] = []): void {
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  // Point groups, then any other batch of dots (body sets, T-098), read the same way.
  const groups = [...views.map((view) => view.screenReadout(camera)), ...others.map((other) => other.screenReadout())].map((r) => {
    const none = r.inView === 0;
    return { id: r.id, drawn: r.drawn, members: r.members, inView: r.inView, spanX: none ? 0 : round(r.maxX - r.minX), spanY: none ? 0 : round(r.maxY - r.minY) };
  });
  setDatum(canvas, "points", JSON.stringify(groups));
}

/** What the browser scripts read back about every body (`data-body-screen`, JSON): how it is drawn, its size in pixels and where it stands in the view. */
export function publishBodyData(canvas: HTMLElement, bodies: readonly BodyScreenReadout[]): void {
  setDatum(canvas, "bodyScreen", JSON.stringify(bodies));
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
