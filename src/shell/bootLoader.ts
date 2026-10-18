// The loading screen is plain markup and styles in app.html (so it shows before any script); this module only ends it.
// It knows nothing of any demo: `hideBootLoader` is called once, on the scene's first drawn frame, and `failBootLoader` when the start fails.

export const BOOT_FADE_DEFAULT_SECONDS = 0.6;
export const BOOT_FADE_LIMITS = { min: 0, max: 3 } as const;
const STORAGE_KEY = "astraeus.loadFade";

function clampFade(seconds: number): number {
  return Number.isFinite(seconds) ? Math.min(BOOT_FADE_LIMITS.max, Math.max(BOOT_FADE_LIMITS.min, seconds)) : BOOT_FADE_DEFAULT_SECONDS;
}

/** The fade time in force: `?loadfade=<seconds>`, else the saved setting, else the default. */
export function bootFadeSeconds(search: string = window.location.search): number {
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

/** Fades the loader out and removes it. Safe to call more than once. */
export function hideBootLoader(): void {
  const boot = document.getElementById("boot");
  if (boot === null || boot.dataset.state === "done" || boot.dataset.state === "failed") return;
  const seconds = bootFadeSeconds();
  boot.style.setProperty("--boot-fade", `${seconds}s`);
  boot.dataset.state = "done";
  window.setTimeout(() => boot.remove(), seconds * 1000 + 100);
}

/** Replaces the loader's animation with its failure message. */
export function failBootLoader(): void {
  const boot = document.getElementById("boot");
  if (boot !== null) boot.dataset.state = "failed";
}
