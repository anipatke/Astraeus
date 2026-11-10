import { describe, expect, it } from "vitest";
import { projectSegmentClipped, distanceToSegment, pickSkyFigure, SKY_LINE_MARGIN_PX, type SkyPickFigure, clampHoverBrightness, HOVER_BRIGHTNESS_DEFAULT, HOVER_BRIGHTNESS_LIMITS, hoverTarget, MOUSE_TOLERANCE_PX, pickCandidatesOf, pickTarget, TapTracker, TOUCH_TAP_SLOP_PX, TOUCH_TOLERANCE_PX, type PickCandidate } from "../src/app/scenePicking";

// Made-up candidates: the module is generic, so no experience or body name matters here (ARCH-01).
const big: PickCandidate = { id: "big", x: 200, y: 200, radiusPx: 40 };
const tiny: PickCandidate = { id: "tiny", x: 400, y: 100, radiusPx: 0.3 };
const named: PickCandidate = { id: "named", x: 100, y: 300, radiusPx: 2, label: { left: 110, top: 292, right: 170, bottom: 308 } };

describe("pickTarget", () => {
  it("hits inside a body's disc", () => {
    expect(pickTarget([big], 220, 210, "mouse")).toBe("big");
  });
  it("hits a sub-pixel body within the pointer's tolerance, more generously for touch", () => {
    expect(pickTarget([tiny], 400 + MOUSE_TOLERANCE_PX - 1, 100, "mouse")).toBe("tiny");
    expect(pickTarget([tiny], 400 + MOUSE_TOLERANCE_PX + 2, 100, "mouse")).toBeNull();
    expect(pickTarget([tiny], 400 + TOUCH_TOLERANCE_PX - 1, 100, "touch")).toBe("tiny");
    expect(pickTarget([tiny], 400 + TOUCH_TOLERANCE_PX + 2, 100, "touch")).toBeNull();
  });
  it("hits a shown label away from the disc", () => {
    expect(pickTarget([named], 160, 300, "mouse")).toBe("named");
  });
  it("ignores a hidden label (no rectangle)", () => {
    expect(pickTarget([{ ...named, label: null }], 160, 300, "mouse")).toBeNull();
  });
  it("lets the nearest hit win where candidates overlap", () => {
    const near: PickCandidate = { id: "near", x: 230, y: 200, radiusPx: 3 };
    expect(pickTarget([big, near], 231, 200, "mouse")).toBe("near");
    expect(pickTarget([near, big], 205, 200, "mouse")).toBe("big");
  });
  it("returns null for empty space", () => {
    expect(pickTarget([big, tiny, named], 600, 500, "touch")).toBeNull();
  });
});

describe("TapTracker", () => {
  it("counts a small move as a tap and a large one as a drag", () => {
    const taps = new TapTracker();
    taps.down(1, 50, 50, "mouse");
    taps.move(1, 52, 51);
    expect(taps.up(1, 52, 51)).toEqual({ x: 52, y: 51 });
    taps.down(1, 50, 50, "mouse");
    taps.move(1, 90, 50);
    expect(taps.up(1, 50, 50)).toBeNull(); // dragged out and back is still a drag
  });
  it("allows a finger a wider wobble than a mouse", () => {
    const touch = new TapTracker();
    touch.down(1, 0, 0, "touch");
    touch.move(1, TOUCH_TAP_SLOP_PX - 1, 0);
    expect(touch.up(1, TOUCH_TAP_SLOP_PX - 1, 0)).not.toBeNull();
    const mouse = new TapTracker();
    mouse.down(1, 0, 0, "mouse");
    mouse.move(1, TOUCH_TAP_SLOP_PX - 1, 0);
    expect(mouse.up(1, TOUCH_TAP_SLOP_PX - 1, 0)).toBeNull();
  });
  it("never counts a pinch, even when one finger lifts and the other stays still", () => {
    const taps = new TapTracker();
    taps.down(1, 10, 10, "touch");
    taps.down(2, 60, 10, "touch");
    expect(taps.up(2, 60, 10)).toBeNull();
    expect(taps.up(1, 10, 10)).toBeNull();
    taps.down(3, 5, 5, "touch"); // a fresh press afterwards is a tap again
    expect(taps.up(3, 5, 5)).not.toBeNull();
  });
  it("never counts a cancelled press, and ignores a release it never saw", () => {
    const taps = new TapTracker();
    taps.down(1, 0, 0, "touch");
    taps.cancel(1);
    expect(taps.up(1, 0, 0)).toBeNull();
    expect(taps.up(9, 0, 0)).toBeNull();
  });
});

