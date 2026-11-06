// The demo site's loading cover: the markup is in app.html (so it shows before any script) and belongs to this page, not to the engine.
// The site shows it, fades it out when the scene's first frame is drawn (`onFirstDraw`), brings it back on a switch and fails it; the engine never looks it up.

/** The way to reach the cover at hide time (null once the cover is not that mounting's to hide). */
export type CoverClaim = () => HTMLElement | null;

// The removal each cover's hide scheduled after its fade, cancelled when the same cover is hidden again (the site brings it back and a later scene hides it, I-074).
const removals = new WeakMap<HTMLElement, number>();

/** Fades the claimed cover out and removes it. Safe to call more than once; a cover that is absent, done or failed is left alone. */
export function hideBootLoader(cover: CoverClaim, seconds: number): void {
  const boot = cover();
  if (boot === null || boot.dataset.state === "done" || boot.dataset.state === "failed") return;
  boot.style.setProperty("--boot-fade", `${seconds}s`);
  boot.dataset.state = "done";
  window.clearTimeout(removals.get(boot));
  removals.set(boot, window.setTimeout(() => { removals.delete(boot); if (boot.dataset.state === "done") boot.remove(); }, seconds * 1000 + 100));
}

/** The cover's markup as the page first had it, kept so a switch inside the page can bring the cover back after the engine removed it. */
export interface BootCover {
  /** Brings the cover back for a switch inside the page; a no-op when the page never had one. */
  readonly show: () => void;
  /** Replaces the cover's animation with its failure message. */
  readonly fail: () => void;
  /** Called when a scene mounts: returns the way to reach the cover at its first frame, which yields it only while no later showing has come (I-074). */
  readonly claim: () => CoverClaim;
}

/** The cover of `page`, found by `#boot` in that page only; `page` is the site's own document. */
export function createBootCover(page: Pick<Document, "getElementById" | "body">): BootCover {
  const template = (page.getElementById("boot")?.cloneNode(true) as HTMLElement | null) ?? null;
  // How many times the cover has been brought back, so a scene mounted before the latest showing cannot hide it.
  let showings = 0;
  return {
    show() {
      showings += 1;
      const existing = page.getElementById("boot");
      if (existing !== null) { existing.style.removeProperty("--boot-fade"); existing.dataset.state = "loading"; return; }
      if (template === null) return;
      const boot = template.cloneNode(true) as HTMLElement;
      boot.dataset.state = "loading";
      page.body.prepend(boot);
    },
    fail() {
      const boot = page.getElementById("boot");
      if (boot !== null) boot.dataset.state = "failed";
    },
    claim() {
      const mountedUnder = showings;
      return () => (mountedUnder === showings ? page.getElementById("boot") : null);
    },
  };
}
