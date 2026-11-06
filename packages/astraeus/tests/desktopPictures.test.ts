// @vitest-environment happy-dom
// O-059 T-266: `LookInput.desktopPictures` on a made-up scene that changes only that look (ARCH-03). The 3D scene is a stand-in that records what the page hands it; the App, the look
// resolver and the host link are real. Read when the viewer is built (documented): a later `setLook` neither swaps pictures nor changes what `look` reads.
import { createElement, act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { runtime: { desktopTextures: boolean }; controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { Scene, earth, moon } from "astraeus";
import { App } from "../src/app/App";
import { ViewerLink } from "../src/api/viewerLink";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const visit = (search: string) => window.history.replaceState(null, "", `/page.html${search}`);
const scene = () => new Scene().addBody(earth).addBody(moon);
const open = async (built: Scene, address = false) => {
  const link = new ViewerLink();
  await act(async () => { root.render(createElement(App, { definition: built.toDefinition(), address, host: link })); });
  return link;
};

beforeEach(() => {
  pretendScreen({});
  sceneProps.latest = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); visit(""); });

describe("LookInput.desktopPictures", () => {
  it("is off by default, in what the scene is handed and in what the host reads", async () => {
    const link = await open(scene());
    expect(sceneProps.latest!.runtime.desktopTextures).toBe(false);
    expect(link.look?.desktopPictures).toBe(false);
  });

  it("is on when the scene's look says so", async () => {
    const link = await open(scene().setLook({ desktopPictures: true }));
    expect(sceneProps.latest!.runtime.desktopTextures).toBe(true);
    expect(link.look?.desktopPictures).toBe(true);
  });

  it("the page address (`?desktop=`) is laid over the scene's look when the host turned the address on, and ignored otherwise", async () => {
    visit("?desktop=off");
    await open(scene().setLook({ desktopPictures: true }), true);
    expect(sceneProps.latest!.runtime.desktopTextures).toBe(false);
    act(() => root.unmount());
    root = createRoot(container);
    await open(scene().setLook({ desktopPictures: true }));
    expect(sceneProps.latest!.runtime.desktopTextures).toBe(true);
  });

  it("a later setLook does not swap the pictures: the value read stays the one the viewer was built with", async () => {
    const link = await open(scene().setLook({ desktopPictures: true }));
    act(() => link.setLook({ starBrightness: 1.2 }));
    expect(link.look).toMatchObject({ starBrightness: 1.2, desktopPictures: true });
    act(() => link.setLook({ desktopPictures: false }));
    expect(link.look?.desktopPictures).toBe(true);
    expect(sceneProps.latest!.runtime.desktopTextures).toBe(true);
  });

  it("is checked like the other looks: a non-boolean is bad-look", () => {
    expect(() => scene().setLook({ desktopPictures: "yes" as never })).toThrow(/bad-look|desktopPictures must be true or false/);
  });
});