describe("pickCandidatesOf", () => {
  // A synthetic composition: two made-up bodies, one made-up tracked subject outside the catalogue, one body set.
  const canvas = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
  const frame = {
    objects: [{ id: "alpha" }, { id: "beta-star" }, { id: "probe" }, { id: "orbit-line" }, { id: "offscreen" }],
    bodyIdFor: (id: string) => ({ alpha: "alpha", "beta-star": "beta" } as Record<string, string>)[id] ?? null,
    bodyScreens: [
      { id: "alpha", x: 0.5, y: 0.25, radiusPx: 12, inView: true, as: "sphere" },
      { id: "beta", x: 0.1, y: 0.9, radiusPx: 0.2, inView: true, as: "marker" },
      { id: "gone", x: 0.5, y: 0.5, radiusPx: 5, inView: false, as: "sphere" },
    ],
    widthPx: 800,
    heightPx: 400,
    labelRects: new Map([["alpha", { left: 430, top: 110, right: 480, bottom: 126 }]]),
    canvas,
    bodySetViews: [{ layer: { members: [{ id: "m0" }, { id: "m1" }] }, screen: [{ x: 5, y: 6, radiusPx: 1, visible: true }, { x: 7, y: 8, radiusPx: 1, visible: false }] }],
  };
  const candidates = pickCandidatesOf(frame);

  it("offers catalogued bodies on screen and visible set members, in canvas pixels", () => {
    expect(candidates.map((c) => c.id)).toEqual(["alpha", "beta-star", "m0"]);
    expect(candidates[0]).toMatchObject({ x: 400, y: 100, radiusPx: 12, label: { left: 420, top: 90, right: 470, bottom: 106 } });
  });
  it("makes a body that is not an Apollo or Jupiter one tappable, and a tracked non-catalogue subject or orbit line not (ARCH-01, ARCH-03)", () => {
    expect(pickTarget(candidates, 400, 100, "mouse")).toBe("alpha");
    expect(pickTarget(candidates, 80, 360, "touch")).toBe("beta-star");
    expect(candidates.some((c) => c.id === "probe" || c.id === "orbit-line" || c.id === "offscreen")).toBe(false);
  });
  it("keeps a shown name a target when its body is not drawn in view, and only the name answers", () => {
    const hidden = { ...frame, objects: [...frame.objects, { id: "gamma" }], bodyIdFor: (id: string) => (id === "gamma" ? "gone" : frame.bodyIdFor(id)) };
    expect(pickCandidatesOf(hidden).some((c) => c.id === "gamma")).toBe(false);
    const named = pickCandidatesOf({ ...hidden, labelRects: new Map([...frame.labelRects, ["gamma", { left: 610, top: 300, right: 660, bottom: 316 }]]) });
    expect(pickTarget(named, 625, 288, "touch")).toBe("gamma");
    expect(pickTarget(named, 400, 180, "touch")).toBeNull();
  });
});

describe("hover", () => {
  const all = [big, tiny, named];
  it("resolves the same target as a tap at the same point", () => {
    for (const [x, y] of [[220, 210], [404, 100], [160, 300], [600, 600]] as const) {
      expect(hoverTarget(all, x, y, "mouse")).toBe(pickTarget(all, x, y, "mouse"));
    }
  });
  it("gives no hover for touch or pen", () => {
    expect(hoverTarget(all, 220, 210, "touch")).toBeNull();
    expect(hoverTarget(all, 220, 210, "pen")).toBeNull();
  });
  it("keeps the brightness setting in its limits", () => {
    expect(HOVER_BRIGHTNESS_DEFAULT).toBeGreaterThanOrEqual(HOVER_BRIGHTNESS_LIMITS.min);
    expect(HOVER_BRIGHTNESS_DEFAULT).toBeLessThanOrEqual(HOVER_BRIGHTNESS_LIMITS.max);
    expect(clampHoverBrightness(0.2)).toBe(HOVER_BRIGHTNESS_LIMITS.min);
    expect(clampHoverBrightness(9)).toBe(HOVER_BRIGHTNESS_LIMITS.max);
    expect(clampHoverBrightness(Number.NaN)).toBe(HOVER_BRIGHTNESS_DEFAULT);
    expect(clampHoverBrightness(1.7)).toBe(1.7);
  });
});

