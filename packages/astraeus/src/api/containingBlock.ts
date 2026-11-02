/**
 * Makes `element` a containing block for the viewer: the viewer's root is `position: absolute; inset: 0`, so it fills this element only when the element is
 * positioned. A static element becomes `relative` and a visible overflow becomes `hidden`; a position or overflow the host already chose is left alone.
 * Called by `mount` and by `AstraeusScene` for their own element, next to the `isolation` they set (O-055 T-256).
 */
export function makeContainingBlock(element: HTMLElement): void {
  const style = getComputedStyle(element);
  // An empty value is a page with no style engine behind it (a test DOM): the same as the initial `static` and `visible`.
  if (style.position === "static" || style.position === "") element.style.position = "relative";
  if (style.overflow === "visible" || style.overflow === "") element.style.overflow = "hidden";
}
