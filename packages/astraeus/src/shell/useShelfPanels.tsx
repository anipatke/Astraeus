// The shelf panels of one viewer (viewer-interface note, section 11): the story buttons for the bar and the open panel's view for the left place. Job: turn the scene's parts, the panel rule
// and the host's open/close calls into those two things. It must not decide a place or what an open closes (the panel rule does) and never imports a shelf module: a part draws itself through `part.view`.
import { useEffect, useId, useState, type ReactNode } from "react";
import type { ShelfPanel, ShelfPart, ShelfRuntime } from "../app/shelfContract";
import { PartBoundary } from "./PartBoundary";
import type { StoryButtonSpec } from "./StoryButton";
import type { Occupant } from "./panels/panelRule";
import type { Panels } from "./panels/usePanels";

const NO_PARTS: readonly ShelfPart[] = [];
const panelsOf = (parts: readonly ShelfPart[]): readonly ShelfPanel[] =>
  parts.filter((part): part is ShelfPanel => part.kind === "panel");
const NO_RUNTIME: ShelfRuntime = { element: () => undefined };

const occupantOf = (id: string): Occupant => `shelf:${id}`;

interface Input {
  /** The parts the showing view shows; absent: none. */
  readonly parts: readonly ShelfPart[] | undefined;
  readonly runtime: ShelfRuntime | undefined;
  readonly panels: Panels;
  readonly request: { readonly id: string; readonly open: boolean; readonly serial: number } | null | undefined;
  /** The open panel (null: none) and the serial of the last host request applied when it was drawn: a change drawn with a newly applied request is that request's. */
  readonly onOpenChange: ((id: string | null, applied: number | undefined) => void) | undefined;
}

/** The bar's story buttons (in the scene's order) and the open shelf panel; a panel the showing view does not show closes, and a host request or a visitor's press opens one through the rule. */
export function useShelfPanels({
  parts: showing = NO_PARTS,
  runtime = NO_RUNTIME,
  panels,
  request,
  onOpenChange,
}: Input): { readonly storyButtons: readonly StoryButtonSpec[]; readonly shelfPanel: ReactNode } {
  const base = useId();
  const parts = panelsOf(showing);
  const left = panels.state.left;
  const openId = left !== null && left.startsWith("shelf:") ? left.slice("shelf:".length) : null;
  const shown = parts.some((part) => part.id === openId);
  const { viewSwitch, open, close } = panels;
  // A view switch (or a rebuilt scene) that no longer shows the open panel closes it.
  useEffect(() => {
    if (openId !== null && !shown) viewSwitch(false, false, true);
  }, [openId, shown, viewSwitch]);
  // A host call opens or closes a panel the showing view shows; one it does not show stays closed.
  // The applied serial is set with the change it makes, so both reach the same render: the report says at its source which changes are the host's (I-189).
  const serial = request?.serial;
  const [applied, setApplied] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (request === null || request === undefined) return;
    if (!request.open) close(occupantOf(request.id));
    else if (parts.some((part) => part.id === request.id)) open(occupantOf(request.id));
    setApplied(request.serial);
    // Only a new request applies.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new request serial applies; the other values are read as they are then
  }, [serial]);
  useEffect(() => {
    onOpenChange?.(shown ? openId : null, applied);
  }, [onOpenChange, openId, shown, applied]);
  const domId = (id: string) => `${base}-shelf-${id}`;
  const storyButtons = parts.map((part): StoryButtonSpec => ({
    id: part.id,
    label: part.button.label,
    shortLabel: part.button.shortLabel,
    open: openId === part.id,
    controls: openId === part.id ? domId(part.id) : undefined,
    onPress: () => panels.toggle(occupantOf(part.id)),
  }));
  const current = parts.find((part) => part.id === openId);
  const shelfPanel =
    current === undefined ? null : (
      <PartBoundary key={current.id} part={current.id}>
        <current.view
          panel={current}
          runtime={runtime}
          id={domId(current.id)}
          onClose={() => close(occupantOf(current.id))}
        />
      </PartBoundary>
    );
  return { storyButtons, shelfPanel };
}
