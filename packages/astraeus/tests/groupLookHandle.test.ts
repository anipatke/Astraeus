// @vitest-environment happy-dom
// O-078 T-324: `handle.setGroupLook` / `handle.groupLook` on both embedding paths (`mount` and `AstraeusScene`), written as a host page calls them on a made-up scene (ARCH-03).
// The 3D scene is a stand-in that exposes the controls the page hands it (as hostCallOrder.test.ts does): the live looks the frame applies are read there.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import { SceneError } from "../src/api/errors";
import type { ViewerHandle } from "../src/api/viewerHandle";
import { drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const orbit = (id: string, a: number) => ({ id, semiMajorAxisKm: a, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 });
/** Two groups (one with its own colour and size, one on the defaults) and Earth, which is a body, not a group. */
const makeScene = () => new Scene().addBody(earth)
  .addGroup({ id: "inner", label: "Inner", plane: "ecliptic-j2000", color: "#ff8800", dotSizePx: 3, orbits: [orbit("i1", 9e4), orbit("i2", 1e5)] })
  .addGroup({ id: "outer", label: "Outer", plane: "ecliptic-j2000", orbits: [orbit("o1", 2e5)] })
  .setTimeline({ start: T0, end: T0 + 86_400_000, rate: 60 });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); sceneProps.latest = null; vi.unstubAllGlobals(); vi.useRealTimers(); });

const controls = () => sceneProps.latest!.controls;
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });
const errorOf = (fn: () => unknown): SceneError => { try { fn(); } catch (error) { return error as SceneError; } throw new Error("expected a throw"); };

/** Each embedding path: opens the scene and returns its handle once ready, and a way to close it. */
interface Path { readonly name: string; readonly open: (scene: Scene) => Promise<{ handle: ViewerHandle; close: () => void; rebuild?: (scene: Scene) => Promise<void> }> }
const paths: readonly Path[] = [
  { name: "mount", open: async (scene) => { const handle = mount(host, scene); await drawn(handle); await handle.ready; return { handle, close: () => handle.unmount() }; } },
  { name: "AstraeusScene", open: async (scene) => {
    const ref: { current: ViewerHandle | null } = { current: null };
    root = createRoot(host);
    const render = async (next: Scene) => { await act(async () => { root!.render(createElement(AstraeusScene, { scene: next, ref, onError: (e: Error) => { throw e; } })); }); await settle(); };
    await render(scene);
    return { handle: ref.current!, close: () => { act(() => root!.unmount()); root = undefined; }, rebuild: render };
  } },
];