// O-066 T-299: the sky-figure tap rule on made-up screen lines (ARCH-03).
describe("pickSkyFigure", () => {
  const kite: SkyPickFigure = { id: "kite", lines: [[100, 100, 200, 100], [200, 100, 200, 200]], label: { left: 300, top: 50, right: 360, bottom: 70 } };
  const ring: SkyPickFigure = { id: "ring", lines: [[400, 100, 500, 100], [500, 100, 450, 200], [450, 200, 400, 100]], label: null };
  it("measures the distance to a segment, to its end beyond the span, and for a point-like one", () => {
    expect(distanceToSegment(150, 110, 100, 100, 200, 100)).toBeCloseTo(10, 9);
    expect(distanceToSegment(230, 140, 100, 100, 200, 100)).toBeCloseTo(Math.hypot(30, 40), 9);
    expect(distanceToSegment(3, 4, 0, 0, 0, 0)).toBe(5);
  });
  it("selects within the margin of a line, and nothing farther", () => {
    expect(pickSkyFigure([kite, ring], 150, 100 + SKY_LINE_MARGIN_PX - 1)).toBe("kite");
    expect(pickSkyFigure([kite, ring], 150, 100 + SKY_LINE_MARGIN_PX + 1)).toBeNull();
  });
  it("selects on a shown name, away from every line", () => {
    expect(pickSkyFigure([kite, ring], 330, 60)).toBe("kite");
  });
  it("selects nothing inside an outline, away from its lines and name", () => {
    expect(pickSkyFigure([ring], 450, 120)).toBeNull();
    expect(pickSkyFigure([ring], 450, 100 + SKY_LINE_MARGIN_PX - 1)).toBe("ring");
  });
  it("lets the nearer line win where two figures are close, and a name win over a line", () => {
    const near: SkyPickFigure = { id: "near", lines: [[100, 106, 200, 106]] };
    expect(pickSkyFigure([kite, near], 150, 104)).toBe("near");
    expect(pickSkyFigure([kite, near], 150, 101)).toBe("kite");
    expect(pickSkyFigure([{ id: "named", lines: [], label: { left: 140, top: 90, right: 160, bottom: 110 } }, kite], 150, 100)).toBe("named");
  });
  it("selects nothing from no figures", () => {
    expect(pickSkyFigure([], 10, 10)).toBeNull();
  });
});

describe("projectSegmentClipped (O-066 T-299)", () => {
  const project = (a: [number, number, number], b: [number, number, number]) => projectSegmentClipped(a, b, Math.tan(Math.PI / 6), 4 / 3, 800, 600);
  it("keeps a long line crossing the screen with both ends off screen, tappable in the middle", () => {
    const [x1, y1, x2, y2] = project([-50, 0, -10], [50, 0, -10])!;
    expect(x1).toBeLessThan(0);
    expect(x2).toBeGreaterThan(800);
    expect(distanceToSegment(400, 310, x1, y1, x2, y2)).toBeLessThan(16);
  });
  it("drops a line wholly behind the camera", () => {
    expect(project([-1, 0, 5], [1, 0, 8])).toBeNull();
  });
  it("keeps the visible part of a line with one end behind the camera", () => {
    const [x1, y1, x2, y2] = project([0, 0, -10], [0, 5, 10])!;
    expect(x1).toBeCloseTo(400, 6);
    expect(y1).toBeCloseTo(300, 6);
    expect(x2).toBeCloseTo(400, 6);
    expect(y2).toBeLessThan(0); // runs up past the top edge toward the camera plane
    expect(distanceToSegment(400, 200, x1, y1, x2, y2)).toBeLessThan(1);
  });
});
