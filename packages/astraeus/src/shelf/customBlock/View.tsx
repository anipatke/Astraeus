// Part: the custom block's view, the element the host fills, drawn inside a panel. It must not fill the element, set a place, layer or raw value, or open another part.
import { useEffect, useRef } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";

/** Puts the viewer's element for this block into the panel while the panel is open, and takes it out again when it closes (the element and what the host put in it stay alive). */
export function CustomBlockView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const slot = useRef<HTMLDivElement | null>(null);
  const element = runtime.element(block.id);
  useEffect(() => {
    const host = slot.current;
    if (host === null || element === undefined) return undefined;
    host.appendChild(element);
    return () => { if (element.parentNode === host) host.removeChild(element); };
  }, [element]);
  return <div className="shelf-custom-block" data-shelf-block={block.id} ref={slot} />;
}
