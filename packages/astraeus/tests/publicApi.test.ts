// @vitest-environment happy-dom
// The engine's small public API (O-036 T-160): a scene built with the documented calls becomes the app's definition, bad input fails with a named error, and mount/unmount leaves nothing behind.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AstraeusScene, Scene, SceneError, earth, moon, mount, readableScale, saturn, titan, trueScale, type DataSource } from "astraeus";
import { dataSource as pictureData } from "astraeus-data";
import { catalogue } from "../src/assets/catalogue";
import { clearPictures, pictureOf, registerPictures } from "../src/assets/pictures";
import { installData } from "../src/api/data";
import { mountShell } from "./domSetup";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { cameraReachOf, mountedBodiesOf, sceneCenterOf, scaleChoiceIdsOf, trackedBodiesOf } from "../src/app/experienceDefinition";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = "1969-07-20T20:17:40Z";
const samples = [0, 1, 2].map((minute) => ({ time: Date.parse(T0) + minute * 60_000, positionKm: [10_000 + minute * 100, 0, 0], velocityKmS: [1, 0, 0] }));
const apollo = { id: "apollo11", label: "Apollo 11", samples };
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };

describe("Scene", () => {
  it("builds the definition from addBody, addTrajectory, setTime, setScale and camera.follow", () => {
    const scene = new Scene();
    scene.addBody(earth).addBody(moon).addTrajectory(apollo).setTime(T0).setScale(readableScale);
    scene.camera.follow("apollo11");
    const definition = scene.toDefinition();
    expect(mountedBodiesOf(definition)).toEqual(["earth", "moon"]);
    expect(sceneCenterOf(definition)).toBe("earth");
    expect(trackedBodiesOf(definition).map((body) => body.id)).toEqual(["apollo11"]);
    expect(definition.clock.startUtcMs).toBe(Date.parse(T0));
    expect(scaleChoiceIdsOf(definition)).toEqual(["readable-scale", "true-scale"]);
    expect(definition.startView?.focus).toBe("apollo11");
    expect(definition.experience.startCameraPresetId).toBe("follow-target");
    expect(definition.experience.cameraPresets.map((preset) => preset.request.kind)).toEqual(["overview", "focus", "follow"]);
    expect(definition.experience.objects.map((object) => object.id)).toEqual(["earth", "moon", "apollo11"]);
    expect(cameraReachOf(definition)).toEqual({});
  });

  it("starts in true scale and at the trajectory's start when nothing is set", () => {
    const definition = new Scene().addBody("earth").addTrajectory(apollo).toDefinition();
    expect(scaleChoiceIdsOf(definition)?.[0]).toBe(trueScale.id);
    expect(definition.clock.startUtcMs).toBe(samples[0]!.time);
    expect(definition.startView).toBeUndefined();
    expect(definition.experience.startCameraPresetId).toBeUndefined();
  });

  it("accepts a provider with stateAt as a trajectory", () => {
    const provider = { stateAt: (timeUtcMs: number) => ({ timeUtcMs }) as never };
    const definition = new Scene().addBody(earth).addTrajectory({ id: "probe", provider, bounds: { start: T0, end: "1969-07-21T20:17:40Z" } }).toDefinition();
    const probe = trackedBodiesOf(definition)[0]!;
    expect(probe.trajectory.bounds).toEqual({ startUtcMs: Date.parse(T0), endUtcMs: Date.parse("1969-07-21T20:17:40Z") });
    expect(probe.pathTimesUtcMs.length).toBeGreaterThan(2);
    expect(probe.trajectory.stateAt(5)).toEqual({ timeUtcMs: 5 });
  });

  it.each([
    ["an unknown body to follow", () => new Scene().addBody(earth).camera.follow("nowhere"), "unknown-body"],
    ["an uncatalogued body", () => new Scene().addBody("vulcan"), "unknown-body"],
    ["a body added twice", () => new Scene().addBody(earth).addBody("earth"), "duplicate-id"],
    ["a bad time", () => new Scene().setTime("not a date"), "bad-time"],
    ["a bad sample time", () => new Scene().addTrajectory({ id: "x", samples: [{ time: "later", positionKm: [0, 0, 0] }, { time: 1, positionKm: [0, 0, 0] }] }), "bad-time"],
    ["one sample only", () => new Scene().addTrajectory({ id: "x", samples: [{ time: 1, positionKm: [0, 0, 0] }] }), "bad-trajectory"],
    ["a provider without stateAt", () => new Scene().addTrajectory({ id: "x", provider: {} as never, bounds: { start: 0, end: 1 } }), "bad-trajectory"],
    ["reversed provider bounds", () => new Scene().addTrajectory({ id: "x", provider: { stateAt: () => ({}) as never }, bounds: { start: 5, end: 1 } }), "bad-trajectory"],
    ["a scale that is not offered", () => new Scene().setScale({ id: "huge" } as never), "bad-scale"],
    ["an empty scene", () => new Scene().toDefinition(), "empty-scene"],
  ])("refuses %s with a named error", (_name, call, code) => {
    expect(codeOf(call)).toMatch(new RegExp(`^${code}: .+`));
  });

  it("names the data package a body needs when it was not passed, and accepts it when it was", () => {
    const io = { id: "io", label: "Io", requires: "astraeus-data" };
    const scene = new Scene().addBody("jupiter").addBody(io);
    expect(codeOf(() => scene.toDefinition())).toContain("astraeus-data");
    const data: DataSource = { name: "astraeus-data", provides: ["io"] };
    expect(mountedBodiesOf(scene.toDefinition([data]))).toEqual(["jupiter", "io"]);
  });
});

