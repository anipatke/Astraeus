// @vitest-environment happy-dom
// A host page pointing the camera and reading its pose (O-052 T-225, G-015), on a made-up scene (ARCH-03): the 3D scene is a stand-in that exposes the controls
// the page hands it, so the camera requests the page makes are read straight from them; what the scene camera does with a request is in sceneCamera.test.ts.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth, moon } from "../src/api/bodies";
import type { CameraTarget } from "../src/api/viewerLink";
import { drawn } from "./domSetup";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
/** Views a (probe A) and b (probe B); the Moon and Earth are in every view. */
const makeScene = () => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .setViews([{ id: "a", label: "View A", paths: ["pa"] }, { id: "b", label: "View B", paths: ["pb"] }], { place: "top-bar" });

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
const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return undefined; };
const messageOf = (run: () => void): string => { try { run(); } catch (error) { return (error as Error).message; } return ""; };
/** What the scene would have written for a camera standing here (it does so every frame). */
const standAt = (focus: string, azimuthDeg: number, elevationDeg: number, distance: number) => { controls().viewReadout = { focus, azimuthDeg, elevationDeg, distance }; };

describe("setCamera on the mount handle", () => {
  it("follow: sends a follow request for a shown object, with the camera request path the view rules use", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    handle.setCamera({ follow: "pa" });
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "pa" });
    handle.unmount();
  });

  it("focus: sends a focus request for a shown object", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    handle.setCamera({ focus: "moon" });
    expect(controls().cameraRequest).toEqual({ kind: "focus", target: "moon" });
    handle.unmount();
  });

  it("an unknown id throws bad-camera naming it, and sends nothing", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    expect(codeOf(() => handle.setCamera({ follow: "nowhere" }))).toBe("bad-camera");
    expect(messageOf(() => handle.setCamera({ focus: "nowhere" }))).toContain('"nowhere"');
    expect(controls().cameraRequest).toBeNull();
    handle.unmount();
  });

  it("an object the showing view hides throws bad-camera, and is accepted once its view shows", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    expect(handle.view).toBe("a");
    expect(codeOf(() => handle.setCamera({ follow: "pb" }))).toBe("bad-camera");
    expect(messageOf(() => handle.setCamera({ follow: "pb" }))).toContain('"pb"');
    act(() => handle.setView("b"));
    controls().cameraRequest = null;
    expect(codeOf(() => handle.setCamera({ follow: "pb" }))).toBeUndefined();
    expect(codeOf(() => handle.setCamera({ follow: "pa" }))).toBe("bad-camera");
    handle.unmount();
  });

  it("malformed arguments throw bad-camera", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    const bad: unknown[] = [undefined, null, "pa", 5, [], {}, { follow: "" }, { follow: 3 }, { follow: "pa", focus: "moon" }, { follow: "pa", extra: 1 },
      { focus: "earth", azimuthDeg: 1, elevationDeg: 1, distance: 5, bogus: 1 }, { focus: "earth", azimuthDeg: "1", elevationDeg: 1, distance: 5 },
      { focus: "earth", azimuthDeg: 1, elevationDeg: 95, distance: 5 }, { focus: "earth", azimuthDeg: 1, elevationDeg: 1, distance: 0 }, { azimuthDeg: 1, elevationDeg: 1, distance: 5 }];
    for (const target of bad) expect(codeOf(() => handle.setCamera(target as CameraTarget)), JSON.stringify(target)).toBe("bad-camera");
    expect(controls().cameraRequest).toBeNull();
    handle.unmount();
  });

  it("before ready and after unmount: not-mounted", async () => {
    const handle = mount(host, makeScene());
    expect(codeOf(() => handle.setCamera({ follow: "pa" }))).toBe("not-mounted");
    await drawn(handle);
    handle.unmount();
    expect(codeOf(() => handle.setCamera({ follow: "pa" }))).toBe("not-mounted");
  });
});

describe("camera pose read and restore on the mount handle", () => {
  it("is undefined before ready and after unmount, and defined between", async () => {
    const handle = mount(host, makeScene());
    expect(handle.camera).toBeUndefined();
    await drawn(handle);
    expect(handle.camera).toBeDefined();
    expect(controls().viewReadout).toBeUndefined(); // the scene has not drawn a frame; the pose is the opening one
    standAt("pa", 10, 20, 30);
    expect(handle.camera).toEqual({ focus: "pa", azimuthDeg: 10, elevationDeg: 20, distance: 30 });
    handle.unmount();
    expect(handle.camera).toBeUndefined();
  });

  it("is a plain serialisable value that survives JSON, and later camera moves do not change a value already read", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    standAt("pa", 120.5, -12.25, 41.5);
    const read = handle.camera!;
    expect(JSON.parse(JSON.stringify(read))).toEqual(read);
    standAt("moon", 1, 2, 3);
    expect(read).toEqual({ focus: "pa", azimuthDeg: 120.5, elevationDeg: -12.25, distance: 41.5 });
    handle.unmount();
  });

  it("read, move, restore: the restore request carries exactly the pose that was read", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    standAt("pa", 120.5, -12.25, 41.5);
    const read = handle.camera!;
    standAt("moon", 300, 40, 9); // the visitor moves the camera
    handle.setCamera(read);
    expect(controls().cameraRequest).toEqual({ kind: "pose", view: read });
    handle.unmount();
  });

  it("a pose whose object the showing view hides throws bad-camera", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    standAt("pa", 10, 20, 30);
    const read = handle.camera!;
    act(() => handle.setView("b"));
    controls().cameraRequest = null;
    expect(codeOf(() => handle.setCamera(read))).toBe("bad-camera");
    expect(messageOf(() => handle.setCamera(read))).toContain('"pa"');
    expect(controls().cameraRequest).toBeNull();
    handle.unmount();
  });
});

