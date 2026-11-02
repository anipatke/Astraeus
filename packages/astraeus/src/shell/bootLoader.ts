// The loading cover belongs to the host page (the demo site owns its markup, showing and failure); this module only fades out the one a host hands in.
// It knows nothing of any demo or page: `hideBootLoader` is called on each scene's first drawn frame with the host's cover, and never looks one up.

export const BOOT_FADE_DEFAULT_SECONDS = 0.6;
export const BOOT_FADE_LIMITS = { min: 0, max: 3 } as const;
const STORAGE_KEY = "astraeus.loadFade";

function clampFade(seconds: number): number {
  return Number.isFinite(seconds) ? Math.min(BOOT_FADE_LIMITS.max, Math.max(BOOT_FADE_LIMITS.min, seconds)) : BOOT_FADE_DEFAULT_SECONDS;
}

/** The fade time in force: `?loadfade=<seconds>` in `search` (the address text the viewer may read, see `app/address.ts`), else the saved setting, else the default. */
export function bootFadeSeconds(search: string): number {
  const asked = new URLSearchParams(search).get("loadfade");
  if (asked !== null && asked.trim() !== "") return clampFade(Number(asked));
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return clampFade(Number(saved));
  } catch { /* storage unavailable: the default stands */ }
  return BOOT_FADE_DEFAULT_SECONDS;
}

/** Saves the fade time for the next load. */
export function saveBootFadeSeconds(seconds: number): void {
  try { window.localStorage.setItem(STORAGE_KEY, String(clampFade(seconds))); } catch { /* not saved */ }
}

/**
 * What a host hands the viewer so its first frame can hide the host's loading cover: called once when a scene mounts, it returns the way to reach the cover at hide time
 * (null once the cover is not that mounting's to hide). The engine never looks a cover up on the page.
 */
export type CoverClaim = () => () => HTMLElement | null;

// The removal each cover's hide scheduled after its fade, cancelled when the same cover is hidden again (the host brings it back and a later scene hides it, I-074).
const removals = new WeakMap<HTMLElement, number>();

/** Fades the handed cover out and removes it. Safe to call more than once; a cover that is absent, done or failed is left alone. */
export function hideBootLoader(cover: () => HTMLElement | null, seconds: number = bootFadeSeconds("")): void {
  const boot = cover();
  if (boot === null || boot.dataset.state === "done" || boot.dataset.state === "failed") return;
  boot.style.setProperty("--boot-fade", `${seconds}s`);
  boot.dataset.state = "done";
  window.clearTimeout(removals.get(boot));
  removals.set(boot, window.setTimeout(() => { removals.delete(boot); if (boot.dataset.state === "done") boot.remove(); }, seconds * 1000 + 100));
}