describe("moons and the data packages (O-036 T-161)", () => {
  const positions = (): DataSource => ({ name: "astraeus-data-saturn", provides: ["titan"], moonPositions: { centre: "saturn", loadIndex: async () => ({}), chunkUrls: {} } });

  it("does not offer a moon without its planet's positions package, by reference or by id", () => {
    expect(codeOf(() => new Scene().addBody(saturn).addBody(titan).toDefinition())).toMatch(/^missing-data: .*titan.*astraeus-data-saturn/);
    expect(codeOf(() => new Scene().addBody("saturn").addBody("titan").toDefinition())).toMatch(/^missing-data: .*astraeus-data-saturn/);
  });

  it("is not satisfied by the pictures package alone, and is by the positions package", () => {
    const scene = new Scene().addBody(saturn).addBody(titan);
    expect(codeOf(() => scene.toDefinition([pictureData]))).toMatch(/^missing-data: .*astraeus-data-saturn/);
    expect(mountedBodiesOf(scene.toDefinition([positions(), pictureData]))).toEqual(["saturn", "titan"]);
  });

  it("registers a package's pictures when it is installed, and without them a moon has no map (no invented data)", async () => {
    clearPictures();
    try {
      expect(catalogue.get("titan").visual.texture).toBeUndefined();
      expect(catalogue.get("venus").visual.texture?.desktop).toBeUndefined();
      await installData([pictureData], [], { startUtcMs: 0, endUtcMs: 1 });
      const texture = catalogue.get("titan").visual.texture;
      expect(texture?.url).toBeTruthy();
      expect(texture?.licence?.attribution).toContain("NASA/JPL");
      expect(catalogue.get("venus").visual.texture?.desktop?.widthPx).toBe(8192);
      expect(pictureOf("milky-way-left")).toBeDefined();
    } finally {
      registerPictures(pictureData.pictures!);
    }
  });
});

describe("mount", () => {
  let host: HTMLElement | undefined;
  // The viewer fetches the star list; there is no network in the test, so it answers "absent" at once.
  beforeEach(() => { vi.stubGlobal("fetch", () => Promise.reject(new Error("offline"))); });
  afterEach(() => { host?.remove(); vi.unstubAllGlobals(); });

  it("draws into the element, and unmount removes everything it added", async () => {
    host = document.createElement("div");
    document.body.append(host);
    const handle = mount(host, new Scene().addBody(earth).addBody(moon).addTrajectory(apollo));
    await act(async () => { await handle.ready; });
    expect(host.childElementCount).toBeGreaterThan(0);
    act(() => { handle.unmount(); });
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.childElementCount).toBe(0);
    expect(() => handle.unmount()).not.toThrow();
  });

  it("unmounted before the data loads, it never draws", async () => {
    host = document.createElement("div");
    const handle = mount(host, new Scene().addBody("jupiter"));
    handle.unmount();
    await handle.ready;
    expect(host.childElementCount).toBe(0);
  });

  it("refuses something that is not an element and a scene with a missing package", () => {
    expect(codeOf(() => mount(null as never, new Scene().addBody(earth)))).toMatch(/^bad-element/);
    expect(codeOf(() => mount(document.createElement("div"), new Scene().addBody({ id: "io", label: "Io", requires: "astraeus-data" })))).toMatch(/^missing-data: .*astraeus-data/);
  });
});

