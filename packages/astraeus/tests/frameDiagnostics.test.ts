// The browser-check readouts are opt-in (O-087 T-395): a page sets `__ASTRAEUS_DIAGNOSTICS__` before the viewer mounts, and without it the frame writes none of them and never reads the views' screen readouts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFrameState, runFrame, type FrameContext } from "../src/app/sceneFrame";
import { publishPathData, publishPointsData } from "../src/app/sceneDebug";
import { makeContext } from "./helpers/frameContext";

const FLAG = "__ASTRAEUS_DIAGNOSTICS__";
const READOUTS = [
  "paths",
  "points",
  "bodyScreen",
  "orbitHeadGap",
  "orbitArcSegment",
  "bodySetMembers",
  "featureMarkers",
  "markerBodies",
] as const;

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[FLAG];
});

const pathReadout = {
  id: "line",
  visible: true,
  vertices: 4,
  inView: 4,
  maxX: 0.5,
  minX: -0.5,
  maxY: 0.5,
  minY: -0.5,
  lineMinX: -0.5,
  lineMaxX: 0.5,
  lineMinY: -0.5,
  lineMaxY: 0.5,
  axisDeg: 0,
  aspect: 1,
  look: null,
};
const pointsReadout = { id: "ring", drawn: true, members: 40, inView: 40, maxX: 1, minX: 0, maxY: 1, minY: 0 };

/** A frame over a made-up path, point group, body set and feature layer, with every screen readout spied. */
function scene() {
  const { ctx } = makeContext();
  const path = {
    id: "line",
    layer: { source: { body: "moon" } },
    group: { visible: true },
    sync: vi.fn(),
    place: vi.fn(),
    setLook: vi.fn(),
    setColor: vi.fn(),
    defaultLook: null,
    extentUnits: () => 2,
    arcLongestSegment: () => 1,
    arcHeadAbsolute: () => [0, 0, 0],
    screenReadout: vi.fn(() => pathReadout),
  };
  const group = {
    id: "ring",
    group: { visible: true },
    sync: vi.fn(),
    place: vi.fn(),
    setLook: vi.fn(() => false),
    screenReadout: vi.fn(() => pointsReadout),
  };
  const set = {
    id: "set",
    group: { visible: true },
    count: 3,
    drawn: true,
    screen: [],
    layer: { members: [], families: [] },
    sync: vi.fn(),
    place: vi.fn(),
    litCount: () => 0,
    memberRadiusUnits: () => null,
    memberAbsolute: () => null,
    screenReadout: vi.fn(() => ({ ...pointsReadout, id: "set" })),
  };
  // Like the real layer: no readout when the frame did not ask for one.
  const features = { update: vi.fn((...args: unknown[]) => (args[7] === false ? null : { total: 1, shown: [] })) };
  const views = {
    ...ctx.views,
    compositionPaths: [path],
    groupViews: [group],
    bodySetViews: [set],
  } as unknown as FrameContext["views"];
  const writes: string[] = [];
  const dataset = new Proxy({} as Record<string, string>, {
    set(target, key, value) {
      writes.push(String(key));
      target[String(key)] = value;
      return true;
    },
  });
  const canvas = Object.assign(ctx.canvas, { dataset });
  const state = createFrameState(ctx.controls.policy.id);
  const layers = { ...ctx.layers, featureMarkers: { current: features } } as unknown as FrameContext["layers"];
  const frame: FrameContext = { ...ctx, canvas, state, views, layers };
  return { frame, canvas, writes, path, group, set, features };
}

describe("the browser-check readouts are opt-in", () => {
  it.each([
    ["absent", undefined],
    ["false", false],
  ])("writes no diagnostic readout by default (flag %s)", (_name, flag) => {
    if (flag !== undefined) (globalThis as Record<string, unknown>)[FLAG] = flag;
    const { frame, canvas, writes, path, group, set, features } = scene();
    expect(frame.state.diagnostics).toBe(false);
    runFrame(frame);
    const afterFirst = writes.length;
    for (let i = 0; i < 9; i += 1) runFrame(frame);
    for (const key of READOUTS) expect(canvas.dataset).not.toHaveProperty(key);
    expect(path.screenReadout).not.toHaveBeenCalled();
    expect(group.screenReadout).not.toHaveBeenCalled();
    expect(set.screenReadout).not.toHaveBeenCalled();
    // Nothing changes between frames 2 and 10, so the always-on cheap attributes write nothing either.
    expect(writes.length).toBe(afterFirst);
    expect(features.update.mock.calls.every((call) => call[7] === false)).toBe(true);
  });

  it("writes the readouts when the page asks, equal to what the publishers produce", () => {
    (globalThis as Record<string, unknown>)[FLAG] = true;
    const { frame, canvas, path, group, set, features } = scene();
    expect(frame.state.diagnostics).toBe(true);
    runFrame(frame);
    for (const key of [
      "paths",
      "points",
      "bodyScreen",
      "orbitHeadGap",
      "orbitArcSegment",
      "bodySetMembers",
      "markerBodies",
    ])
      expect(canvas.dataset).toHaveProperty(key);
    const expected = { dataset: {} } as unknown as HTMLCanvasElement;
    publishPathData(expected, [path] as never, frame.camera);
    publishPointsData(expected, [group] as never, frame.camera, [set] as never);
    expect(canvas.dataset.paths).toBe(expected.dataset.paths);
    expect(canvas.dataset.points).toBe(expected.dataset.points);
    expect(canvas.dataset.bodySetMembers).toBe("3");
    expect(canvas.dataset.featureMarkers).toBe(JSON.stringify({ total: 1, shown: [] }));
    expect(features.update.mock.calls.every((call) => call[7] === true)).toBe(true);
  });

  it("publishes the box the in-view dots cover beside their span, and none when no dot is in view", () => {
    const canvas = { dataset: {} } as unknown as HTMLCanvasElement;
    const view = (id: string, inView: number) => ({
      screenReadout: () => ({
        ...pointsReadout,
        sampled: inView,
        id,
        inView,
        minX: 0.25,
        maxX: 0.5,
        minY: 0.125,
        maxY: 0.75,
      }),
    });
    publishPointsData(canvas, [], {} as never, [view("seen", 3), view("unseen", 0)]);
    const [seen, unseen] = JSON.parse(canvas.dataset.points!) as Record<string, number>[];
    expect(seen).toMatchObject({ spanX: 0.25, spanY: 0.625, minX: 0.25, minY: 0.125, maxX: 0.5, maxY: 0.75 });
    expect(unseen).not.toHaveProperty("minX");
  });

  it("reads the flag once, when the frame state is made", () => {
    const { frame } = scene();
    (globalThis as Record<string, unknown>)[FLAG] = true;
    expect(frame.state.diagnostics).toBe(false);
    expect(createFrameState(frame.controls.policy.id).diagnostics).toBe(true);
  });
});
