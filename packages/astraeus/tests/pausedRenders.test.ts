// @vitest-environment happy-dom
// A paused viewer does not re-render on its 100 ms clock poll (O-087 T-397, AH-11), on both embedding paths: `mount` and `AstraeusScene` (API-02), on a made-up scene (ARCH-03).
// The 3D scene is a stand-in that counts its renders (as hostCallOrder.test.ts stubs it); the timeline's time text is watched for any change to its nodes.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const renders = vi.hoisted(() => ({ scene: 0 }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: () => {
    renders.scene += 1;
    return createElement("div", { "data-testid": "scene" });
  },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth, moon } from "../src/api/bodies";
import type { ViewerHandle } from "../src/api/viewerHandle";
import { $, drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const makeScene = () =>
  new Scene()
    .addBody(earth)
    .addBody(moon)
    .addTrajectory({
      id: "pa",
      label: "Probe A",
      center: "earth",
      samples: [0, 1, 2, 3].map((i) => ({
        time: T0 + i * 10 * MIN,
        positionKm: [10_000 + i * 1_000, 0, 0],
        velocityKmS: [1, 0, 0],
      })),
    })
    .setViews([{ id: "a", label: "View A", objects: ["pa"] }], { place: "top-bar" });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
  renders.scene = 0;
});
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const settle = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
/** Advances in poll-sized steps, each in its own `act`, so each poll's render is flushed (one `act` around the whole span would batch them into one). */
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 100)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
};

const paths = [
  {
    name: "mount",
    start: async (scene: Scene): Promise<ViewerHandle> => {
      const handle = mount(host, scene);
      await drawn(handle);
      await handle.ready;
      return handle;
    },
  },
  {
    name: "AstraeusScene",
    start: async (scene: Scene): Promise<ViewerHandle> => {
      const ref: { current: ViewerHandle | null } = { current: null };
      root = createRoot(host);
      await act(async () => {
        root!.render(
          createElement(AstraeusScene, {
            scene,
            ref,
            onError: (e: Error) => {
              throw e;
            },
          }),
        );
      });
      await settle();
      return ref.current!;
    },
  },
] as const;

/** Counts the changes made to the timeline's time text (any mutation under the `<time>` element). */
function watchTimeText() {
  const el = $(host, ".timeline-time");
  let changes = 0;
  const observer = new MutationObserver((records) => {
    changes += records.length;
  });
  observer.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });
  return {
    text: () => el.textContent ?? "",
    changes: () => {
      changes += observer.takeRecords().length;
      return changes;
    },
  };
}

describe.each(paths)("re-rendering on the clock poll ($name)", ({ start }) => {
  it("does not re-render while the clock is paused", async () => {
    const handle = await start(makeScene());
    handle.setPlaying(false);
    await settle();
    const time = watchTimeText();
    const scenes = renders.scene;
    const before = time.changes();
    await advance(2_000);
    expect(renders.scene).toBe(scenes);
    expect(time.changes()).toBe(before);
  });

  it("re-renders while playing", async () => {
    const handle = await start(makeScene());
    handle.setTime(T0);
    handle.setRate(60);
    handle.setPlaying(true);
    await settle();
    const scenes = renders.scene;
    await advance(1_000);
    expect(renders.scene - scenes).toBeGreaterThanOrEqual(5);
  });

  it("re-renders once for a paused seek", async () => {
    const handle = await start(makeScene());
    handle.setPlaying(false);
    await settle();
    const time = watchTimeText();
    const scenes = renders.scene;
    const before = time.text();
    await act(async () => {
      handle.setTime(T0 + 20 * MIN);
    });
    await advance(1_000);
    expect(renders.scene - scenes).toBe(1);
    expect(time.text()).not.toBe(before);
    expect(time.text()).toContain("2026-03-01");
  });
});
