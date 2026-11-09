import { useEffect, useState, type ReactElement } from "react";
import { bootFadeSeconds } from "../shell/bootLoader";

/** What the cover reads of the host link (`ViewerLink` in api/ has both): the first-draw signal and the looks in force. */
export interface CoverSource {
  onFirstDraw(listener: () => void): () => void;
  readonly look: { readonly loadFadeSeconds: number } | undefined;
}

/** What the cover is doing: covering the viewer, fading out over the `loadFadeSeconds` look, or gone (removed from the page). */
type CoverState = "covering" | "fading" | "gone";

const reducedMotion = (): boolean => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The ready-made loading cover (`loadingCover: true` on `mount` and `<AstraeusScene>`, O-061 T-288): a plain dark layer over the viewer's own area, from the first render until the
 * scene's first drawn frame (the signal behind `onFirstDraw`), then a fade over the `loadFadeSeconds` look in force and removal. Under `prefers-reduced-motion` it is removed at once.
 * It covers the first frame of a viewer only; a rebuild with a new scene does not bring it back. It is a child of the viewer's root element (styled as `.astraeus-shell .astraeus-loading-cover` in `app/style.css`); until the scene's data has loaded, `LoadingShell` is that root. Lives in `app/` beside the viewer (api/ may not hold viewer parts).
 */
export function LoadingCover({ link }: { readonly link: CoverSource }): ReactElement | null {
  const [state, setState] = useState<CoverState>("covering");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => link.onFirstDraw(() => {
    if (reducedMotion()) { setState("gone"); return; }
    setSeconds(bootFadeSeconds(link.look));
    setState("fading");
  }), [link]);
  useEffect(() => {
    if (state !== "fading") return undefined;
    const timer = setTimeout(() => setState("gone"), seconds * 1000 + 50);
    return () => clearTimeout(timer);
  }, [state, seconds]);
  if (state === "gone") return null;
  return <div className="astraeus-loading-cover" data-state={state} aria-hidden="true" style={state === "fading" ? { transitionDuration: `${seconds}s` } : undefined} />;
}

/** The viewer's root element before the scene's data has loaded (nothing else is drawn yet): the cover alone in a root. The real shell replaces it, never sits beside it. */
export function LoadingShell({ link }: { readonly link: CoverSource }): ReactElement {
  return <main className="astraeus-shell"><LoadingCover link={link} /></main>;
}
