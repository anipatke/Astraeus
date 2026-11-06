// @vitest-environment happy-dom
// The demo site's loading cover (O-055 T-255, O-059 T-272). The page's own `#boot` is brought back for a switch, set to its failure message, claimed by each scene as it mounts so a scene
// mounted before the latest showing cannot hide it (I-074), and faded out and removed when a scene's first frame is drawn (moved here from the engine's bootLoader test).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBootCover, hideBootLoader } from "../src/bootCover";

const MARKUP = '<div id="boot" role="status" data-state="loading"><span class="loading">Loading</span><span class="failed">Failed</span></div>';
const boot = (): HTMLElement | null => document.getElementById("boot");
beforeEach(() => { document.body.innerHTML = MARKUP; });
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

describe("the site's cover", () => {
  it("show again on a switch: an existing cover returns to loading with its fade cleared", () => {
    const cover = createBootCover(document);
    boot()!.dataset.state = "done";
    boot()!.style.setProperty("--boot-fade", "2s");
    cover.show();
    expect(boot()!.dataset.state).toBe("loading");
    expect(boot()!.style.getPropertyValue("--boot-fade")).toBe("");
  });
  it("show again after the engine removed it: a fresh copy of the first markup is put back at the top of the page", () => {
    const cover = createBootCover(document);
    boot()!.remove();
    document.body.append(document.createElement("main"));
    cover.show();
    expect(document.body.firstElementChild).toBe(boot());
    expect(boot()!.dataset.state).toBe("loading");
    expect(boot()!.querySelector(".failed")).not.toBeNull();
  });
  it("fail: the cover shows its failure message, and a cover that is gone stays gone", () => {
    const cover = createBootCover(document);
    cover.fail();
    expect(boot()!.dataset.state).toBe("failed");
    boot()!.remove();
    expect(() => cover.fail()).not.toThrow();
    expect(boot()).toBeNull();
  });
  it("a scene's claim reaches the cover until a later showing, and then reaches nothing (I-074)", () => {
    const cover = createBootCover(document);
    const oldScene = cover.claim();
    expect(oldScene()).toBe(boot());
    cover.show();
    const newScene = cover.claim();
    expect(oldScene()).toBeNull();
    expect(newScene()).toBe(boot());
  });
  it("a page that never had a cover: show and fail do nothing, and a claim reaches nothing", () => {
    document.body.innerHTML = "";
    const cover = createBootCover(document);
    expect(() => { cover.show(); cover.fail(); }).not.toThrow();
    expect(cover.claim()()).toBeNull();
    expect(boot()).toBeNull();
  });
});

describe("hiding the cover at a scene's first frame", () => {
  const coverOf = (): HTMLElement | null => boot();
  beforeEach(() => { vi.useFakeTimers(); });
  it("hides once, sets the fade, then removes the cover after the fade", () => {
    const cover = boot()!;
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
    const cover = boot()!;
    cover.dataset.state = "failed";
    hideBootLoader(coverOf, 0.6);
    vi.advanceTimersByTime(5000);
    expect(cover.dataset.state).toBe("failed");
    expect(cover.isConnected).toBe(true);
  });
  it("does nothing when no cover is reachable (a later showing took it away, or the page has none)", () => {
    expect(() => hideBootLoader(() => null, 0.6)).not.toThrow();
    expect(boot()!.dataset.state).toBe("loading");
  });
  it("stays when the page brings it back during the fade, and a later hide still fades and removes it (I-074)", () => {
    const cover = boot()!;
    hideBootLoader(coverOf, 0.6);
    vi.advanceTimersByTime(300);
    cover.dataset.state = "loading";
    vi.advanceTimersByTime(5000);
    expect(cover.isConnected).toBe(true);
    expect(cover.dataset.state).toBe("loading");
    hideBootLoader(coverOf, 0.6);
    expect(cover.dataset.state).toBe("done");
    vi.advanceTimersByTime(1000);
    expect(cover.isConnected).toBe(false);
  });
  it("a hide after a show-again is not cut short by the earlier hide's removal timer", () => {
    const cover = boot()!;
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
});
