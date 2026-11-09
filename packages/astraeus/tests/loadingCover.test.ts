// @vitest-environment happy-dom
// O-061 T-288: the opt-in loading cover (`loadingCover: true`) on both embedding paths (Guardrails API-02). It shows from the start, fades at the scene's first drawn frame (the
// signal behind `onFirstDraw`) over the `loadFadeSeconds` look and is removed; it is absent unless asked for; two viewers cover and uncover independently (API-03); reduced motion removes it at once.
// As in firstDraw.test.ts, the real App hands the real AstraeusScene a frame state; only the WebGL canvas is stubbed, and the first frame is the engine's own `stepAndPoseCamera`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const canvas = vi.hoisted(() => ({ states: [] as { current: import("../src/app/sceneFrame").FrameState }[], failLoad: false }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ children }: { children: { props?: { frameState?: (typeof canvas.states)[number] } }[] }) => { for (const child of children) if (child.props?.frameState) canvas.states.push(child.props.frameState); return null; },
}));
vi.mock("../src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: { ...syntheticDefinition, look: { loadFadeSeconds: 0.1 } }, ready: canvas.failLoad ? Promise.reject(new Error("data failed")) : Promise.resolve() }) };
});

import { AstraeusScene as HostScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene, earth } from "astraeus";
import { placeScene, stepAndPoseCamera } from "../src/app/sceneFrame";
import { makeContext, T0 } from "./helpers/frameContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const COVER = ".astraeus-loading-cover";
const roots: Root[] = [];
const hosts: HTMLElement[] = [];
afterEach(() => { for (const root of roots) act(() => root.unmount()); roots.length = 0; for (const host of hosts) host.remove(); hosts.length = 0; canvas.states.length = 0; canvas.failLoad = false; document.body.innerHTML = ""; vi.unstubAllGlobals(); });

/**
 * Runs the first frame of every scene canvas from `from` up to `to` (default: all of them), as that viewer's frame loop would. A viewer can hand its canvas more than one frame state while it
 * settles (the earlier ones belong to renders React threw away); drawing them all draws whichever is the live one, and the others are heard by nobody.
 */
function drawFirstFrame(from = 0, to = canvas.states.length): void {
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { fn(0); return 1; });
  for (const state of new Set(canvas.states.slice(from, to))) {
    const { ctx } = makeContext();
    const first = { ...ctx, state: state.current };
    act(() => { stepAndPoseCamera(first, T0, placeScene(first, T0)); });
  }
}
async function drawn(count: number): Promise<void> {
  for (let tries = 0; tries < 100 && canvas.states.length < count; tries += 1) await act(async () => { await new Promise((done) => setTimeout(done, 10)); });
  expect(canvas.states.length, "the scene never reached its canvas").toBeGreaterThanOrEqual(count);
  await act(async () => { await new Promise((done) => setTimeout(done, 0)); }); // the render has committed and its effects (the cover's listener) have run
}
const element = (): HTMLElement => { const host = document.createElement("div"); document.body.append(host); hosts.push(host); return host; };
const covers = (host: HTMLElement) => host.querySelectorAll<HTMLElement>(COVER);
const scene = () => new Scene().addBody(earth);

type Start = (host: HTMLElement, asked: boolean) => Promise<void>;
const PATHS: ReadonlyArray<readonly [string, Start]> = [
  ["mount", async (host, asked) => { await act(async () => { mount(host, scene(), asked ? { loadingCover: true } : {}); }); }],
  ["AstraeusScene", async (host, asked) => {
    const root = createRoot(host);
    roots.push(root);
    await act(async () => { root.render(createElement(HostScene, asked ? { scene: scene(), loadingCover: true } : { scene: scene() })); });
  }],
];

describe.each(PATHS)("the loading cover through %s", (_name, start) => {
  it("shows from the start, stays while loading, fades at the first drawn frame over the look's seconds, and is then removed", async () => {
    const host = element();
    await start(host, true);
    expect(covers(host), "shown at once").toHaveLength(1);
    await drawn(1);
    expect(covers(host)[0]!.dataset.state, "the viewer is built but nothing is drawn yet").toBe("covering");
    drawFirstFrame();
    await vi.waitFor(() => expect(covers(host)[0]?.dataset.state ?? "gone").not.toBe("covering")); // a cover mounted just after the draw is told at once
    const fading = covers(host)[0];
    if (fading === undefined) throw new Error("the cover was removed before its fade could be read");
    expect(fading.dataset.state).toBe("fading");
    expect(fading.style.transitionDuration, "the loadFadeSeconds look").toBe("0.1s");
    await vi.waitFor(() => expect(covers(host)).toHaveLength(0), { timeout: 2000 });
  });

  it("lies inside the viewer's one root element, before and after the scene has loaded", async () => {
    const host = element();
    await start(host, true);
    const root = () => host.querySelectorAll(".astraeus-shell");
    expect(root(), "one root from the first render").toHaveLength(1);
    expect(covers(host)[0]!.parentElement).toBe(root()[0]);
    await drawn(1);
    expect(root(), "the real shell replaces the pre-shell root, never sits beside it").toHaveLength(1);
    expect(covers(host)[0]!.parentElement).toBe(root()[0]);
  });

  it("is removed when the scene fails to load, so the host's own error shows", async () => {
    canvas.failLoad = true;
    const host = element();
    const errors: unknown[] = [];
    if (_name === "mount") {
      const handle = mount(host, scene(), { loadingCover: true });
      await act(async () => { await handle.ready.catch((error: unknown) => errors.push(error)); });
    } else {
      const root = createRoot(host);
      roots.push(root);
      await act(async () => { root.render(createElement(HostScene, { scene: scene(), loadingCover: true, onError: (error) => errors.push(error) })); });
      await act(async () => { await new Promise((done) => setTimeout(done, 20)); });
    }
    expect(errors, "the failure reaches the host").toHaveLength(1);
    expect(covers(host)).toHaveLength(0);
  });

  it("is absent when not asked for", async () => {
    const host = element();
    await start(host, false);
    await drawn(1);
    expect(covers(host)).toHaveLength(0);
    drawFirstFrame();
    expect(covers(host)).toHaveLength(0);
  });

  it("is removed at once, without a fade, under prefers-reduced-motion", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }));
    const host = element();
    await start(host, true);
    await drawn(1);
    expect(covers(host)).toHaveLength(1);
    drawFirstFrame();
    expect(covers(host)).toHaveLength(0);
  });

  it("covers two viewers independently: the first drawing leaves the second covered", async () => {
    const [a, b] = [element(), element()];
    await start(a, true);
    await drawn(1);
    const aFrames = canvas.states.length;
    await start(b, true);
    await drawn(aFrames + 1);
    drawFirstFrame(0, aFrames);
    await vi.waitFor(() => expect(covers(a)).toHaveLength(0), { timeout: 2000 });
    expect(covers(b)).toHaveLength(1);
    expect(covers(b)[0]!.dataset.state).toBe("covering");
  });
});

describe("the cover's styles", () => {
  it("all sit under the viewer's root class, with no id and no element or global selector", () => {
    const css = readFileSync(join(process.cwd(), "packages", "astraeus", "src", "app", "style.css"), "utf8");
    const mine = css.slice(css.indexOf("/* The opt-in loading cover")).replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...mine.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim()).filter((s) => !s.startsWith("@") && !s.startsWith("/*"));
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector, selector).toMatch(/^\.astraeus-shell \.astraeus-loading-cover(\[data-state="fading"\])?$/);
  });
});