describe.each(paths)("setGroupLook and groupLook ($name)", ({ open }) => {
  it("reads the scene's own look until changed (addGroup's colour and size, else the defaults)", async () => {
    const { handle } = await open(makeScene());
    expect(handle.groupLook("inner")).toEqual({ color: "#ff8800", dotSizePx: 3 });
    expect(handle.groupLook("outer")).toEqual({ color: "#9de3a8", dotSizePx: 2.5 });
    expect(controls().groupLooks?.size ?? 0).toBe(0); // nothing is applied until the host asks: groups render exactly as before
  });

  it("sets the colour only, the size only, and both; a field left out keeps its value", async () => {
    const { handle } = await open(makeScene());
    handle.setGroupLook("inner", { color: "#112233" });
    expect(handle.groupLook("inner")).toEqual({ color: "#112233", dotSizePx: 3 });
    handle.setGroupLook("inner", { dotSizePx: 1.5 });
    expect(handle.groupLook("inner")).toEqual({ color: "#112233", dotSizePx: 1.5 });
    handle.setGroupLook("outer", { color: "#abc", dotSizePx: 4 });
    expect(handle.groupLook("outer")).toEqual({ color: "#abc", dotSizePx: 4 });
    handle.setGroupLook("outer", {});
    expect(handle.groupLook("outer")).toEqual({ color: "#abc", dotSizePx: 4 });
    // What the frame applies to the dots and the label (sceneFrame `applyGroupLooks`).
    expect(Object.fromEntries(controls().groupLooks!)).toEqual({ inner: { color: "#112233", dotSizePx: 1.5 }, outer: { color: "#abc", dotSizePx: 4 } });
  });

  it("lands in call order: the last call wins, and the read is immediate", async () => {
    const { handle } = await open(makeScene());
    const seen: unknown[] = [];
    for (const color of ["#000001", "#000002", "#000003"]) { handle.setGroupLook("inner", { color }); seen.push(handle.groupLook("inner")?.color); }
    expect(seen).toEqual(["#000001", "#000002", "#000003"]);
    expect(controls().groupLooks!.get("inner")).toEqual({ color: "#000003", dotSizePx: 3 });
  });

  it("is presentation only: no change report, and scene.groups keeps describing the scene", async () => {
    const scene = makeScene();
    const before = JSON.stringify(scene.groups);
    const { handle } = await open(scene);
    const heard: unknown[] = [];
    handle.onChange((change) => heard.push(change));
    handle.onSelect((change) => heard.push(change));
    const time = handle.timeUtcMs;
    handle.setGroupLook("inner", { color: "#010203", dotSizePx: 9 });
    await settle();
    expect(heard).toEqual([]);
    expect(handle.timeUtcMs).toBe(time);
    expect(JSON.stringify(scene.groups)).toBe(before);
  });

  it("throws bad-group naming the id for an unknown or non-group id", async () => {
    const { handle } = await open(makeScene());
    for (const id of ["nope", "earth", "", 7 as unknown as string]) {
      const error = errorOf(() => handle.setGroupLook(id, { color: "#123456" }));
      expect(error).toBeInstanceOf(SceneError);
      expect(error.code).toBe("bad-group");
      expect(error.message).toContain(`"${String(id)}" is not a group this viewer draws (inner, outer)`);
    }
    expect(handle.groupLook("earth")).toBeUndefined();
    expect(handle.groupLook("nope")).toBeUndefined();
  });

  it.each([
    ["a colour that is not hex", { color: "red" }, "color"],
    ["a colour that is not text", { color: 0x123456 }, "color"],
    ["a size of 0", { dotSizePx: 0 }, "dotSizePx"],
    ["a negative size", { dotSizePx: -1 }, "dotSizePx"],
    ["a size that is not finite", { dotSizePx: Number.POSITIVE_INFINITY }, "dotSizePx"],
    ["a size that is NaN", { dotSizePx: Number.NaN }, "dotSizePx"],
    ["a size that is text", { dotSizePx: "3" }, "dotSizePx"],
    ["a field it does not know", { colour: "#123456" }, "colour"],
    ["no look object", undefined, "expected { color?, dotSizePx? }"],
    ["an array", [], "expected { color?, dotSizePx? }"],
  ])("throws bad-group naming the field for %s, and changes nothing", async (_name, look, field) => {
    const { handle } = await open(makeScene());
    const error = errorOf(() => handle.setGroupLook("inner", look as never));
    expect(error.code).toBe("bad-group");
    expect(error.message).toContain(field);
    expect(handle.groupLook("inner")).toEqual({ color: "#ff8800", dotSizePx: 3 });
  });

  it("throws not-mounted after unmount, and reads undefined", async () => {
    const { handle, close } = await open(makeScene());
    close();
    expect(errorOf(() => handle.setGroupLook("inner", { color: "#123456" })).code).toBe("not-mounted");
    expect(handle.groupLook("inner")).toBeUndefined();
  });
});

describe("before ready", () => {
  it("setGroupLook throws not-mounted and groupLook reads undefined (mount)", () => {
    const handle = mount(host, makeScene());
    expect(errorOf(() => handle.setGroupLook("inner", { color: "#123456" })).code).toBe("not-mounted");
    expect(handle.groupLook("inner")).toBeUndefined();
    handle.unmount();
  });
});

describe("a viewer rebuilt with a new scene", () => {
  it("starts from the new scene's own looks (AstraeusScene)", async () => {
    const opened = await paths[1].open(makeScene());
    opened.handle.setGroupLook("inner", { color: "#010101" });
    await opened.rebuild!(makeScene());
    await vi.waitFor(() => expect(opened.handle.groupLook("inner")).toEqual({ color: "#ff8800", dotSizePx: 3 }));
    expect(controls().groupLooks?.size ?? 0).toBe(0);
  });
});
