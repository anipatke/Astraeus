/**
 * The one place the viewer touches the page address (O-052 T-223). It reads or writes the address only when the host turned `address` on;
 * every parameter reader takes the search text this gives, so a new parameter cannot bypass the switch (`tests/addressRule.test.ts`).
 * The developer data switch navigates the page itself and is the only other reader, listed in that test.
 */
import { viewLinkSearch, type ViewLinkState } from "./viewLink";

/** The address search (`?a=b`) the viewer may read: the page's when `enabled`, else empty, as if the address carried nothing. */
export function addressSearch(enabled: boolean | undefined): string {
  return enabled === true ? window.location.search : "";
}

/**
 * Writes the view link into the address (so a reload keeps the view), then copies the full link. `copied` is false when the clipboard refuses; the caller then shows the link to copy by hand.
 * Only called with the address option on; the copy-link button is not offered otherwise.
 */
export async function shareViewLink(state: ViewLinkState): Promise<{ readonly url: string; readonly copied: boolean }> {
  const search = viewLinkSearch(window.location.search, state);
  try { window.history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`); } catch { /* the link below still works */ }
  const url = `${window.location.origin}${window.location.pathname}${search}`;
  let copied = false;
  try { await navigator.clipboard.writeText(url); copied = true; } catch { copied = false; }
  return { url, copied };
}
