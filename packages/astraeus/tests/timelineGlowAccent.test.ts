// I-186: the timeline's played glow follows the look's accent. By default the glow names no colour, so the played gradient is built from
// `var(--astraeus-accent)` (and the part ahead from `var(--astraeus-glow)`), which the browser resolves at the viewer root: a host's `interface.accent`
// (set there as `--astraeus-accent` by interfaceLookVars) recolours it. A colour set in the Developer drawer still overrides the token.
import { describe, expect, it } from "vitest";
import { DEFAULT_TIMELINE_GLOW, glowGradient, glowProfile } from "../src/shell/timelineGlow";
import { interfaceLookVars } from "../src/shell/look/interfaceLook";

const PROFILE = glowProfile([{ id: "w", label: "W", startUtcMs: 0, endUtcMs: 100, rate: { unit: "per hour", samples: [{ timeUtcMs: 0, value: 1 }, { timeUtcMs: 50, value: 10 }, { timeUtcMs: 100, value: 1 }] } }] as never, { startUtcMs: 0, endUtcMs: 100 });

describe("the played glow follows the accent (I-186)", () => {
  it.each([["a rate profile", PROFILE], ["the even glow", null]] as const)("with %s, the default played gradient reads the accent token and types no colour", (_name, profile) => {
    const played = glowGradient(profile, DEFAULT_TIMELINE_GLOW, "played");
    expect(played).toContain("var(--astraeus-accent)");
    expect(played).not.toMatch(/#|rgba?\(/);
    const ahead = glowGradient(profile, DEFAULT_TIMELINE_GLOW, "ahead");
    expect(ahead).toContain("var(--astraeus-glow)");
    expect(ahead).not.toMatch(/#|rgba?\(/);
  });
  it("the default look names no glow colour", () => {
    expect(DEFAULT_TIMELINE_GLOW.playedColor).toBeUndefined();
    expect(DEFAULT_TIMELINE_GLOW.color).toBeUndefined();
  });
  it("a host accent reaches the token the gradient reads", () => {
    expect((interfaceLookVars({ accent: "#3399ff" }, false) as Record<string, string>)["--astraeus-accent"]).toBe("#3399ff");
  });
  it("a played colour set in the Developer drawer overrides the accent, at the same opacities", () => {
    const set = glowGradient(PROFILE, { ...DEFAULT_TIMELINE_GLOW, playedColor: "#102030" }, "played");
    expect(set).toContain("rgba(16, 32, 48,");
    expect(set).not.toContain("var(--astraeus-accent)");
    const setAlphas = [...set.matchAll(/rgba\(16, 32, 48, (\d\.\d+)\)/g)].map((m) => Number(m[1]).toFixed(2));
    const tokenAlphas = [...glowGradient(PROFILE, DEFAULT_TIMELINE_GLOW, "played").matchAll(/var\(--astraeus-accent\) (\d+\.\d)%/g)].map((m) => (Number(m[1]) / 100).toFixed(2));
    expect(setAlphas.length).toBeGreaterThan(2);
    expect(setAlphas).toEqual(tokenAlphas);
  });
});
