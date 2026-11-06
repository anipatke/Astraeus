// @vitest-environment happy-dom
// O-059 T-266: `onFirstDraw` from both embedding paths (Guardrails API-02): `mount`'s handle and the `onFirstDraw` prop of `<AstraeusScene>` hear the scene's first drawn frame. As in
// loadingCoverFrame.test.ts, the real App hands the real AstraeusScene a frame state; only the WebGL canvas is stubbed, and the first frame is the engine's own `stepAndPoseCamera`.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const canvas = vi.hoisted(() => ({ states: [] as { current: import("../src/app/sceneFrame").FrameState }[] }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ children }: { children: { props?: { frameState?: (typeof canvas.states)[number] } }[] }) => { for (const child of children) if (child.props?.frameState) canvas.states.push(child.props.frameState); return null; },
}));
vi.mock("../src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: { ...syntheticDefinition }, ready: Promise.resolve() }) };
});

import { AstraeusScene as HostScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { ViewerLink } from "../src/api/viewerLink";
import { Scene, earth } from "astraeus";
import { placeScene, stepAndPoseCamera } from "../src/app/sceneFrame";
import { makeContext, T0 } from "./helpers/frameContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); host?.remove(); root = undefined; host = undefined; canvas.states.length = 0; document.body.innerHTML = ""; vi.unstubAllGlobals(); });

/** Runs the first frame of the newest scene on the state that scene created, as the scene's frame loop would. */
function drawFirstFrame(): void {
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { fn(0); return 1; });
  const { ctx } = makeContext();
  const first = { ...ctx, state: canvas.states[canvas.states.length - 1]!.current };
  stepAndPoseCamera(first, T0, placeScene(first, T0));
}
/** Lets the pending loads and renders finish until the stubbed canvas has been handed `count` frame states. */
async function drawn(count: number): Promise<void> {
  for (let tries = 0; tries < 100 && canvas.states.length < count; tries += 1) await act(async () => { await new Promise((done) => setTimeout(done, 10)); });
  expect(canvas.states.length, "the scene never reached its canvas").toBeGreaterThanOrEqual(count);
}
const element = () => { host = document.createElement("div"); document.body.append(host); return host; };

describe("onFirstDraw through mount", () => {
  it("is called once when the first frame is drawn, not at ready; a listener added later is called at once; stop and unmount end it", async () => {
    const early = vi.fn();
    const viewer = mount(element(), new Scene().addBody(earth));
    const stop = viewer.onFirstDraw(early);
    await drawn(1);
    await viewer.ready;
    expect(early, "ready is not the first frame").not.toHaveBeenCalled();
    drawFirstFrame();
    expect(early).toHaveBeenCalledTimes(1);
    const late = vi.fn();
    viewer.onFirstDraw(late);
    expect(late).toHaveBeenCalledTimes(1);
    stop();
    const stopped = vi.fn();
    viewer.onFirstDraw(stopped)();
    act(() => viewer.unmount());
    expect(early).toHaveBeenCalledTimes(1);
  });
});

describe("onFirstDraw through AstraeusScene", () => {
  it("calls the prop once for the first frame, and again after a rebuild with a new scene", async () => {
    const heard = vi.fn();
    root = createRoot(element());
    await act(async () => { root!.render(createElement(HostScene, { scene: new Scene().addBody(earth), onFirstDraw: heard })); });
    await drawn(1);
    expect(heard).not.toHaveBeenCalled();
    drawFirstFrame();
    expect(heard).toHaveBeenCalledTimes(1);
    await act(async () => { root!.render(createElement(HostScene, { scene: new Scene().addBody(earth), onFirstDraw: heard })); });
    await drawn(2);
    drawFirstFrame();
    expect(heard).toHaveBeenCalledTimes(2);
  });
});

describe("the link under both", () => {
  it("tells a listener once per drawn scene, forgets the draw on detach, tells a thrown listener to the page without stopping the next, and nothing after close", () => {
    const link = new ViewerLink();
    const reported: unknown[] = [];
    vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
    const order: string[] = [];
    link.onFirstDraw(() => { order.push("a"); throw new Error("host bug"); });
    link.onFirstDraw(() => order.push("b"));
    link.firstDraw();
    link.firstDraw();
    expect(order).toEqual(["a", "b"]);
    expect(reported).toHaveLength(1);
    link.detach();
    link.firstDraw();
    expect(order).toEqual(["a", "b", "a", "b"]);
    link.close();
    link.firstDraw();
    expect(order).toHaveLength(4);
  });
});
