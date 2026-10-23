// The loading screen is plain markup and styles in app.html (so it shows before any script); this module only ends it.
// It knows nothing of any demo: `hideBootLoader` is called on each scene's first drawn frame (`showBootLoader` brings the cover back for a switch), and `failBootLoader` when the start fails.

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

// The loader's markup as the page first had it, kept so a switch inside the page can bring the cover back after it was removed.
const bootTemplate: HTMLElement | null = typeof document === "undefined" ? null : (document.getElementById("boot")?.cloneNode(true) as HTMLElement | null) ?? null;

// How many times the cover has been brought back, so a scene mounted before the latest showing cannot hide it (I-074).
let showings = 0;
// The removal a hide scheduled after its fade, cancelled when the cover is shown again before it runs (I-074).
let removal: number | undefined;

/** The cover's current showing; a scene notes it when it mounts and hands it to `hideBootLoader`. */
export function bootShowing(): number {
  return showings;
}

/** Brings the loading cover back (a switch inside the page); a no-op when the page never had one. Hidden again by `hideBootLoader` on the next scene's first frame. */
export function showBootLoader(): void {
  showings += 1;
  if (removal !== undefined) { window.clearTimeout(removal); removal = undefined; }
  const existing = document.getElementById("boot");
  if (existing !== null) { existing.style.removeProperty("--boot-fade"); existing.dataset.state = "loading"; return; }
  if (bootTemplate === null) return;
  const boot = bootTemplate.cloneNode(true) as HTMLElement;
  boot.dataset.state = "loading";
  document.body.prepend(boot);
}

/** Fades the loader out and removes it. Safe to call more than once. A scene passes the showing it mounted under; a later showing is not its to hide. */
export function hideBootLoader(showing: number = showings): void {
  const boot = document.getElementById("boot");
  if (showing !== showings || boot === null || boot.dataset.state === "done" || boot.dataset.state === "failed") return;
  const seconds = bootFadeSeconds();
  boot.style.setProperty("--boot-fade", `${seconds}s`);
  boot.dataset.state = "done";
  removal = window.setTimeout(() => { removal = undefined; boot.remove(); }, seconds * 1000 + 100);
}

/** Replaces the loader's animation with its failure message. */
export function failBootLoader(): void {
  const boot = document.getElementById("boot");
  if (boot !== null) boot.dataset.state = "failed";
}
