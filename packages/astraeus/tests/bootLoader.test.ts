// @vitest-environment happy-dom
// The loading fade time the viewer keeps (O-055 T-255). The loading cover itself, hiding it included, belongs to the demo site (`packages/astraeus-site/tests/bootCover.test.ts`, O-059 T-272).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveLook } from "../src/app/look";
import { BOOT_FADE_DEFAULT_SECONDS, bootFadeSeconds, saveBootFadeSeconds } from "../src/shell/bootLoader";

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { document.body.innerHTML = ""; });

describe("loading fade time", () => {
  it("fades for the default time, a saved time, or the address's time, kept in range", () => {
    expect(bootFadeSeconds(resolveLook(undefined, ""))).toBe(BOOT_FADE_DEFAULT_SECONDS);
    saveBootFadeSeconds(1.5);
    expect(bootFadeSeconds(resolveLook(undefined, ""))).toBe(1.5);
    expect(bootFadeSeconds(resolveLook(undefined, "?loadfade=0.2"))).toBe(0.2);
    expect(bootFadeSeconds(resolveLook(undefined, "?loadfade=3"))).toBe(3);
  });
});
