// The one place that decides "this app sits inside another page" (T-082, O-020 Decision 5). The shell sets `data-embedded` from this and
// embedded.css keys on that attribute. Detection, not an address flag: the portfolio's iframe addresses are public and fixed, so the app
// must recognise a frame by itself; a flag would also need every embedding page to remember it.
// `window.top` can throw or differ across origins; any doubt counts as framed, since a page that cannot be reached is not the top page.

/** Whether this page is shown inside a frame (an iframe on another page). */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
