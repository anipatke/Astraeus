// Part: a story button, the bar item a shelf panel puts in the bar (a row button, or an entry in the menu under "This story"). It draws its label in the form the fit rule chose.
// Must not: set a position, layer, raw colour or raw size, or open or close another part; a press reports `onPress` and the panel rule decides.
import type { BarForm } from "./bar/barItems";

/** One story button: the panel it opens, its labels and whether that panel is open. */
export interface StoryButtonSpec {
  readonly id: string;
  readonly label: string;
  readonly shortLabel?: string | undefined;
  readonly open: boolean;
  /** The id of the panel this button opens while it is drawn, so no reference dangles. */
  readonly controls?: string | undefined;
  readonly onPress: () => void;
}

/** The button for `form`: the short label when the fit rule shortened the story's buttons and one was given. The full label stays for a screen reader. */
export function StoryButton({ spec, form }: { readonly spec: StoryButtonSpec; readonly form: BarForm }) {
  const shown = form === "short" && spec.shortLabel !== undefined ? spec.shortLabel : spec.label;
  return (
    <button
      type="button"
      className="story-button ui-pill"
      data-story-button={spec.id}
      title={spec.label}
      aria-expanded={spec.open}
      aria-controls={spec.controls}
      data-closes-drawer=""
      onClick={spec.onPress}
    >
      <span aria-hidden="true">{shown}</span>
      <span className="bar-sr">{spec.label}</span>
    </button>
  );
}
