/** Where the view choice shows: a button group in the top bar, or a row in the one switch panel opened from the bar (as for the display switches). */
export const VIEW_PLACES = ["top-bar", "panel"] as const;
export type ViewPlace = (typeof VIEW_PLACES)[number];

/** What the camera does when it switches to a view whose members no longer include what it follows or focuses on. `stay`: keep the pose and stop following. `start`: take the view's own framing, else the scene's start. */
export type ViewCameraRule =
  | { readonly rule: "stay" }
  | { readonly rule: "start"; readonly framing?: { readonly follow: string } | { readonly focus: string } };

/** One view, resolved once when the scene is built. The sets hold every id of that kind the view shows (an id no view names is in every view's set); switching only changes which set is read. */
export interface ResolvedView {
  readonly id: string;
  readonly label: string;
  readonly camera: ViewCameraRule;
  /** Bodies, paths and groups: the ids the menu lists and the scene draws. */
  readonly objects: ReadonlySet<string>;
  readonly events: ReadonlySet<string>;
  readonly panels: ReadonlySet<string>;
}

/** The views a scene names: presentation only (no State changes), so a hidden object keeps its state. */
export interface ViewSettings {
  readonly place: ViewPlace;
  /** Id of the opening view. */
  readonly start: string;
  readonly views: readonly ResolvedView[];
}
