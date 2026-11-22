// @vitest-environment happy-dom
// Picture-load wake-ups for several viewers on three's one page-wide loading manager: any unmount order, the page's own callbacks kept.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DefaultLoadingManager } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFrameState } from "../src/app/sceneFrame";
import { useDrawWakes } from "../src/app/sceneContentsHooks";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const keys = ["onStart", "onProgress", "onLoad", "onError"] as const;
const snapshot = () => keys.map((k) => DefaultLoadingManager[k]);
const fireAll = () => {
  DefaultLoadingManager.onStart?.("a", 0, 1);
  DefaultLoadingManager.onProgress("a", 1, 1);
  DefaultLoadingManager.onLoad();
  DefaultLoadingManager.onError("a");
};

function viewer() {
  const canvas = document.createElement("canvas");
  const state = { current: createFrameState("readable" as never) };
  const root: Root = createRoot(document.createElement("div"));
  function Probe() {
    useDrawWakes(canvas, state);
    return null;
  }
  act(() => root.render(createElement(Probe)));
  return { canvas, state, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  for (const k of keys) (DefaultLoadingManager as unknown as Record<string, unknown>)[k] = undefined;
});

describe("loading wakes across viewers", () => {
  it.each([
    ["first mounted first", true],
    ["second mounted first", false],
  ])("wakes every mounted viewer and restores the manager (%s unmounts first)", (_name, aFirst) => {
    const before = snapshot();
    const a = viewer();
    const b = viewer();
    fireAll();
    expect([a.state.current.wakes, b.state.current.wakes]).toEqual([4, 4]);
    (aFirst ? a : b).unmount();
    fireAll();
    const [gone, kept] = aFirst ? [a, b] : [b, a];
    expect(gone.state.current.wakes).toBe(4);
    expect(kept.state.current.wakes).toBe(8);
    kept.unmount();
    expect(snapshot()).toEqual(before);
    snapshot().forEach((cb, i) => expect(cb).toBe(before[i]));
  });

  it("keeps the page's earlier callback hearing every event", () => {
    const seen = vi.fn();
    DefaultLoadingManager.onLoad = seen;
    const a = viewer();
    DefaultLoadingManager.onLoad();
    expect(seen).toHaveBeenCalledOnce();
    expect(a.state.current.wakes).toBe(1);
    a.unmount();
    expect(DefaultLoadingManager.onLoad).toBe(seen);
  });

  it("does not overwrite a callback the page sets while viewers are mounted", () => {
    const a = viewer();
    const mine = vi.fn();
    DefaultLoadingManager.onLoad = mine;
    a.unmount();
    expect(DefaultLoadingManager.onLoad).toBe(mine);
  });

  it("keeps restore wakes per canvas", () => {
    const a = viewer();
    const b = viewer();
    a.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect([a.state.current.wakes, b.state.current.wakes]).toEqual([1, 0]);
    a.unmount();
    b.unmount();
  });
});
