// @vitest-environment happy-dom
// The site's end of the loading cover's hand-off (O-055 T-255, I-141), through the real code: `src/main.tsx` makes the boot cover and hands `claimCover` to the real App, which hands it
// to the real AstraeusScene, whose frame state claims the page's #boot. Only the WebGL canvas is stubbed (it draws nothing here); the test reads the frame state the scene gave its
// contents. The engine's end (App to the scene to the first frame that hides the cover) is packages/astraeus/tests/loadingCoverFrame.test.ts. Dropping the claim at the entry, at App or
// at AstraeusScene leaves the cover opaque for good.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const canvas = vi.hoisted(() => ({ states: [] as { current: { cover: (() => HTMLElement | null) | null } }[] }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ children }: { children: { props?: { frameState?: (typeof canvas.states)[number] } }[] }) => { for (const child of children) if (child.props?.frameState) canvas.states.push(child.props.frameState); return null; },
}));

beforeEach(() => {
  canvas.states.length = 0;
  document.body.innerHTML = '<div id="boot" role="status" data-state="loading"><span class="loading">Loading</span><span class="failed">Failed</span></div><div id="app"></div>';
  window.history.replaceState(null, "", "/?experience=synthetic");
});
afterEach(() => { document.body.innerHTML = ""; vi.resetModules(); });

describe("the site's loading cover reaches the scene", () => {
  it("the page's #boot is the cover the scene's frame state holds", async () => {
    await import("../src/main");
    await vi.waitFor(() => expect(canvas.states.length).toBeGreaterThan(0), { timeout: 4000 });
    const cover = canvas.states[canvas.states.length - 1]!.current.cover;
    expect(cover, "the scene's frame state holds no cover: the claim was dropped between main.tsx and createFrameState").not.toBeNull();
    expect(cover!()).toBe(document.getElementById("boot"));
  });
});
