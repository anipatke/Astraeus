// @vitest-environment happy-dom
// Story panels that close themselves and the phone sheet's height cap (O-075 T-317, Zodiac review F-18): the pure close decision as a table over every input kind
// and every movement, the DOM close of an auto-opened panel, the `bad-panels` cases and the sheet look (default, live change, `bad-look`).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import { definitionOf } from "../src/api/definitionOf";
import { applyLook, lookReadOf } from "../src/app/liveLook";
import type { SceneControls } from "../src/app/AstraeusScene";
import { syntheticDefinition } from "./synthetic/syntheticDefinition";
import { CrossingTracker, panelArmedAt, panelSpanPassed } from "../src/shell/storyPanels";
import { $, press, type Mounted, mountShell } from "./domSetup";

const T = Date.UTC(2100, 0, 1);
const S = 1000;
const provenance = {
  sourceType: "illustrative" as const,
  sources: ["Made-up source"],
  accuracy: "None claimed.",
  notes: "Made up.",
};

/** Plays one tick the way the hook does: decide before `advance` moves the tracker's memory. */
function tick(
  tracker: CrossingTracker,
  panel: { timeUtcMs: number; closeAfterSeconds?: number },
  playbackSpan: number | undefined,
  toMs: number,
  playing: boolean,
): boolean {
  const passed = panelSpanPassed(panel, playbackSpan, tracker.previousMs, toMs, playing || tracker.wasPlaying);
  tracker.advance([], toMs, playing, true);
  return passed;
}

const SPANS = [
  ["playback span", { playbackSpan: 10 as number | undefined, panelSpan: undefined as number | undefined }, true],
  ["panel span (over a longer playback span)", { playbackSpan: 100, panelSpan: 10 }, true],
  ["panel span (over a shorter playback span, not yet reached)", { playbackSpan: 1, panelSpan: 100 }, false],
  ["no span", { playbackSpan: undefined, panelSpan: undefined }, false],
] as const;
const MOVES = [
  [
    "a forward pass",
    (tracker: CrossingTracker, run: (to: number, playing: boolean) => boolean) => {
      tracker.rebase(T + 5 * S);
      run(T + 6 * S, true);
      return run(T + 15 * S, true);
    },
    true,
  ],
  [
    "a seek past",
    (tracker: CrossingTracker, run: (to: number, playing: boolean) => boolean) => {
      tracker.rebase(T + 5 * S);
      run(T + 6 * S, true);
      tracker.rebase(T + 15 * S);
      return run(T + 15 * S, true);
    },
    false,
  ],
  [
    "a rewind",
    (tracker: CrossingTracker, run: (to: number, playing: boolean) => boolean) => {
      tracker.rebase(T + 15 * S);
      run(T + 15 * S, true);
      return run(T + 5 * S, true);
    },
    false,
  ],
  [
    "paused",
    (tracker: CrossingTracker, run: (to: number, playing: boolean) => boolean) => {
      tracker.rebase(T + 5 * S);
      return run(T + 15 * S, false);
    },
    false,
  ],
] as const;

describe("the close decision", () => {
  it.each(
    SPANS.flatMap(([spanName, spans, closes]) =>
      MOVES.map(([moveName, move, moves]) => [spanName, moveName, spans, move, closes && moves] as const),
    ),
  )("%s x %s", (_spanName, _moveName, spans, move, expected) => {
    const tracker = new CrossingTracker(T);
    const panel = { timeUtcMs: T, ...(spans.panelSpan === undefined ? {} : { closeAfterSeconds: spans.panelSpan }) };
    expect(move(tracker, (to, playing) => tick(tracker, panel, spans.playbackSpan, to, playing))).toBe(expected);
  });

  it("closes on the tick that finds the clock stopped on the end of the timeline after playing into it", () => {
    const tracker = new CrossingTracker(T + 5 * S);
    expect(tick(tracker, { timeUtcMs: T }, 10, T + 6 * S, true)).toBe(false);
    expect(tick(tracker, { timeUtcMs: T }, 10, T + 10 * S, false)).toBe(true);
  });
});

