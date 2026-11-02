// @vitest-environment happy-dom
// The loading cover (O-055 T-255): the engine fades out only the cover a host hands it and never looks one up on the page. Showing it again and failing it belong to the demo
// site (`packages/astraeus-site/tests/bootCover.test.ts`). The first-frame path is one table: what the handed cover does under each situation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_FADE_DEFAULT_SECONDS, bootFadeSeconds, hideBootLoader, saveBootFadeSeconds } from "../src/shell/bootLoader";
import { createFrameState } from "../src/app/sceneFrame";

let cover: HTMLElement;
const coverOf = (): HTMLElement | null => cover.isConnected ? cover : null;
beforeEach(() => {
  window.localStorage.clear();
  cover = document.createElement("div");
  cover.dataset.state = "loading";
  document.body.append(cover);
  vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

describe("loading fade time", () => {
  it("fades for the default time, a saved time, or the address's time, kept in range", () => {
    expect(bootFadeSeconds("")).toBe(BOOT_FADE_DEFAULT_SECONDS);
    saveBootFadeSeconds(1.5);
    expect(bootFadeSeconds("")).toBe(1.5);
    expect(bootFadeSeconds("?loadfade=0.2")).toBe(0.2);
    expect(bootFadeSeconds("?loadfade=99")).toBe(3);
  });
});

describe("the first frame hides the handed cover", () => {
  it("hides once, sets the fade, then removes the cover after the fade", () => {
    hideBootLoader(coverOf, 0.5);
    expect(cover.dataset.state).toBe("done");
    expect(cover.style.getPropertyValue("--boot-fade")).toBe("0.5s");
    hideBootLoader(coverOf, 0.5);
    expect(cover.isConnected).toBe(true);
    vi.advanceTimersByTime(599);
    expect(cover.isConnected).toBe(true);
    vi.advanceTimersByTime(2);
    expect(cover.isConnected).toBe(false);
  });
  it("leaves a failed cover showing its message", () => {
    cover.dataset.state = "failed";
    hideBootLoader(coverOf);
    vi.advanceTimersByTime(5000);
    expect(cover.dataset.state).toBe("failed");
    expect(cover.isConnected).toBe(true);
  });
  it("does nothing when the host hands in no cover element (a later showing took it away, or the page has none)", () => {
    expect(() => hideBootLoader(() => null)).not.toThrow();
    expect(cover.dataset.state).toBe("loading");
  });
  it("stays when the host brings it back during the fade, and a later hide still fades and removes it (I-074)", () => {
    hideBootLoader(coverOf);
    vi.advanceTimersByTime(300);
    cover.dataset.state = "loading"; // the host's show-again
    vi.advanceTimersByTime(5000);
    expect(cover.isConnected).toBe(true);
    expect(cover.dataset.state).toBe("loading");
    hideBootLoader(coverOf);
    expect(cover.dataset.state).toBe("done");
    vi.advanceTimersByTime(1000);
    expect(cover.isConnected).toBe(false);
  });
  it("a hide after a show-again is not cut short by the earlier hide's removal timer", () => {
    hideBootLoader(coverOf, 1);
    vi.advanceTimersByTime(300);
    cover.dataset.state = "loading";
    vi.advanceTimersByTime(100);
    hideBootLoader(coverOf, 1); // would fade until 1400 ms; the first timer (1100 ms) must not remove it early
    vi.advanceTimersByTime(750);
    expect(cover.isConnected).toBe(true);
    vi.advanceTimersByTime(400);
    expect(cover.isConnected).toBe(false);
  });
  it("an element the engine was not handed is never touched: a page's own #boot beside a scene that claims no cover", () => {
    cover.id = "boot";
    const state = createFrameState("solar-system");
    expect(state.cover).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(document.getElementById("boot")).toBe(cover);
    expect(cover.dataset.state).toBe("loading");
  });
  it("a scene claims the cover once, when it mounts, and keeps what the claim gave it", () => {
    const reach = () => cover;
    const claim = vi.fn(() => reach);
    const state = createFrameState("solar-system", claim);
    createFrameState("solar-system", claim);
    expect(claim).toHaveBeenCalledTimes(2);
    expect(state.cover).toBe(reach);
  });
});
