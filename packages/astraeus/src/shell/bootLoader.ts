// The loading fade time the viewer keeps: the look's `loadFadeSeconds`, the Developer drawer's saved setting, else the default.
// The cover itself belongs to the host page (the demo site owns its markup, showing, fading and failure); the engine never looks one up.

export const BOOT_FADE_DEFAULT_SECONDS = 0.6;
export const BOOT_FADE_LIMITS = { min: 0, max: 3 } as const;
const STORAGE_KEY = "astraeus.loadFade";

function clampFade(seconds: number): number {
  return Number.isFinite(seconds) ? Math.min(BOOT_FADE_LIMITS.max, Math.max(BOOT_FADE_LIMITS.min, seconds)) : BOOT_FADE_DEFAULT_SECONDS;
}

/** The fade time in force: the look's `loadFadeSeconds` (the scene's, or the address's over it), else the saved setting, else the default. */
export function bootFadeSeconds(look: { readonly loadFadeSeconds?: number } = {}): number {
  if (look.loadFadeSeconds !== undefined) return clampFade(look.loadFadeSeconds);
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
