// @vitest-environment happy-dom
// O-075 T-319: the looks, switches, panel playback and pacing a scene reads back in Node, defaults filled in (ARCH-03: made-up scenes, public entry points). The 3D scene is a stand-in; the App is real.
import { createElement, act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { Scene, earth, moon, sun, type LookInput } from "astraeus";
import { App } from "../src/app/App";
import { ViewerLink } from "../src/api/viewerLink";
import { pretendScreen } from "./domSetup";
import { definitionOf } from "../src/api/definitionOf";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const base = () => new Scene().addBody(sun).addBody(earth).addBody(moon);
const withEvents = () => base().addEvents([{ id: "burn", label: "Burn", time: T0 + 600_000, type: "burn" }], {});
const timeline = { start: "2026-03-01T00:00:00Z", end: "2026-03-01T01:00:00Z" };

describe("Scene look, switches, panelPlayback and timeline.pacing", () => {
  const cases: readonly {
    name: string;
    scene: () => Scene;
    look: Partial<Scene["look"]>;
    switches: Record<string, unknown>;
    playback: Record<string, unknown>;
    pacing: unknown;
  }[] = [
    {
      name: "defaults",
      scene: () => withEvents().setTimeline(timeline),
      look: { starBrightness: 1, milkyWay: false, skyVisible: true, sheetMaxPercent: 50, markerSwapRadiusPx: 3 },
      switches: {},
      playback: { pauseSeconds: 6, autoOpen: true },
      pacing: undefined,
    },
    {
      name: "set values",
      scene: () =>
        withEvents()
          .setLook({ starBrightness: 1.4, sheetMaxPercent: 70, sunGlow: { sizePx: 120 } })
          .setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false, label: " Names " } })
          .setStoryPanelPlayback({ pauseSeconds: 5, autoOpen: false, closeAfterSeconds: 8 })
          .setTimeline({
            ...timeline,
            pacing: [
              { start: "2026-03-01T00:10:00Z", end: "2026-03-01T00:20:00Z", rate: 5, rampSeconds: 30 },
              { near: { type: "burn", withinSeconds: 120 }, rate: 2, rampSeconds: 60 },
            ],
          }),
      look: {
        starBrightness: 1.4,
        sheetMaxPercent: 70,
        sunGlow: { sizePx: 120, brightness: expect.any(Number), scale: expect.any(Number) },
      },
      switches: { orbitLines: { place: "top-bar", on: true }, labels: { place: "panel", on: false, label: "Names" } },
      playback: { pauseSeconds: 5, autoOpen: false, closeAfterSeconds: 8 },
      pacing: [
        { spanStartUtcMs: T0 + 600_000, spanEndUtcMs: T0 + 1_200_000, rate: 5, rampSeconds: 30 },
        { near: { type: "burn", withinSeconds: 120 }, rate: 2, rampSeconds: 60 },
      ],
    },
  ];

  it.each(cases)("reads $name", ({ scene, look, switches, playback, pacing }) => {
    const built = scene();
    const read = built.look;
    expect(read).toMatchObject(look);
    expect(read.sunGlow).toEqual({
      sizePx: expect.any(Number),
      brightness: expect.any(Number),
      scale: expect.any(Number),
    });
    expect(built.switches).toEqual(switches);
    expect(built.panelPlayback).toEqual(playback);
    expect(built.timeline.pacing).toEqual(pacing);
    for (const part of [
      read,
      read.skyLines,
      read.labels,
      read.time,
      read.sunGlow,
      built.switches,
      ...Object.values(built.switches),
      built.panelPlayback,
      built.timeline.pacing,
      ...(built.timeline.pacing ?? []),
    ]) {
      if (part !== undefined) expect(Object.isFrozen(part)).toBe(true);
    }
  });

  it("a scene without the Sun has no sunGlow", () => {
    expect(new Scene().addBody(earth).look.sunGlow).toBeUndefined();
  });
});

describe("Scene.look equals the viewer handle's look on a fresh mount", () => {
  let container: HTMLElement;
  let root: Root;
  beforeEach(() => {
    pretendScreen({});
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const looks: readonly LookInput[] = [
    {},
    {
      starBrightness: 0.5,
      milkyWay: false,
      skyVisible: false,
      markerSwapRadiusPx: 9,
      loadFadeSeconds: 1,
      desktopPictures: true,
      sheetMaxPercent: 65,
      sunGlow: { brightness: 0.4 },
      labels: { sizePx: 14 },
      time: { precision: "minute" } as never,
    },
  ];
  it.each(looks.map((look, index) => ({ index, look })))("look set $index", async ({ look }) => {
    const built = base()
      .setLook(look)
      .setSwitches({ milkyWay: { place: "panel", on: false } });
    const link = new ViewerLink();
    await act(async () => {
      root.render(createElement(App, { definition: definitionOf(built), address: false, host: link }));
    });
    expect(built.look).toEqual(link.look);
  });
});