describe("closeAfterSeconds checks", () => {
  const panel = { id: "p", at: { time: "2100-01-01T00:00:00Z" }, title: "T", body: "B", provenance };
  it.each([
    [
      "zero on a panel",
      () => new Scene().addStoryPanels([{ ...panel, closeAfterSeconds: 0 }]),
      /story panel p: closeAfterSeconds must be a number of seconds above 0/,
    ],
    [
      "a negative span",
      () => new Scene().addStoryPanels([{ ...panel, closeAfterSeconds: -3 }]),
      /story panel p: closeAfterSeconds/,
    ],
    [
      "text for a span",
      () => new Scene().addStoryPanels([{ ...panel, closeAfterSeconds: "5" as never }]),
      /story panel p: closeAfterSeconds/,
    ],
    [
      "a span on a step",
      () => new Scene().addStoryPanels([{ id: "s", title: "T", body: "B", provenance, closeAfterSeconds: 5 }]),
      /story panel s: closeAfterSeconds is for a moment panel/,
    ],
    [
      "a bad playback span",
      () => new Scene().setStoryPanelPlayback({ closeAfterSeconds: Number.NaN }),
      /settings: closeAfterSeconds must be a number of seconds above 0/,
    ],
    [
      "a zero playback span",
      () => new Scene().setStoryPanelPlayback({ closeAfterSeconds: 0 }),
      /settings: closeAfterSeconds/,
    ],
  ])("%s throws bad-panels", (_name, run, message) => {
    expect(run).toThrow(expect.objectContaining({ code: "bad-panels", message: expect.stringMatching(message) }));
  });

  it("accepts a good span on a panel and on the playback", () => {
    expect(() =>
      new Scene()
        .addStoryPanels([{ ...panel, closeAfterSeconds: 30 }])
        .setStoryPanelPlayback({ closeAfterSeconds: 45 }),
    ).not.toThrow();
    const built = new Scene()
      .addBody(earth)
      .setTimeline({ start: "2099-12-31T00:00:00Z", end: "2100-01-02T00:00:00Z", rate: 60 })
      .addStoryPanels([{ ...panel, closeAfterSeconds: 30 }])
      .setStoryPanelPlayback({ closeAfterSeconds: 45 });
    expect(definitionOf(built).experience.storyPanels!.panels[0]!.closeAfterSeconds).toBe(30);
    expect(built.panelPlayback.closeAfterSeconds).toBe(45);
  });
});

describe("an auto-opened panel closes after its span", () => {
  let m: Mounted;
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    m.unmount();
    vi.useRealTimers();
  });
  const panels = syntheticDefinition.experience.storyPanels!.panels;
  const panelEl = () => m.container.querySelector<HTMLElement>(".story-panel");
  /** Seeks a second before the first panel and plays (100 ms real is six simulated seconds at the first rate). */
  const start = (closeAfterSeconds: number | undefined) => {
    m = mountShell({
      storyPanelSettings: {
        autoOpen: true,
        pauseSeconds: 0,
        ...(closeAfterSeconds === undefined ? {} : { closeAfterSeconds }),
      },
    });
    m.clock.seek(panels[0].timeUtcMs - 1_000);
    m.advance(0);
    press($(m.container, ".timeline-play"));
    m.advance(100);
  };

  it("stays open before the span passes and closes, reported as playback, once it does", () => {
    start(20);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    m.advance(100);
    expect(panelEl()).not.toBeNull();
    m.advance(100);
    m.advance(100);
    expect(panelEl()).toBeNull();
    expect(m.panelChanges[m.panelChanges.length - 1]).toEqual({ id: null, cause: "playback" });
  });

  it("never closes by itself with no span", () => {
    start(undefined);
    for (let i = 0; i < 8; i += 1) m.advance(100);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
  });
});

