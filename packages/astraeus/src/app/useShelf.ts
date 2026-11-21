// The viewer's side of the shelf (viewer-interface note, section 11). Job: from the scene's parts and the showing view, work out the parts to draw, make the per-viewer elements of
// the custom blocks, apply the host's `PanelControl.setOpen` (silently) and report a visitor's open or close to the host link. It decides no place (the panel rule does) and names no part.
import { useCallback, useMemo, useRef, useState } from "react";
import { makeCell, type ShelfBlock, type ShelfCell, type ShelfPart, type ShelfRuntime } from "./shelfContract";
import type { CameraRequest } from "./CameraController";
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
  /** The shell's report of the open panel (null: none), with the serial of the last host request it had applied. */
  readonly onOpenChange: (id: string | null, applied: number | undefined) => void;
  /** What the viewer hands its link; absent when the scene has no parts. */
  readonly control: ShelfControl | undefined;
}

/** A part whose id some view lists shows only in those views; any other part shows in every view (the view rule: `ResolvedView.panels`). */
export function shownParts(parts: readonly ShelfPart[], view: ResolvedView | undefined): readonly ShelfPart[] {
  return view === undefined ? parts : parts.filter((part) => view.panels.has(part.id));
}

export function useShelf(parts: readonly ShelfPart[] | undefined, view: ResolvedView | undefined, host: ViewerPort | undefined, moveCamera: (request: CameraRequest) => void): ShelfState {
  const all = parts ?? NONE;
  // One element per custom block, per viewer: made here, so two viewers (or a rebuilt one) never share one.
  const elements = useMemo(() => new Map(typeof document === "undefined" ? [] : all.flatMap((part) => part.blocks.filter((block) => block.kind === "customBlock").map((block) => [block.id, document.createElement("div")] as const))), [all]);
  // One cell per block, per viewer, made on first use from the block's starting content; a rebuilt scene starts over.
  const blocks = useMemo(() => new Map<string, ShelfBlock>(all.flatMap((part) => part.blocks.map((block) => [block.id, block] as const))), [all]);
  const cells = useMemo(() => new Map<string, ShelfCell>(), [blocks]);
  const cellOf = useCallback((id: string): ShelfCell | undefined => {
    const block = blocks.get(id);
    if (block === undefined) return undefined;
    const made = cells.get(id) ?? makeCell(block.initial);
    cells.set(id, made);
    return made;
  }, [blocks, cells]);
  const shown = useMemo(() => shownParts(all, view), [all, view]);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const [request, setRequest] = useState<ShelfRequest | null>(null);
  /** The open panel as the host reads it (a host call is read at once), and the open panel the shell last reported. */
  const open = useRef<string | null>(null);
  const reported = useRef<string | null>(null);
  /**
   * The serial of the host's last call, and of the last call the shell had applied at its last report (O-080 I-189). The shell says at the source which change is the
   * host's: a report drawn with a newly applied call is that call's change, so it is never told to the host (setters are silent). While a later call is still to be
   * applied, the host's read stays its last word. Guessing afterwards which reports to silence (T-336's flag) let a call undone before its report be heard.
   */
  const asked = useRef<number | undefined>(undefined);
  const seen = useRef<number | undefined>(undefined);
  const control = useMemo<ShelfControl | undefined>(() => {
    if (all.length === 0) return undefined;
    const kinds = new Map(all.flatMap((part) => [[part.id, "panel"] as const, ...part.blocks.map((block) => [block.id, block.kind] as const)]));
    return {
      kinds, elements, blocks, cell: cellOf,
      isOpen: (id) => open.current === id,
      setOpen: (id, wanted) => {
        // A panel the showing view does not show cannot open; asking to close a closed one changes nothing.
        if ((wanted && !shownRef.current.some((part) => part.id === id)) || (open.current === id) === wanted) return;
        open.current = wanted ? id : null;
        // Counted here, not in a state updater: React may run an updater only at the next render, after a report this call must already outweigh.
        asked.current = (asked.current ?? 0) + 1;
        setRequest({ id, open: wanted, serial: asked.current });
      },
    };
  }, [all, elements, blocks, cellOf]);
  const onOpenChange = useCallback((id: string | null, applied: number | undefined) => {
    const before = reported.current;
    reported.current = id;
    const byHost = applied !== seen.current;
    seen.current = applied;
    // The host's read follows the shell once every host call is applied (a visitor, a view switch or another occupant may have changed it).
    if (applied === asked.current) open.current = id;
    if (byHost || before === id) return;
    // A panel the showing view dropped is silent too (the view switch is what the host hears, `onChange`).
    const dropped = before !== null && id === null && !shownRef.current.some((part) => part.id === before);
    if (dropped) return;
    if (before !== null) host?.partOpened(before, false);
    if (id !== null) host?.partOpened(id, true);
  }, [host]);
  const runtime = useMemo<ShelfRuntime>(() => ({
    element: (id) => elements.get(id),
    cell: (block) => cellOf(block.id) ?? makeCell(block.initial),
    report: (id, event) => host?.partHeard(id, event),
    moveCamera,
  }), [elements, cellOf, host, moveCamera]);
  return { shown, runtime, request, onOpenChange, control };
}
