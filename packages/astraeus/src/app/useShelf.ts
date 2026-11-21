// The viewer's side of the shelf (viewer-interface note, section 11). Job: from the scene's parts and the showing view, work out the parts to draw, make the per-viewer elements of
// the custom blocks, apply the host's `PanelControl.setOpen` (silently) and report a visitor's open or close to the host link. It decides no place (the panel rule does) and names no part.
import { useCallback, useMemo, useRef, useState } from "react";
import type { ShelfPart, ShelfRuntime } from "./shelfContract";
import type { ShelfControl, ViewerPort } from "./viewerPort";
import type { ResolvedView } from "./views";

const NONE: readonly ShelfPart[] = [];

/** One host call to open or close a panel, applied by the shell once per `serial`. */
export interface ShelfRequest { readonly id: string; readonly open: boolean; readonly serial: number }

export interface ShelfState {
  /** The parts the showing view shows, in the scene's order. */
  readonly shown: readonly ShelfPart[];
  readonly runtime: ShelfRuntime;
  readonly request: ShelfRequest | null;
  /** The shell's report of the open panel (null: none). */
  readonly onOpenChange: (id: string | null) => void;
  /** What the viewer hands its link; absent when the scene has no parts. */
  readonly control: ShelfControl | undefined;
}

/** A part whose id some view lists shows only in those views; any other part shows in every view (the view rule: `ResolvedView.panels`). */
export function shownParts(parts: readonly ShelfPart[], view: ResolvedView | undefined): readonly ShelfPart[] {
  return view === undefined ? parts : parts.filter((part) => view.panels.has(part.id));
}

export function useShelf(parts: readonly ShelfPart[] | undefined, view: ResolvedView | undefined, host: ViewerPort | undefined): ShelfState {
  const all = parts ?? NONE;
  // One element per custom block, per viewer: made here, so two viewers (or a rebuilt one) never share one.
  const elements = useMemo(() => new Map(typeof document === "undefined" ? [] : all.flatMap((part) => part.blocks.filter((block) => block.kind === "customBlock").map((block) => [block.id, document.createElement("div")] as const))), [all]);
  const shown = useMemo(() => shownParts(all, view), [all, view]);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const [request, setRequest] = useState<ShelfRequest | null>(null);
  /** The open panel as the host reads it (a host call is read at once), and the open panel the shell last reported. */
  const open = useRef<string | null>(null);
  const reported = useRef<string | null>(null);
  /** Set by a host call that changes the open panel, so the report that follows it is not told to the host (setters are silent). */
  const silent = useRef(false);
  const control = useMemo<ShelfControl | undefined>(() => {
    if (all.length === 0) return undefined;
    const kinds = new Map(all.flatMap((part) => [[part.id, "panel"] as const, ...part.blocks.map((block) => [block.id, block.kind as "customBlock"] as const)]));
    return {
      kinds, elements,
      isOpen: (id) => open.current === id,
      setOpen: (id, wanted) => {
        // A panel the showing view does not show cannot open; asking to close a closed one changes nothing.
        if ((wanted && !shownRef.current.some((part) => part.id === id)) || (open.current === id) === wanted) return;
        silent.current = true;
        open.current = wanted ? id : null;
        setRequest((previous) => ({ id, open: wanted, serial: (previous?.serial ?? 0) + 1 }));
      },
    };
  }, [all, elements]);
  const onOpenChange = useCallback((id: string | null) => {
    const before = reported.current;
    reported.current = id;
    open.current = id;
    if (before === id) return;
    // A host call's own change is silent; so is a panel the showing view dropped (the view switch is what the host hears, `onChange`).
    const dropped = before !== null && id === null && !shownRef.current.some((part) => part.id === before);
    if (silent.current) { silent.current = false; return; }
    if (dropped) return;
    if (before !== null) host?.partOpened(before, false);
    if (id !== null) host?.partOpened(id, true);
  }, [host]);
  const runtime = useMemo<ShelfRuntime>(() => ({ element: (id) => elements.get(id) }), [elements]);
  return { shown, runtime, request, onOpenChange, control };
}
