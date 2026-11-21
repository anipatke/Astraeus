// @vitest-environment happy-dom
// Without an `onError` prop, `<AstraeusScene>` reports each error to the console instead of dropping it (O-083 T-347, AH-24).
import { createElement as h, createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
const prepared = vi.hoisted(() => ({ real: false }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("./synthetic/syntheticDefinition");
  const actual = await vi.importActual<typeof import("../src/api/prepared")>("../src/api/prepared");
  return {
    prepareScene: (scene: import("../src/api/scene").Scene, data?: readonly import("../src/api/scene").DataSource[]) => {
      if (prepared.real) return actual.prepareScene(scene, data);
      return { definition: { ...syntheticDefinition }, ready: Promise.resolve() };
    },
  };
});

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { AstraeusScene, type AstraeusSceneProps } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { Scene } from "../src/api/scene";
import { syntheticDefinition } from "./synthetic/syntheticDefinition";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const tick = (ms = 80) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const roots: Array<{ unmount: () => void }> = [];
const render = (props: AstraeusSceneProps): void => {
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  roots.push(root);
  flushSync(() => root.render(h(AstraeusScene, props)));
};

const { startUtcMs } = syntheticDefinition.experience.window;
const CASES: ReadonlyArray<{ name: string; code: string; props: () => AstraeusSceneProps; real: boolean }> = [
  { name: "a build fault", code: "empty-scene", props: () => ({ scene: new Scene() }), real: true },
  { name: "a load fault", code: "missing-data", props: () => ({ scene: new Scene().addBody("saturn").addBody("titan") }), real: true },
  { name: "a bad time prop", code: "bad-time", props: () => ({ scene: new Scene(), time: startUtcMs - 1e12 }), real: false },
];

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => { consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined); });
afterEach(() => { roots.splice(0).forEach((root) => root.unmount()); document.body.innerHTML = ""; prepared.real = false; vi.restoreAllMocks(); });

describe("<AstraeusScene> error reporting", () => {
  it.each(CASES)("without onError, $name goes to console.error once as a $code SceneError", async ({ code, props, real }) => {
    prepared.real = real;
    render(props());
    await tick();
    expect(consoleError).toHaveBeenCalledTimes(1);
    const reported = consoleError.mock.calls[0][0];
    expect(reported).toBeInstanceOf(SceneError);
    expect((reported as SceneError).code).toBe(code);
  });

  it.each(CASES)("with onError, $name calls onError once and logs nothing", async ({ code, props, real }) => {
    prepared.real = real;
    const onError = vi.fn();
    render({ ...props(), onError });
    await tick();
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as SceneError).code).toBe(code);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
