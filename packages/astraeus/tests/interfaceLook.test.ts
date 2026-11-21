// @vitest-environment happy-dom
// The interface look (O-079 T-330, viewer-interface note section 10, API-06): the public settings have defaults that are the values look.css defines, ranges, a checked
// door (`Scene.setLook`), and reach one viewer's root as inline custom properties, so two viewers on a page keep separate looks (API-03).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import {
  DEFAULT_INTERFACE_LOOK,
  INTERFACE_LOOK_LIMITS,
  interfaceLookOf,
  interfaceLookVars,
} from "../src/shell/look/interfaceLook";
import { mountShell } from "./domSetup";

const LOOK_CSS = readFileSync(join(__dirname, "..", "src", "shell", "look", "look.css"), "utf8");
const token = (name: string): string => new RegExp(`--astraeus-${name}:\\s*([^;]+);`).exec(LOOK_CSS)?.[1]?.trim() ?? "";

describe("interface look defaults", () => {
  it.each(["panel", "text", "muted", "accent", "border", "data"] as const)(
    "%s default is the value look.css defines",
    (name) => {
      expect(token(name)).toBe(DEFAULT_INTERFACE_LOOK[name]);
    },
  );
  it("font, text size and radius defaults are the values look.css defines", () => {
    expect(token("font")).toBe(DEFAULT_INTERFACE_LOOK.fontFamily);
    expect(token("text-size")).toBe(`${DEFAULT_INTERFACE_LOOK.textSizePx}px`);
    expect(token("radius")).toBe(`${DEFAULT_INTERFACE_LOOK.radiusPx}px`);
    expect(token("motion")).toBe(`${DEFAULT_INTERFACE_LOOK.motionMs}ms`);
  });
  it("fills every field the look names and leaves the rest at the default", () => {
    expect(interfaceLookOf({})).toEqual(DEFAULT_INTERFACE_LOOK);
    expect(interfaceLookOf({ interface: { accent: "#123456", motionMs: 0 } })).toEqual({
      ...DEFAULT_INTERFACE_LOOK,
      accent: "#123456",
      motionMs: 0,
    });
  });
});

describe("interface look checks (Scene.setLook, API-06 ranges)", () => {
  it("accepts every field at its limits", () => {
    const { textSizePx, radiusPx, motionMs } = INTERFACE_LOOK_LIMITS;
    for (const value of [textSizePx.min, textSizePx.max])
      expect(() => new Scene().addBody(earth).setLook({ interface: { textSizePx: value } })).not.toThrow();
    for (const value of [radiusPx.min, radiusPx.max])
      expect(() => new Scene().addBody(earth).setLook({ interface: { radiusPx: value } })).not.toThrow();
    for (const value of [motionMs.min, motionMs.max])
      expect(() => new Scene().addBody(earth).setLook({ interface: { motionMs: value } })).not.toThrow();
  });
  it.each([
    ["text size below the range", { textSizePx: 10 }],
    ["text size above the range", { textSizePx: 19 }],
    ["radius below the range", { radiusPx: -1 }],
    ["radius above the range", { radiusPx: 21 }],
    ["motion above the range", { motionMs: 801 }],
    ["a colour the viewer cannot read", { accent: "not a colour" }],
    ["an empty font", { fontFamily: " " }],
    ["an unknown field", { gap: 1 }],
  ])("%s throws bad-look", (_name, value) => {
    expect(() => new Scene().addBody(earth).setLook({ interface: value } as never)).toThrow(
      expect.objectContaining({ code: "bad-look" }),
    );
  });
  it("interface that is not an object throws bad-look", () => {
    expect(() => new Scene().addBody(earth).setLook({ interface: 3 } as never)).toThrow(
      expect.objectContaining({ code: "bad-look" }),
    );
  });
});

describe("interface look as custom properties", () => {
  it("sets nothing for the default look, so look.css stands", () => {
    expect(interfaceLookVars(undefined, false)).toEqual({});
    expect(interfaceLookVars(DEFAULT_INTERFACE_LOOK, false)).toEqual({});
  });
  it("sets each named setting as its custom property", () => {
    expect(
      interfaceLookVars(
        {
          panel: "#111",
          text: "#eee",
          muted: "#bbb",
          accent: "#0af",
          border: "#333",
          data: "#a0a",
          fontFamily: "Georgia, serif",
          textSizePx: 16,
          radiusPx: 4,
          motionMs: 100,
        },
        false,
      ),
    ).toEqual({
      "--astraeus-panel": "#111",
      "--astraeus-text": "#eee",
      "--astraeus-muted": "#bbb",
      "--astraeus-accent": "#0af",
      "--astraeus-border": "#333",
      "--astraeus-data": "#a0a",
      "--astraeus-font": "Georgia, serif",
      "--astraeus-text-size": "16px",
      "--astraeus-radius": "4px",
      "--astraeus-motion": "100ms",
    });
  });
  it("reduced motion forces the motion time to 0 whatever the setting", () => {
    expect(interfaceLookVars({ motionMs: 400 }, true)).toEqual({ "--astraeus-motion": "0ms" });
    expect(interfaceLookVars(undefined, true)).toEqual({ "--astraeus-motion": "0ms" });
  });
});

describe("two viewers keep separate looks (API-03)", () => {
  it("each viewer's root carries only its own look", () => {
    const first = mountShell({ interfaceLook: { accent: "#00aaff", radiusPx: 4 } });
    const second = mountShell({ interfaceLook: { accent: "#ff00aa" } });
    const style = (m: typeof first) => (m.container.querySelector("main.astraeus-shell") as HTMLElement).style;
    expect(style(first).getPropertyValue("--astraeus-accent")).toBe("#00aaff");
    expect(style(first).getPropertyValue("--astraeus-radius")).toBe("4px");
    expect(style(second).getPropertyValue("--astraeus-accent")).toBe("#ff00aa");
    expect(style(second).getPropertyValue("--astraeus-radius")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--astraeus-accent")).toBe("");
    first.unmount();
    second.unmount();
  });
});