describe("onCameraChange on the mount handle (O-054 T-248)", () => {
  const tick = () => act(() => { vi.advanceTimersByTime(100); });
  it("a setCamera that eases reports each tick's pose, then stops when the pose settles; an unchanged pose and a pose after unmount report nothing", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    const heard: Array<{ focus: string; azimuthDeg: number }> = [];
    const stop = handle.onCameraChange((pose) => heard.push(pose));
    standAt("earth", 216, 14.32, 16);
    tick(); tick();
    expect(heard).toEqual([]); // the opening pose is not a change
    handle.setCamera({ focus: "moon" });
    standAt("moon", 200, 14.32, 16); tick();
    standAt("moon", 180, 14.32, 12); tick();
    standAt("moon", 180, 14.32, 12); tick(); tick(); // settled
    expect(heard.map((p) => `${p.focus}@${p.azimuthDeg}`)).toEqual(["moon@200", "moon@180"]);
    stop();
    standAt("moon", 90, 14.32, 12); tick();
    expect(heard.length).toBe(2);
    handle.onCameraChange((pose) => heard.push(pose));
    handle.unmount();
    standAt("moon", 45, 14.32, 12); tick();
    expect(heard.length).toBe(2);
  });
});

describe("the camera at ready (as T-222: ready means usable)", () => {
  it("is the opening pose as soon as a bare await ready resolves, before the scene's first frame, and setCamera accepts it straight away", async () => {
    const handle = mount(host, makeScene());
    const ready = handle.ready;
    await act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });
    await ready;
    const opening = handle.camera;
    expect(opening).toMatchObject({ focus: "earth", azimuthDeg: 216, elevationDeg: 14.32, distance: 16 });
    expect(codeOf(() => handle.setCamera(opening!))).toBeUndefined();
    expect(controls().cameraRequest).toEqual({ kind: "pose", view: opening });
    handle.unmount();
  });

  it("is the scene's start view when it has one", async () => {
    const scene = makeScene();
    scene.camera.lookAt("moon", { azimuthDeg: 30, elevationDeg: 10, distance: 25 });
    const handle = mount(host, scene);
    await drawn(handle);
    expect(handle.camera).toEqual({ focus: "moon", azimuthDeg: 30, elevationDeg: 10, distance: 25 });
    handle.unmount();
  });
});

describe("the camera prop of AstraeusScene", () => {
  const draw = (props: { camera?: CameraTarget }, errors: Error[], scene: Scene) => act(async () => {
    root!.render(createElement(AstraeusScene, { scene, ...props, onError: (e) => errors.push(e) }));
  });
  const settle = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });

  it("is applied once drawn, and again when its target changes", async () => {
    const errors: Error[] = [];
    const scene = makeScene();
    root = createRoot(host);
    await draw({ camera: { follow: "pa" } }, errors, scene);
    await settle();
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "pa" });
    controls().cameraRequest = null;
    await draw({ camera: { focus: "moon" } }, errors, scene);
    expect(controls().cameraRequest).toEqual({ kind: "focus", target: "moon" });
    expect(errors).toEqual([]);
  });

  it("does not re-apply a new object with the same target, but does for a changed pose", async () => {
    const errors: Error[] = [];
    const scene = makeScene();
    root = createRoot(host);
    await draw({ camera: { follow: "pa" } }, errors, scene);
    await settle();
    controls().cameraRequest = null; // consumed by the scene
    await draw({ camera: { follow: "pa" } }, errors, scene);
    expect(controls().cameraRequest).toBeNull();
    await draw({ camera: { focus: "earth", azimuthDeg: 5, elevationDeg: 6, distance: 7 } }, errors, scene);
    expect(controls().cameraRequest).toMatchObject({ kind: "pose", view: { focus: "earth", azimuthDeg: 5, elevationDeg: 6, distance: 7 } });
    controls().cameraRequest = null;
    await draw({ camera: { focus: "earth", azimuthDeg: 5, elevationDeg: 6, distance: 7 } }, errors, scene);
    expect(controls().cameraRequest).toBeNull();
    expect(errors).toEqual([]);
  });

  it("an unknown or hidden target goes to onError as bad-camera", async () => {
    const errors: Error[] = [];
    const scene = makeScene();
    root = createRoot(host);
    await draw({ camera: { follow: "nowhere" } }, errors, scene);
    await settle();
    await draw({ camera: { follow: "pb" } }, errors, scene); // hidden in the opening view
    expect(errors.map((e) => (e as SceneError).code)).toEqual(["bad-camera", "bad-camera"]);
    expect(controls().cameraRequest).toBeNull();
  });

  it("without the prop the camera is left alone", async () => {
    const errors: Error[] = [];
    root = createRoot(host);
    await draw({}, errors, makeScene());
    await settle();
    expect(controls().cameraRequest).toBeNull();
  });
});
