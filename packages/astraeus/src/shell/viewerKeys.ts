/** The one class every viewer's root carries (`AstraeusShell`'s `<main>`); a viewer's own parts are the ones inside it. */
export const VIEWER_ROOT_CLASS = "astraeus-shell";

/**
 * Whether a document-level key press is this viewer's to act on (O-055, API-03): it was pressed inside the viewer, or on the bare page (body or document element,
 * where a single viewer has always heard Escape). A key pressed in another viewer or in a host's own control reaches none of this viewer's panels.
 * `part` is any element inside the viewer; the viewer is its nearest root.
 */
export function keyIsForViewer(event: KeyboardEvent, part: Element | null): boolean {
  const target = event.target;
  if (target === null || target === document || target === document.body || target === document.documentElement) return true;
  if (!(target instanceof Node)) return false;
  const viewer = part?.closest(`.${VIEWER_ROOT_CLASS}`) ?? null;
  return viewer !== null && viewer.contains(target);
}
