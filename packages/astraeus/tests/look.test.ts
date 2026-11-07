// Looks are public settings (O-056 T-261): the set look and the address override each reach the reader, with the address over the look over the default.
import { describe, expect, it, vi } from "vitest";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import { glowLookOf, markerSettingsOf, DEFAULT_BODY_MARKER } from "../src/app/bodyDraw";
import { featureMinBodyPxOf, DEFAULT_FEATURE_MIN_BODY_PX } from "../src/app/FeatureMarkers";
import { LOOK_FIELDS, lookName, lookWith, resolveLook, type LookInput } from "../src/app/look";
import { desktopPicturesOf } from "../src/app/liveLook";
import { BOOT_FADE_DEFAULT_SECONDS, bootFadeSeconds } from "../src/shell/bootLoader";
import { definitionOf } from "../src/api/definitionOf";

const base = { sizePx: 72, brightness: 1, scale: 2.5 };

/** Each look: a value to set, a different value the address asks, and the reader that must show it. */
const CASES: readonly { readonly key: string; readonly set: number | boolean; readonly param: string; readonly asked: string; readonly askedValue: number | boolean; readonly read: (look: LookInput) => unknown; readonly defaultRead: unknown }[] = [
  { key: "starBrightness", set: 1.4, param: "stars", asked: "0.5", askedValue: 0.5, read: (l) => l.starBrightness, defaultRead: undefined },
  { key: "milkyWay", set: true, param: "milkyway", asked: "off", askedValue: false, read: (l) => l.milkyWay, defaultRead: undefined },
  { key: "milkyWayBrightness", set: 1.2, param: "milkywaybrightness", asked: "0.3", askedValue: 0.3, read: (l) => l.milkyWayBrightness, defaultRead: undefined },
  { key: "skyVisible", set: true, param: "sky", asked: "off", askedValue: false, read: (l) => l.skyVisible, defaultRead: undefined },
  { key: "sunGlow.sizePx", set: 100, param: "sunglow", asked: "200", askedValue: 200, read: (l) => glowLookOf(l, base).sizePx, defaultRead: 72 },
  { key: "sunGlow.brightness", set: 1.5, param: "sunbrightness", asked: "0.5", askedValue: 0.5, read: (l) => glowLookOf(l, base).brightness, defaultRead: 1 },
  { key: "sunGlow.scale", set: 4, param: "sunglowscale", asked: "5", askedValue: 5, read: (l) => glowLookOf(l, base).scale, defaultRead: 2.5 },
  { key: "markerSwapRadiusPx", set: 5, param: "markerpx", asked: "9", askedValue: 9, read: (l) => markerSettingsOf(l).minSpherePx, defaultRead: DEFAULT_BODY_MARKER.minSpherePx },
  { key: "featureMinBodyPx", set: 80, param: "featurepx", asked: "120", askedValue: 120, read: featureMinBodyPxOf, defaultRead: DEFAULT_FEATURE_MIN_BODY_PX },
  { key: "loadFadeSeconds", set: 1, param: "loadfade", asked: "2", askedValue: 2, read: bootFadeSeconds, defaultRead: BOOT_FADE_DEFAULT_SECONDS },
  { key: "desktopPictures", set: true, param: "desktop", asked: "off", askedValue: false, read: (l) => desktopPicturesOf({}, l), defaultRead: false },
];

describe("looks are public settings", () => {
  it("covers every look in the table", () => {
    expect(CASES.map((c) => c.key)).toEqual(LOOK_FIELDS.map(lookName));
    expect(CASES.map((c) => c.param)).toEqual(LOOK_FIELDS.map((f) => f.param));
  });

  it.each(CASES)("$key: default, then the scene's look, then the address over it", (c) => {
    expect(c.read(resolveLook(undefined, ""))).toBe(c.defaultRead);
    const field = LOOK_FIELDS.find((f) => lookName(f) === c.key)!;
    const set = lookWith({}, field, c.set);
    expect(c.read(resolveLook(set, ""))).toBe(c.set);
    expect(c.read(resolveLook(set, `?${c.param}=${c.asked}`))).toBe(c.askedValue);
  });

  it("an unusable address value keeps the scene's look and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(resolveLook({ starBrightness: 1.4 }, "?stars=9").starBrightness).toBe(1.4);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("Scene.setLook", () => {
  it("reaches the definition as the scene's look and replaces the whole look", () => {
    const scene = new Scene().addBody(earth).setLook({ starBrightness: 1.4, markerSwapRadiusPx: 5 });
    expect(definitionOf(scene).look).toEqual({ starBrightness: 1.4, markerSwapRadiusPx: 5 });
    scene.setLook({ loadFadeSeconds: 1 });
    expect(definitionOf(scene).look).toEqual({ loadFadeSeconds: 1 });
    expect(definitionOf(new Scene().addBody(earth)).look).toBeUndefined();
  });

  it.each([
    ["an unknown look", { stars: 1 }],
    ["a number out of range", { starBrightness: 2.5 }],
    ["a negative size", { markerSwapRadiusPx: -1 }],
    ["not a number", { sunGlow: { scale: Number.NaN } }],
    ["an unknown glow look", { sunGlow: { size: 1 } }],
    ["glow that is not an object", { sunGlow: 3 }],
    ["a string for a number", { loadFadeSeconds: "1" }],
    ["a number for a switch", { milkyWay: 1 }],
    ["not an object", null],
  ])("%s throws bad-look", (_name, look) => {
    expect(() => new Scene().setLook(look as never)).toThrow(expect.objectContaining({ code: "bad-look", name: "SceneError" }));
  });

  it("is frozen after a viewer takes the scene, like every mutator", async () => {
    const { markMounted } = await import("../src/api/sceneFreeze");
    const scene = new Scene().addBody(earth);
    markMounted(scene);
    expect(() => scene.setLook({})).toThrow(expect.objectContaining({ code: "scene-mounted" }));
  });
});
