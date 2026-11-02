// @vitest-environment happy-dom
// The demo site's loading cover (O-055 T-255): the parts that left the engine. The page's own `#boot` is brought back for a switch, set to its failure message, and claimed by
// each scene as it mounts so a scene mounted before the latest showing cannot hide it (I-074). Hiding it is the engine's (packages/astraeus/tests/bootLoader.test.ts).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBootCover } from "../src/bootCover";

const MARKUP = '<div id="boot" role="status" data-state="loading"><span class="loading">Loading</span><span class="failed">Failed</span></div>';
const boot = (): HTMLElement | null => document.getElementById("boot");
beforeEach(() => { document.body.innerHTML = MARKUP; });
afterEach(() => { document.body.innerHTML = ""; });

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
