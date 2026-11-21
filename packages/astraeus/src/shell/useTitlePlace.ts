// The title place's state for one viewer: whether About is open, and what pressing the title does. Job: turn the scene's About, the card and the panel rule into the one
// `TitleAction` the bar draws. It must not place or close anything itself (the rule does) and holds no state of its own.
import { useEffect } from "react";
import type { AboutInput } from "../api/aboutInput";
import type { TitleAction } from "./bar/Bar";
import type { Panels } from "./panels/usePanels";

interface Input {
  readonly about: AboutInput | undefined;
  readonly panels: Panels;
  /** The ids of the two panels the title can open, made once per viewer. */
  readonly aboutPanelId: string;
  readonly infoPanelId: string;
  /** What the card shows now (null: closed), whether it is drawn, and how to open the object's card. */
  readonly info: { readonly kind: string } | null;
  readonly cardDrawn: boolean;
  readonly showObjectCard: () => void;
}

/** With an About the title opens and closes the About panel; without one (a phone's title shows the selected object's name) it opens and closes the object's card. */
export function useTitlePlace({ about, panels, aboutPanelId, infoPanelId, info, cardDrawn, showObjectCard }: Input): {
  readonly aboutOpen: boolean;
  readonly titleAction: TitleAction;
} {
  const aboutOpen = about !== undefined && panels.state.left === "about";
  const noAbout = about === undefined;
  const objectCardOpen = info?.kind === "object";
  const { close } = panels;
  // A scene rebuilt without an About leaves nothing to show: the place is freed.
  useEffect(() => {
    if (noAbout) close("about");
  }, [noAbout, close]);
  const titleAction: TitleAction = noAbout
    ? {
        open: objectCardOpen,
        controls: cardDrawn ? infoPanelId : undefined,
        onPress: () => (objectCardOpen ? panels.close("card") : showObjectCard()),
      }
    : { open: aboutOpen, controls: aboutOpen ? aboutPanelId : undefined, onPress: () => panels.toggle("about") };
  return { aboutOpen, titleAction };
}
