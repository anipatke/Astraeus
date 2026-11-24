// @vitest-environment happy-dom
// O-096 T-447: a browser with no WebGL 2 is told so (`no-webgl`) by both embedding paths (Guardrails API-02). The shared test setup answers "yes" for the pretend page; this file undoes that and stubs the canvas.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("../src/api/webglCheck");
vi.mock("../src/api/prepared", () => ({ prepareScene: () => ({ definition: {}, ready: Promise.resolve() }) }));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene, earth, type SceneError } from "astraeus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let getContext: ReturnType<typeof vi.fn>;
let host: HTMLElement;
beforeEach(() => {
  getContext = vi.fn(() => null);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(getContext as never);
  host = document.createElement("div");
  host.style.cssText = "width:400px;height:300px";
  document.body.append(host);
});
afterEach(() => {
  vi.restoreAllMocks();
  host.remove();
});

const scene = () => new Scene().addBody(earth);
const throwing = (): void => {
  getContext.mockImplementation(() => {
    throw new Error("no gl");
  });
};

describe("mount without WebGL", () => {
  for (const [name, arrange] of [
    ["a null context", () => undefined],
    ["a throwing getContext", throwing],
  ] as const) {
    it(`rejects ready with no-webgl, holds the message and no canvas, and unmount empties it (${name})`, async () => {
      arrange();
      host.style.position = "";
      const mounted = mount(host, scene());
      await expect(mounted.ready).rejects.toMatchObject({ code: "no-webgl" });
      await act(async () => undefined);
      expect(host.querySelector("[data-astraeus-no-webgl]")?.textContent).toMatch(/WebGL/);
      expect(host.querySelector("[data-astraeus-no-webgl]")?.classList.contains("astraeus-shell")).toBe(true);
      expect(host.querySelector("canvas")).toBeNull();
      expect(host.querySelector(".hud, .bar")).toBeNull();
      mounted.unmount();
      expect(host.innerHTML).toBe("");
      expect(host.style.isolation).toBe("");
      expect(host.style.position).toBe("");
    });
  }
});

describe("AstraeusScene without WebGL", () => {
  let root: Root;
  afterEach(() => act(() => root.unmount()));
  const render = async (props: Record<string, unknown>) => {
    root = createRoot(host);
    await act(async () => root.render(createElement(AstraeusScene, { scene: scene(), ...props })));
    await act(async () => undefined);
  };

  it("calls onError once with no-webgl, shows the message, and does not call onReady", async () => {
    const onError = vi.fn();
    const onReady = vi.fn();
    const onFirstDraw = vi.fn();
    await render({ onError, onReady, onFirstDraw });
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]![0] as SceneError).code).toBe("no-webgl");
    expect(host.querySelector("[data-astraeus-no-webgl]")).not.toBeNull();
    expect(host.querySelector("canvas")).toBeNull();
    expect(onReady).not.toHaveBeenCalled();
    expect(onFirstDraw).not.toHaveBeenCalled();
  });

  it("logs once to the console without onError, also when getContext throws", async () => {
    throwing();
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await render({});
    expect(log).toHaveBeenCalledTimes(1);
    expect((log.mock.calls[0]![0] as SceneError).code).toBe("no-webgl");
    expect(host.querySelector("[data-astraeus-no-webgl]")).not.toBeNull();
  });
});
