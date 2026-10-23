import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_FADE_DEFAULT_SECONDS, bootFadeSeconds, bootShowing, failBootLoader, hideBootLoader, saveBootFadeSeconds, showBootLoader } from "../src/shell/bootLoader";

// No DOM in the test environment: a minimal stand-in for the one element, the page and its storage.
let boot: { dataset: Record<string, string>; style: { setProperty: (name: string, value: string) => void; removeProperty: (name: string) => void }; remove: () => void } | null;
let removed: boolean;
let stored: Map<string, string>;
beforeEach(() => {
  removed = false;
  stored = new Map();
  boot = { dataset: { state: "loading" }, style: { setProperty: () => undefined, removeProperty: () => undefined }, remove: () => { removed = true; } };
  vi.useFakeTimers();
  vi.stubGlobal("document", { getElementById: (id: string) => (id === "boot" ? boot : null) });
  vi.stubGlobal("window", {
    location: { search: "" },
    localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); } },
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("loading screen", () => {
  it("fades for the default time, a saved time, or the address's time, kept in range", () => {
    expect(bootFadeSeconds("")).toBe(BOOT_FADE_DEFAULT_SECONDS);
    saveBootFadeSeconds(1.5);
    expect(bootFadeSeconds("")).toBe(1.5);
    expect(bootFadeSeconds("?loadfade=0.2")).toBe(0.2);
    expect(bootFadeSeconds("?loadfade=99")).toBe(3);
  });
  it("hides once, then removes itself after the fade", () => {
    hideBootLoader();
    expect(boot?.dataset.state).toBe("done");
    hideBootLoader();
    expect(removed).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(removed).toBe(true);
  });
  it("shows the failure message instead of hiding", () => {
    failBootLoader();
    hideBootLoader();
    expect(boot?.dataset.state).toBe("failed");
  });
  it("does nothing when the page has no loader", () => {
    boot = null;
    expect(() => { hideBootLoader(); failBootLoader(); }).not.toThrow();
  });
  it("stays when a switch brings it back during the fade, and a later hide still fades and removes it (I-074)", () => {
    hideBootLoader();
    vi.advanceTimersByTime(300);
    showBootLoader();
    vi.advanceTimersByTime(5000);
    expect(removed).toBe(false);
    expect(boot?.dataset.state).toBe("loading");
    hideBootLoader();
    expect(boot?.dataset.state).toBe("done");
    vi.advanceTimersByTime(1000);
    expect(removed).toBe(true);
  });
  it("is not hidden by a scene mounted before the latest showing (I-074)", () => {
    const oldScene = bootShowing();
    showBootLoader();
    const newScene = bootShowing();
    hideBootLoader(oldScene);
    expect(boot?.dataset.state).toBe("loading");
    hideBootLoader(newScene);
    expect(boot?.dataset.state).toBe("done");
  });
});