describe("AstraeusScene", () => {
  let host: HTMLElement;
  let root: Root | undefined;
  beforeEach(() => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    host = document.createElement("div");
    document.body.append(host);
  });
  afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); vi.unstubAllGlobals(); });
  const render = async (props: Parameters<typeof AstraeusScene>[0]) => {
    root ??= createRoot(host);
    await act(async () => { root!.render(createElement(AstraeusScene, props)); await Promise.resolve(); });
  };
  const flush = () => act(async () => { await new Promise((done) => setTimeout(done, 0)); });
  const scene = () => new Scene().addBody(earth).addBody(moon).addTrajectory(apollo);

  it("draws the viewer into its wrapper and reports ready once", async () => {
    expect(typeof AstraeusScene).toBe("function");
    const onReady = vi.fn();
    await render({ scene: scene(), onReady, className: "wrap", style: { height: 300 } });
    await flush();
    const wrapper = host.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe("wrap");
    expect(wrapper.style.height).toBe("300px");
    expect(wrapper.childElementCount).toBeGreaterThan(0);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("reports a scene that cannot be built through onError and draws nothing", async () => {
    const onError = vi.fn();
    await render({ scene: new Scene().addBody({ id: "io", label: "Io", requires: "astraeus-data" }), onError });
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(SceneError);
    expect((host.firstElementChild as HTMLElement).childElementCount).toBe(0);
  });

  it("reports a data load failure through onError", async () => {
    const failing = { id: "x", provides: [] } as unknown as DataSource;
    const s = scene();
    const definition = s.toDefinition();
    vi.spyOn(s, "toDefinition").mockReturnValue({ ...definition, prepare: () => Promise.reject(new Error("no data")) });
    const onError = vi.fn(); const onReady = vi.fn();
    await render({ scene: s, data: [failing], onError, onReady });
    await flush();
    expect(onError.mock.calls[0]![0].message).toBe("no data");
    expect(onReady).not.toHaveBeenCalled();
  });

  it("rebuilds when the scene prop changes, not when only the callbacks change", async () => {
    const first = scene();
    const spy = vi.spyOn(first, "toDefinition");
    await render({ scene: first, onReady: () => undefined });
    await flush();
    await render({ scene: first, onReady: () => undefined });
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);
    const second = new Scene().addBody(earth);
    const spy2 = vi.spyOn(second, "toDefinition");
    const onReady = vi.fn();
    await render({ scene: second, onReady });
    await flush();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("removes everything on unmount, and never draws if unmounted before the data loads", async () => {
    await render({ scene: scene() });
    await flush();
    act(() => root!.unmount());
    root = undefined;
    expect(host.childElementCount).toBe(0);
    const onReady = vi.fn();
    const early = createRoot(host);
    act(() => early.render(createElement(AstraeusScene, { scene: new Scene().addBody("jupiter"), onReady })));
    act(() => early.unmount());
    await flush();
    expect(host.childElementCount).toBe(0);
    expect(onReady).not.toHaveBeenCalled();
  });
});

describe("addBody with an orbit line", () => {
  it("declares the Moon's orbit as a composition path about Earth", () => {
    const definition = new Scene().addBody(earth).addBody(moon, { orbit: true }).toDefinition();
    expect(definition.composition?.paths?.map((path) => path.body)).toEqual(["moon"]);
    expect(new Scene().addBody(earth).addBody(moon).toDefinition().composition?.paths).toBeUndefined();
  });

  it("refuses an orbit the engine cannot draw, and one whose parent is not in the scene", () => {
    expect(codeOf(() => new Scene().addBody(earth).addBody("mars", { orbit: true }))).toMatch(/^no-orbit: .*moon and io only/);
    expect(codeOf(() => new Scene().addBody(moon, { orbit: true }).toDefinition())).toMatch(/^no-orbit: .*about earth/);
  });
});

describe("camera.follow starts already following", () => {
  it("opens the shell with the Follow preset in force, and no preset in force without it", () => {
    const withFollow = mountShell({ experience: { ...syntheticDefinition.experience, startCameraPresetId: syntheticDefinition.experience.cameraPresets.find((preset) => preset.request.kind === "follow")!.id } });
    const pressed = [...withFollow.container.querySelectorAll("[data-camera-preset]")].filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.getAttribute("data-camera-preset"));
    withFollow.unmount();
    expect(pressed).toEqual([syntheticDefinition.experience.cameraPresets.find((preset) => preset.request.kind === "follow")!.id]);
    const without = mountShell();
    expect([...without.container.querySelectorAll("[data-camera-preset][aria-pressed='true']")]).toHaveLength(0);
    without.unmount();
  });
});