describe("the sheet look", () => {
  const controls = () =>
    ({
      bodyMarker: { minSpherePx: 3 },
      skyColours: {},
      labelStyle: {},
      timeLook: {},
      sheetMaxPercent: 50,
    }) as unknown as SceneControls;
  const definition = definitionOf(new Scene().addBody(earth));

  it("sets through the scene, defaults to 50 and changes live", () => {
    expect(definitionOf(new Scene().addBody(earth).setLook({ sheetMaxPercent: 70 })).look).toEqual({
      sheetMaxPercent: 70,
    });
    const live = controls();
    expect(applyLook(live, definition, null, {}).sheetMaxPercent).toBe(50);
    expect(applyLook(live, definition, null, { sheetMaxPercent: 85 }).sheetMaxPercent).toBe(85);
    expect(live.sheetMaxPercent).toBe(85);
    expect(lookReadOf(live).sheetMaxPercent).toBe(85);
    expect(applyLook(live, definition, null, {}).sheetMaxPercent).toBe(50);
  });

  it.each([[29], [86], [Number.NaN]])("%s throws bad-look", (value) => {
    expect(() => new Scene().setLook({ sheetMaxPercent: value })).toThrow(
      expect.objectContaining({ code: "bad-look" }),
    );
  });
});

// I-179: the close is a state test (the clock ends at or past the close moment on a forward tick after the opening one), not a crossing.
// The table plays the hook's rule: arm at open (`panelArmedAt`; a crossing opens armed), then ask `panelSpanPassed` on each later tick.
describe("the close as a state test (I-179)", () => {
  type Step = readonly [toMs: number, playing: boolean];
  const run = (armed: boolean, steps: readonly Step[], span: number | null = 1): boolean[] => {
    const panel = { timeUtcMs: T, ...(span === null ? {} : { closeAfterSeconds: span }) };
    const tracker = new CrossingTracker(T - 500);
    return steps.map(([to, playing], index) => {
      // The first step is the opening tick: the hook never asks about a panel on the tick that opens it.
      const passed =
        index > 0 && armed && panelSpanPassed(panel, undefined, tracker.previousMs, to, playing || tracker.wasPlaying);
      tracker.advance([], to, playing, true);
      return passed;
    });
  };
  const CASES: readonly (readonly [string, boolean, readonly Step[], readonly boolean[], number?])[] = [
    [
      "span shorter than a frame: opens on the tick, closes on the next",
      true,
      [
        [T + 5 * S, true],
        [T + 10 * S, true],
      ],
      [false, true],
    ],
    [
      "span longer than a frame: closes only once passed",
      true,
      [
        [T + 2 * S, true],
        [T + 4 * S, true],
        [T + 11 * S, true],
      ],
      [false, false, true],
      10,
    ],
    [
      "speed raised after opening",
      true,
      [
        [T + 500, true],
        [T + 700, true],
        [T + 3_000_000, true],
      ],
      [false, false, true],
    ],
    [
      "opened by the visitor after the close moment: stays open",
      false,
      [
        [T + 5 * S, true],
        [T + 10 * S, true],
      ],
      [false, false],
    ],
    ["seek past: closes nothing", true, [[T + 50 * S, false]], [false]],
    [
      "rewind: closes nothing",
      true,
      [
        [T + 10 * S, true],
        [T + 2 * S, true],
      ],
      [false, false],
    ],
    ["paused: closes nothing", true, [[T + 10 * S, false]], [false]],
  ];
  for (const [name, armed, steps, expected, span] of CASES) {
    it(name, () => {
      expect(run(armed, steps, span)).toEqual(expected);
    });
  }
  it("no span never closes", () => {
    expect(
      run(
        true,
        [
          [T + 5 * S, true],
          [T + 10_000 * S, true],
        ],
        null,
      ),
    ).toEqual([false, false]);
  });
  it("the tracker reads the clock it was rebased to, then each tick's", () => {
    const tracker = new CrossingTracker(T - 500);
    expect(tracker.timeUtcMs).toBe(T - 500);
    tracker.rebase(T + 50 * S);
    expect(tracker.timeUtcMs).toBe(T + 50 * S);
    tracker.advance([], T + 51 * S, true, true);
    expect(tracker.timeUtcMs).toBe(T + 51 * S);
  });
  it("arms only when the clock is before the close moment", () => {
    const panel = { timeUtcMs: T, closeAfterSeconds: 10 };
    expect([
      panelArmedAt(panel, undefined, T + 9 * S),
      panelArmedAt(panel, undefined, T + 10 * S),
      panelArmedAt({ timeUtcMs: T }, undefined, T + 99 * S),
    ]).toEqual([true, false, true]);
  });
});

