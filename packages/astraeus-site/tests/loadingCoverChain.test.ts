// @vitest-environment happy-dom
// The site's end of the loading cover's hand-off (O-055 T-255, I-141; rewritten for the public way, O-059 T-272), through the real code: `src/main.tsx` mounts the scene with the public `mount`
// and asks the handle `onFirstDraw` to fade the page's #boot. Only the WebGL canvas is stubbed (it draws nothing here); the test plays the first frame by calling the callback the scene's frame
// state holds, which is what the engine calls after the first drawn frame (the engine's end is packages/astraeus/tests/firstDraw.test.ts). Leaving `onFirstDraw` out of main.tsx, or handing it a
// cover that is no longer the page's #boot, leaves the cover opaque for good and fails here. The same table holds the entry paths that stay on the page: the address it opens, back and forward.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type State = { onFirstDraw: (() => void) | undefined };
const canvas = vi.hoisted(() => ({ states: [] as { current: State }[] }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ children }: { children: { props?: { frameState?: (typeof canvas.states)[number] } }[] }) => { for (const child of children) if (child.props?.frameState) canvas.states.push(child.props.frameState); return null; },
}));

// The public `mount`, recorded: what the site gave it, and every viewer it drew so each test can take its viewers down again.
const mounts = vi.hoisted(() => ({ calls: [] as { options: { address?: boolean; developerTools?: boolean } | undefined; handle: { unmount(): void }; picker: { id: string } | undefined; onPick: number }[] }));
vi.mock("astraeus", async (orig) => {
  const real = await orig<typeof import("astraeus")>();
  return {
    ...real,
    mount: (...args: Parameters<typeof real.mount>) => {
      const handle = real.mount(...args);
      const call = { options: args[2], handle, picker: args[1].picker, onPick: 0 };
      const onPick = handle.onPick.bind(handle);
      handle.onPick = (listener) => { call.onPick += 1; return onPick(listener); };
      mounts.calls.push(call);
      return handle;
    },
  };
});

const COVER = '<div id="boot" role="status" data-state="loading"><span class="loading">Loading</span><span class="failed">Failed</span></div><div id="app"></div>';
const boot = (): HTMLElement | null => document.getElementById("boot");
/** Plays the first frame of the newest scene: the callback its frame state holds, with the next animation frame run at once. */
function firstFrame(): void {
  const state = canvas.states[canvas.states.length - 1]!.current;
  expect(state.onFirstDraw, "the scene's frame state holds no first-draw callback").toBeDefined();
  state.onFirstDraw!();
}
const drawnScenes = (count: number) => vi.waitFor(() => expect(canvas.states.length).toBeGreaterThanOrEqual(count), { timeout: 8000 });

beforeEach(() => {
  canvas.states.length = 0;
  mounts.calls.length = 0;
  document.body.innerHTML = COVER;
  document.title = "Astraeus";
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { fn(0); return 1; });
  delete (window as { astraeusHost?: unknown }).astraeusHost;
});
// Each test takes its viewers down, so a late frame of one is never taken for the next test's scene.
afterEach(() => { for (const { handle } of mounts.calls) handle.unmount(); vi.unstubAllGlobals(); document.body.innerHTML = ""; vi.resetModules(); });

// The addresses the page can open here without fetching data files: the made-up scenes the dev server mounts (a public build leaves them out) and the default. The planet and shower addresses fetch their orbit files; their choice is held by entryChoice.test.ts and their switch by planetChoice, showerSwitch and listChoice tests.
const ENTRIES: readonly (readonly [string, string])[] = [
  ["a made-up scene", "?experience=synthetic"],
  ["another made-up scene", "?experience=synthetic-ring"],
  ["the made-up views scene", "?experience=synthetic-views"],
  ["the default (Apollo 11)", ""],
];

describe("the site's loading cover reaches the scene", () => {
  it("mounts through the public mount with the page address and the developer tools on", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    await drawnScenes(1);
    expect(mounts.calls).toHaveLength(1);
    expect(mounts.calls[0]!.options).toMatchObject({ address: true, developerTools: true });
  });

  it.each(ENTRIES)("%s: the first frame fades the page's #boot (I-141)", async (_name, search) => {
    window.history.replaceState(null, "", `/${search}`);
    await import("../src/main");
    await drawnScenes(1);
    const cover = boot();
    expect(cover, "the page has no #boot").not.toBeNull();
    expect(cover!.dataset.state).toBe("loading");
    firstFrame();
    expect(cover!.dataset.state, "the first frame did not fade the cover: onFirstDraw was not handed to the scene, or the cover was not handed over").toBe("done");
  });

  it("a scene that is no longer the newest cannot hide the cover a switch brought back (I-074)", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    await drawnScenes(1);
    const first = canvas.states[0]!.current;
    window.history.pushState(null, "", "/?experience=synthetic-ring");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(boot()!.dataset.state).toBe("loading");
    await drawnScenes(2);
    first.onFirstDraw?.();
    expect(boot()?.dataset.state, "the older scene hid the newer cover").toBe("loading");
    firstFrame();
    expect(boot()!.dataset.state).toBe("done");
  });
});

describe("the site's picker wiring", () => {
  // The planet scene is built from files in the repository (no fetch), so its entry mounts here; the shower entry fetches its orbit file and is held by the browser steps.
  it("a planet scene gets its switch as a picker, and the site listens for the press", async () => {
    vi.stubGlobal("fetch", () => new Promise<never>(() => undefined));
    window.history.replaceState(null, "", "/?experience=planets&planet=mercury");
    await import("../src/main");
    await drawnScenes(1);
    expect(mounts.calls[0]!.picker, "main.tsx did not call setPicker on the planet scene").toBeDefined();
    expect(mounts.calls[0]!.onPick, "main.tsx did not listen with onPick").toBe(1);
  });

  it("a scene with no picker is not listened to", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    await drawnScenes(1);
    expect(mounts.calls[0]!.picker).toBeUndefined();
    expect(mounts.calls[0]!.onPick).toBe(0);
  });
});

describe("the site's page entry", () => {
  it("names the page after the experience it opened, and keeps the product name for one with no name", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    await drawnScenes(1);
    expect(document.title).toBe("Astraeus");
  });

  it("hands the views scene's handle to the page as window.astraeusHost, and only that scene's", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic-views");
    await import("../src/main");
    await drawnScenes(1);
    await vi.waitFor(() => expect((window as { astraeusHost?: { ready?: Promise<void> } }).astraeusHost?.ready).toBeInstanceOf(Promise));
    vi.resetModules();
    delete (window as { astraeusHost?: unknown }).astraeusHost;
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    expect((window as { astraeusHost?: unknown }).astraeusHost).toBeUndefined();
  });

  it("back and forward open the address now in the location without pushing a new one, and an address that fails shows the failure cover", async () => {
    window.history.replaceState(null, "", "/?experience=synthetic");
    await import("../src/main");
    await drawnScenes(1);
    const length = window.history.length;
    window.history.replaceState(null, "", "/?experience=synthetic-ring");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await drawnScenes(2);
    expect(window.history.length).toBe(length);
    expect(boot()!.dataset.state).toBe("loading");
  });
});
