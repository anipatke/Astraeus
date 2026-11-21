// The bar: the one row the desktop bar and the phone draw. Job: render the items the fit rule placed in the row (in their forms), the menu button, and the hidden
// measuring row. It decides no place or form (`fitBar.ts`) and holds no look (`bar.css` reads the tokens). The items that did not fit are `BarMenu`'s.
import { Fragment, type ReactNode, type RefObject } from "react";
import { MenuIcon, MoreIcon } from "../topBarIcons";
import { MENU_HOST, POPUP_HOST_ATTRIBUTE } from "../panels/usePanels";
import { useDrawerSwipe } from "../useDrawerSwipe";
import type { BarForm, BarItem, Ghost } from "./barItems";
import type { BarFit } from "./fitBar";

/** A bar item with what draws it: `render` returns the control for the form the fit rule chose (engine items have one form). */
export type BarEntry = BarItem & { readonly render: (form: BarForm) => ReactNode };

/** What the title place does when pressed: it opens (or closes) the panel it names. `controls` is that panel's id while it is drawn, so no reference dangles. */
export interface TitleAction {
  readonly open: boolean;
  readonly controls?: string | undefined;
  readonly onPress: () => void;
}

/** The title place: the About title, or the selected object's name when the scene has no About. A button that opens its panel; the full name stays for a screen reader whatever is shown ("i" included). */
export function TitlePlace({ full, shown, action }: { readonly full: string; readonly shown: string; readonly action: TitleAction }) {
  return (
    <button type="button" className="bar-title" data-bar-title="" title={full} aria-expanded={action.open} aria-controls={action.controls} onClick={action.onPress}>
      <span aria-hidden="true">{shown}</span>
      <span className="bar-sr">{full}</span>
    </button>
  );
}

interface MenuButtonProps {
  readonly phone: boolean;
  readonly open: boolean;
  readonly drawerId: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly swipeThresholdPx: number;
}

/** The menu button (a phone's three lines, a wide bar's three dots): a tap toggles the menu, a swipe down opens it. */
function MenuButton({ phone, open, drawerId, onOpenChange, swipeThresholdPx }: MenuButtonProps) {
  const gestures = useDrawerSwipe({ thresholdPx: swipeThresholdPx, onTap: () => onOpenChange(!open), onSwipe: (direction) => { if (direction === "down") onOpenChange(true); } });
  const name = phone ? "Menu" : "More controls";
  return (
    <button type="button" className="bar-menu-button ui-icon" {...{ [POPUP_HOST_ATTRIBUTE]: MENU_HOST }} aria-label={name} title={name} aria-expanded={open} aria-controls={drawerId} {...gestures}>
      {phone ? <MenuIcon /> : <MoreIcon />}
    </button>
  );
}

const GHOST_CLASS: Readonly<Record<Ghost["shape"], string>> = { title: "bar-title", text: "bar-ghost bar-ghost-text", icon: "bar-ghost bar-ghost-icon", select: "bar-ghost bar-ghost-select", scale: "bar-ghost bar-ghost-text bar-ghost-scale" };

/** Draws every item in every form once, out of sight, so the fit rule works from real widths. A ghost is plain spans: no control, no id, no hook a test or host could find. */
function BarMeasure({ items, ghostsRef }: { readonly items: readonly BarItem[]; readonly ghostsRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="bar-measure" ref={ghostsRef} aria-hidden="true">
      {items.flatMap((item) => Object.entries(item.forms).map(([form, ghosts]) => (
        <span key={`${item.id}:${form}`} className="bar-ghost-group" data-ghost-id={item.id} data-ghost-form={form}>
          {ghosts.map((ghost, index) => <span key={index} className={GHOST_CLASS[ghost.shape]}>{ghost.text}</span>)}
        </span>
      )))}
    </div>
  );
}

interface BarProps extends Omit<MenuButtonProps, "open"> {
  readonly entries: readonly BarEntry[];
  readonly fit: BarFit;
  readonly rowRef: RefObject<HTMLDivElement | null>;
  readonly ghostsRef: RefObject<HTMLDivElement | null>;
  readonly menuOpen: boolean;
}

export function Bar({ entries, fit, rowRef, ghostsRef, menuOpen, ...menu }: BarProps) {
  const inRow = entries.filter((entry) => entry.kind !== "menu" && fit.placements[entry.id]?.place === "row");
  const drawn = (entry: BarEntry) => <Fragment key={entry.id}>{entry.render(fit.placements[entry.id]!.form)}</Fragment>;
  return (
    <div className="shell-toolbar">
      <div className="top-bar" ref={rowRef} data-bar={menu.phone ? "phone" : "wide"}>
        {inRow.filter((entry) => entry.kind !== "engine").map(drawn)}
        <span className="bar-spacer" aria-hidden="true" />
        {inRow.filter((entry) => entry.kind === "engine").map(drawn)}
        {fit.menuButton && <MenuButton open={menuOpen} {...menu} />}
      </div>
      <BarMeasure items={entries} ghostsRef={ghostsRef} />
    </div>
  );
}