describe("a panel whose span passes within one frame closes (I-179)", () => {
  let m: Mounted;
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    m.unmount();
    vi.useRealTimers();
  });
  const panels = syntheticDefinition.experience.storyPanels!.panels;
  const panelEl = () => m.container.querySelector<HTMLElement>(".story-panel");
  const start = (closeAfterSeconds: number) => {
    m = mountShell({ storyPanelSettings: { autoOpen: true, pauseSeconds: 0, closeAfterSeconds } });
    m.clock.seek(panels[0].timeUtcMs - 1_000);
    m.advance(0);
    press($(m.container, ".timeline-play"));
  };

  it("opens on the crossing tick and closes on the next, reported as playback", () => {
    start(1);
    m.advance(100);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    m.advance(100);
    expect(panelEl()).toBeNull();
    expect(m.panelChanges[m.panelChanges.length - 1]).toEqual({ id: null, cause: "playback" });
  });

  it("closes after the speed is raised once it is open", () => {
    start(20);
    m.advance(100);
    expect(panelEl()).not.toBeNull();
    m.clock.setRate(m.clock.snapshot().rate * 1000);
    m.advance(100);
    expect(panelEl()).toBeNull();
    expect(m.panelChanges[m.panelChanges.length - 1]).toEqual({ id: null, cause: "playback" });
  });

  it("keeps a panel the visitor opened after its close moment", () => {
    start(1);
    m.advance(100);
    m.advance(100);
    expect(panelEl()).toBeNull();
    m.requestPanel(panels[0].id);
    for (let i = 0; i < 4; i += 1) m.advance(100);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
  });
});

describe("a panel opened from the timeline is armed by the clock it jumps to (I-179)", () => {
  let m: Mounted;
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    m.unmount();
    vi.useRealTimers();
  });
  const panels = syntheticDefinition.experience.storyPanels!.panels;
  const panelEl = () => m.container.querySelector<HTMLElement>(".story-panel");
  const fromTrack = () => press($(m.container, `button[aria-label="Open story panel: ${panels[0].title}"]`));
  /** Plays the clock to `fromMs` from the panel's time, presses the panel on the track (it jumps the clock to the panel) and plays on past its close moment. */
  const run = (fromMs: number) => {
    m = mountShell({ storyPanelSettings: { autoOpen: true, pauseSeconds: 0, closeAfterSeconds: 20 } });
    m.clock.seek(panels[0].timeUtcMs + fromMs);
    m.advance(0);
    fromTrack();
    press($(m.container, ".timeline-play"));
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    for (let i = 0; i < 12; i += 1) m.advance(100);
  };

  it("closes when opened from the track after playback passed its close moment (the clock lands at the panel)", () => {
    run(59_000);
    expect(panelEl()).toBeNull();
    expect(m.panelChanges[m.panelChanges.length - 1]).toEqual({ id: null, cause: "playback" });
  });

  it("closes when opened from the track with the clock before the panel", () => {
    run(-50_000);
    expect(panelEl()).toBeNull();
    expect(m.panelChanges[m.panelChanges.length - 1]).toEqual({ id: null, cause: "playback" });
  });
});
