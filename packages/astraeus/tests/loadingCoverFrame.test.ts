// @vitest-environment happy-dom
// The engine's end of the loading cover's hand-off (O-055 T-255, I-141): the real App given a `claimCover` hands it to the real AstraeusScene (only the WebGL canvas is stubbed), whose frame
// state holds the claimed element, and the first frame (the engine's own `stepAndPoseCamera` on that very state) hides it. The site's end (main.tsx makes and hands the claim) is
// packages/astraeus-site/tests/loadingCoverChain.test.ts. Dropping the claim at App or at AstraeusScene fails here; a cover handed to a later scene is the I-074 case in bootLoader.test.ts.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const canvas = vi.hoisted(() => ({ states: [] as { current: import("../src/app/sceneFrame").FrameState }[] }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ children }: { children: { props?: { frameState?: (typeof canvas.states)[number] } }[] }) => { for (const child of children) if (child.props?.frameState) canvas.states.push(child.props.frameState); return null; },
}));
vi.mock("../src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { App } from "../src/app/App";
import { placeScene, stepAndPoseCamera } from "../src/app/sceneFrame";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { makeContext, T0 } from "./helpers/frameContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); host?.remove(); root = undefined; host = undefined; canvas.states.length = 0; document.body.innerHTML = ""; vi.unstubAllGlobals(); });

describe("the handed loading cover, from App to the first frame", () => {
  it("App's claimCover reaches the scene's frame state, and the first frame hides that cover", async () => {
    const cover = document.createElement("div");
    cover.id = "boot";
    cover.dataset.state = "loading";
    document.body.append(cover);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const claimCover = vi.fn(() => () => document.getElementById("boot"));
    await act(async () => { root!.render(createElement(App, { definition: syntheticDefinition, claimCover })); });
    expect(claimCover, "App did not hand claimCover to the scene, or the scene never claimed it").toHaveBeenCalled();
    const state = canvas.states[canvas.states.length - 1]!.current;
    expect(state.cover?.(), "the scene's frame state holds no cover").toBe(cover);
    // The first frame, as the scene runs it, on the state the scene created.
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { fn(0); return 1; });
    const { ctx } = makeContext();
    const first = { ...ctx, state };
    stepAndPoseCamera(first, T0, placeScene(first, T0));
    expect(cover.dataset.state).toBe("done");
  });
  it("without a claim the scene holds no cover (mount and AstraeusScene never look one up)", async () => {
    document.body.innerHTML = '<div id="boot" data-state="loading"></div>';
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => { root!.render(createElement(App, { definition: syntheticDefinition })); });
    expect(canvas.states[canvas.states.length - 1]!.current.cover).toBeNull();
  });
});
