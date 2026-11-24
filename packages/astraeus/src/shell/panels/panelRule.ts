// The panel rule (viewer-interface note, section 5): which panel holds which screen area, and what opening one closes. Job: one pure decision,
// `(state, action, layout) -> state`. It must not touch React, the DOM or timers, and it knows no panel's content: a panel is an occupant name here.

/** Wide: a left column, a right column and a developer column. Phone: left, right and developer all map onto one sheet place (detail over story). */
export type Layout = "wide" | "phone";

/** What can hold a place. `about` is the About panel; `card` is the object, event, window or place card; `popup` is any small pop-up (named by id, one at a time). `tile` is the readout tile expanded (O-081): only a phone opens it (a detail sheet); a wide viewer's tile is always shown in its own place, so opening it there changes nothing. */
export type Occupant =
  "about" | "card" | "moons" | "tile" | ShelfOccupant | "story" | "developer" | "menu" | "timeline";

/** A shelf panel (a story part, O-080) takes the left place under the name `shelf:` plus its id; the rule knows no more of it than that. */
export type ShelfOccupant = `shelf:${string}`;
const isShelf = (occupant: Occupant): occupant is ShelfOccupant => occupant.startsWith("shelf:");

/** Which occupants are open. `left` is the shared left place; `popup` is the id of the one open pop-up. */
export interface PanelState {
  readonly left: "about" | "card" | "moons" | "tile" | ShelfOccupant | null;
  readonly story: boolean;
  readonly developer: boolean;
  /** The menu drawer (a phone's controls drawer; the bar's menu later). */
  readonly menu: boolean;
  /** The timeline drawer (phone). */
  readonly timeline: boolean;
  readonly popup: string | null;
}

export const NO_PANELS: PanelState = {
  left: null,
  story: false,
  developer: false,
  menu: false,
  timeline: false,
  popup: null,
};

export type PanelAction =
  | { readonly type: "open"; readonly occupant: Occupant }
  | { readonly type: "close"; readonly occupant: Occupant }
  | { readonly type: "openPopup"; readonly id: string }
  | { readonly type: "closePopup"; readonly id?: string }
  /** An item chosen inside the menu (or the timeline drawer): the drawer it was chosen in closes. */
  | { readonly type: "chooseInDrawer"; readonly drawer: "menu" | "timeline" }
  /** A view switch dropped a card's object, a story panel the view does not show, a shelf panel it does not show (`dropsShelf`), or the tile the sheet shows (`dropsTile`). */
  | {
      readonly type: "viewSwitch";
      readonly dropsCard: boolean;
      readonly dropsStory: boolean;
      readonly dropsShelf?: boolean;
      readonly dropsTile?: boolean;
    }
  /** A shelf panel's button turned the camera: a phone's open detail sheet (the left place) closes so the visitor sees the move; a wide screen keeps its panel. */
  | { readonly type: "cameraTurned" }
  | { readonly type: "escape" }
  | { readonly type: "outsidePress" };

/** What Escape closes: the topmost only. Pop-up above drawer above detail (the left place) above story. The developer panel has no Escape. */
export function topmost(state: PanelState): { readonly occupant: Occupant | "popup"; readonly id?: string } | null {
  if (state.popup !== null) return { occupant: "popup", id: state.popup };
  if (state.menu) return { occupant: "menu" };
  if (state.timeline) return { occupant: "timeline" };
  if (state.left !== null) return { occupant: state.left };
  if (state.story) return { occupant: "story" };
  return null;
}

function closeOccupant(state: PanelState, occupant: Occupant): PanelState {
  if (isShelf(occupant)) return state.left === occupant ? { ...state, left: null } : state;
  switch (occupant) {
    case "about":
      return state.left === "about" ? { ...state, left: null } : state;
    case "card":
      return state.left === "card" ? { ...state, left: null } : state;
    case "moons":
      return state.left === "moons" ? { ...state, left: null } : state;
    case "tile":
      return state.left === "tile" ? { ...state, left: null } : state;
    case "story":
      return { ...state, story: false };
    case "developer":
      return { ...state, developer: false };
    case "menu":
      return { ...state, menu: false };
    case "timeline":
      return { ...state, timeline: false };
  }
}

function openOccupant(state: PanelState, occupant: Occupant, layout: Layout): PanelState {
  const phone = layout === "phone";
  if (isShelf(occupant)) return { ...state, left: occupant, developer: phone ? false : state.developer };
  switch (occupant) {
    // Any occupant of the left place replaces the other one; on a phone it is a detail sheet, which also replaces the developer sheet. The story sheet stays under it.
    case "about":
    case "card":
    case "moons":
      return { ...state, left: occupant, developer: phone ? false : state.developer };
    // The tile is always shown on a wide viewer; only a phone expands it, as a detail sheet like the others.
    case "tile":
      return phone ? { ...state, left: "tile", developer: false } : state;
    // Newest story panel wins (there is only one place); the detail sheet stays over it.
    case "story":
      return { ...state, story: true };
    // Wide: the developer column steps aside of the right place and closes nothing. Phone: it is a detail sheet and replaces the other one.
    case "developer":
      return { ...state, developer: true, left: phone ? null : state.left };
    case "menu":
      return { ...state, menu: true, timeline: false, popup: null };
    case "timeline":
      return { ...state, timeline: true, menu: false, popup: null };
  }
}

/** A view switch closes what the view no longer shows: a card, the story panel, a shelf panel, the tile's sheet. */
function viewSwitched(state: PanelState, action: Extract<PanelAction, { type: "viewSwitch" }>): PanelState {
  const card = action.dropsCard ? closeOccupant(state, "card") : state;
  const story = action.dropsStory ? closeOccupant(card, "story") : card;
  const shelf =
    action.dropsShelf === true && story.left !== null && isShelf(story.left) ? closeOccupant(story, story.left) : story;
  return action.dropsTile === true ? closeOccupant(shelf, "tile") : shelf;
}

/** The rule. Every row of the close table is one case in `panelRule.test.ts`. */
export function reducePanels(state: PanelState, action: PanelAction, layout: Layout): PanelState {
  switch (action.type) {
    case "open":
      return openOccupant(state, action.occupant, layout);
    case "close":
      return closeOccupant(state, action.occupant);
    case "openPopup":
      return { ...state, popup: action.id };
    case "closePopup":
      return action.id === undefined || state.popup === action.id ? { ...state, popup: null } : state;
    case "chooseInDrawer":
      return closeOccupant(state, action.drawer);
    case "viewSwitch":
      return viewSwitched(state, action);
    case "cameraTurned":
      return layout === "phone" && state.left !== null ? { ...state, left: null } : state;
    case "escape": {
      const top = topmost(state);
      if (top === null) return state;
      return top.occupant === "popup" ? { ...state, popup: null } : closeOccupant(state, top.occupant);
    }
    // An outside press closes the open pop-up and nothing else; with none open, it closes a wide screen's ⋯ drop-down (a phone's drawer stays: it has its own handle).
    case "outsidePress":
      if (state.popup !== null) return { ...state, popup: null };
      return layout === "wide" && state.menu ? { ...state, menu: false } : state;
  }
}

/** The layer the timeline's place takes over the panels: above them while its drawer is open (a phone), above all while one of its pop-ups (the events list, a marker group) is. */
export function timelineLayerFor(state: PanelState): "drawer" | "popup" | undefined {
  if (state.timeline) return "drawer";
  return state.popup === "events" || state.popup?.startsWith("marker-group:") === true ? "popup" : undefined;
}
