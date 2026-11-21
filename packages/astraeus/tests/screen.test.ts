// @vitest-environment happy-dom
// The areas module's one description of the screen (O-079 T-330, viewer-interface note section 2): the layout follows the VIEWER's own size, the pointer and the
// reduced-motion setting come from two media reads, and nothing else decides "phone". Replaces the window-only phone query tests' role for the new rule.
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { PHONE_QUERY, layoutFor, readScreen, screenAttributes, useScreen } from "../src/shell/areas/screen";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("layoutFor (pure)", () => {
  it.each([
    [700, 900, false, "phone"], [701, 900, false, "wide"], [375, 667, false, "phone"],
    [900, 500, true, "phone"], [900, 500, false, "wide"], [900, 501, true, "wide"], [1280, 720, true, "wide"],
  ] as const)("%ipx by %ipx, coarse %s is %s", (width, height, coarse, layout) => {
    expect(layoutFor(width, height, coarse)).toBe(layout);
  });
});

describe("readScreen", () => {
  it("measures the viewer, not the window: a narrow viewer is a phone whatever the window says", () => {
    pretendScreen({ phone: false });
    expect(readScreen({ width: 400, height: 800 }, false).layout).toBe("phone");
    pretendScreen({ phone: true });
    expect(readScreen({ width: 1000, height: 800 }, false).layout).toBe("wide");
  });
  it("falls back to the window rule until the viewer has a size", () => {
    pretendScreen({ phone: true });
    expect(readScreen(null, false).layout).toBe("phone");
    expect(readScreen({ width: 0, height: 0 }, false).layout).toBe("phone");
    pretendScreen({ phone: false });
    expect(readScreen(null, false).layout).toBe("wide");
  });
  it("reads the pointer and reduced motion, and keeps the frame it was told", () => {
    pretendScreen({ reducedMotion: true });
    expect(readScreen(null, true)).toEqual({ layout: "wide", pointer: "fine", embedded: true, motion: "reduced" });
    pretendScreen({});
    expect(readScreen(null, false).motion).toBe("full");
  });
  it("the window rule is the old phone rule", () => {
    expect(PHONE_QUERY).toContain("max-width: 700px");
    expect(PHONE_QUERY).toContain("max-height: 500px");
    expect(PHONE_QUERY).toContain("pointer: coarse");
  });
  it("writes the four root attributes", () => {
    expect(screenAttributes({ layout: "phone", pointer: "coarse", embedded: false, motion: "reduced" })).toEqual({ "data-phone": true, "data-pointer": "coarse", "data-embedded": false, "data-motion": "reduced" });
  });
});

describe("useScreen follows the viewer's own size", () => {
  let observed: ResizeObserverCallback | undefined;
  const original = globalThis.ResizeObserver;
  afterEach(() => { globalThis.ResizeObserver = original; observed = undefined; });

  it("changes layout when the viewer resizes, with no window change", () => {
    pretendScreen({ phone: false });
    globalThis.ResizeObserver = class { constructor(callback: ResizeObserverCallback) { observed = callback; } observe(): void {} unobserve(): void {} disconnect(): void {} } as unknown as typeof ResizeObserver;
    let width = 1000;
    let layout = "";
    function Probe() {
      const ref = useRef<HTMLDivElement | null>(null);
      layout = useScreen(ref).layout;
      return createElement("div", { ref });
    }
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const box = () => ({ width, height: 800, top: 0, left: 0, right: width, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const nativeRect = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getBoundingClientRect");
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", { configurable: true, value: box });
    act(() => { root.render(createElement(Probe)); });
    expect(layout).toBe("wide");
    width = 320;
    act(() => { observed?.([], {} as ResizeObserver); });
    expect(layout).toBe("phone");
    width = 1000;
    act(() => { observed?.([], {} as ResizeObserver); });
    expect(layout).toBe("wide");
    act(() => root.unmount());
    host.remove();
    if (nativeRect === undefined) delete (HTMLElement.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
    else Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", nativeRect);
  });
});
