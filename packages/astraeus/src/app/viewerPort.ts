import type { ScaleId } from "../presentation/scalePolicy";
import type { TimelineEvent } from "../core/events";
import type { TimeBounds } from "../core/trajectory";
import type { CameraRequest } from "./CameraController";
import type { CameraView } from "./viewLink";
import type { LookInput, LookRead } from "../api/look";
import type { SkyTraceAfter } from "../presentation/skyTrace";
import type { Provenance } from "../core/provenance";

/** The one clock's reading as a host sees it. */
export interface ViewerState {
  readonly timeUtcMs: number;
  /** Simulated seconds per real second. */
  readonly rate: number;
  readonly playing: boolean;
  /** Only in a scene with pacing: true while pacing sets the rate, false once a visitor or the host has picked a speed. */
  readonly auto?: boolean;
  /** Only in a scene with views: the id of the view showing. */
  readonly view?: string;
  /** Only in a scene with event zones: the ids of the events whose zone holds the time, among the zones the showing view has. */
  readonly zones?: readonly string[];
  /** The id of the object whose information the viewer has selected; absent when nothing is selected. */
  readonly selected?: string;
  /** The id of the story panel open; absent when none is. */
  readonly panel?: string;
  /** The id of the scale showing. */
  readonly scale: ScaleId;
  /** The looks in force, every one filled in. */
  readonly look: LookRead;
  /** The display switches the scene placed (those with something to act on), each on or off; empty when it placed none. */
  readonly switches: Readonly<Record<string, boolean>>;
}

/** Who moved the clock: the clock running (`playback`), a person at the controls (`visitor`) or the host page (`host`). */
export type ViewerChangeCause = "playback" | "visitor" | "host";

/** What a mounted viewer lets the host do to its one clock. Seeking and rate changes go through the viewer's own handlers, so there is no second clock. */
export interface ViewerControl {
  readonly window: TimeBounds;
  /** The scene's events, which name what a zone is about (`type`, `object`). */
  readonly events: readonly TimelineEvent[];
  /** The speeds the timeline offers. */
  readonly rates: readonly number[];
  read(): ViewerState;
  seek(timeUtcMs: number): void;
  /** True: the scene has pacing, so `"auto"` is a valid choice. */
  readonly paced: boolean;
  /** A number is a chosen speed; `"auto"` gives the rate back to the scene's pacing. */
  setRate(rate: number | "auto"): void;
  /** True: the visitor has a play control; false in a scene without a timeline (`setTimeline({ none: true })`), where `setPlaying` is refused. */
  readonly playable: boolean;
  /** Plays or pauses the one clock, as the visitor's play button does. */
  setPlaying(playing: boolean): void;
  /** The ids of the scene's views, in order; empty without views. */
  readonly views: readonly string[];
  /** Switches to the view with this id (one of `views`), as a visitor's button does. */
  setView(id: string): void;
  /** The ids of the scales the viewer offers, in order. */
  readonly scales: readonly ScaleId[];
  /** Switches to the scale with this id (one of `scales`), as a visitor's scale buttons do. */
  setScale(id: ScaleId): void;
  /** Sets the whole look (already checked); a look not named takes its default. A live set wins over the page address, which only starts the viewer. */
  setLook(look: LookInput): void;
  /** Turns the display switch `id` (one of the keys of `read().switches`) on or off, as a visitor's switch does. */
  setSwitch(id: string, on: boolean): void;
  /** The sky figures the viewer draws, in the order added (id, label, kind); empty or absent when the scene added none. */
  readonly skyFigures?: readonly {
    readonly id: string;
    readonly label: string;
    readonly kind: "figure" | "boundary";
    readonly listed: boolean;
    readonly provenance: Provenance;
    readonly description?: string;
    readonly facts?: readonly { readonly label: string; readonly value: string }[];
  }[];
  /** Starts tracing a sky figure (an id from `skyFigures`, already checked), as `SkyTraceOptions` says; a trace already running on it restarts. Takes effect at the next frame, in call order with the other host calls. */
  traceSkyFigure(id: string, seconds: number, after: SkyTraceAfter): void;
  /** Removes a sky figure's trace (an id from `skyFigures`, already checked) over `seconds` (0: at once); none running does nothing. Takes effect at the next frame, in call order with the other host calls. */
  clearSkyTrace(id: string, seconds: number): void;
  /** The ids of the point groups the scene added (`addGroup`), in order; empty when it added none. */
  readonly groups?: readonly string[];
  /** The colour and dot size the point group `id` (one added with `addGroup`) is drawn with now: the host's last `setGroupLook`, else the group's own; undefined for an id that is not a group. */
  groupLook?(id: string): { readonly color: string; readonly dotSizePx: number } | undefined;
  /** Gives the point group `id` (already checked) this colour and dot size, both filled in; `groupLook` reads it at once and the dots and the group's label take it at the next frame. */
  setGroupLook?(id: string, look: { readonly color: string; readonly dotSizePx: number }): void;
  /** The host's picker (`Scene.setPicker`): its id, the option values and the one pressed at the start; absent without a picker. */
  readonly picker?: { readonly id: string; readonly values: readonly string[]; readonly start: string };
  /** The scene's About (`Scene.setAbout`) when the viewer attaches; absent without one. The link then holds the live About (the host's `setAbout`). */
  readonly about?: import("../api/aboutInput").AboutInput | undefined;
  /** The shelf parts of this viewer: the ids of its panels and blocks, the elements made for its custom blocks, and whether a panel is open; absent without parts. */
  readonly parts?: ShelfControl;
  /** The ids of the objects the showing view shows, which a host may point the camera at. */
  cameraTargets(): readonly string[];
  /** The camera as the viewer's view link writes it (an orbit view, or a sky view while looking out); undefined until the scene has drawn its first frame. */
  readCamera(): CameraView | undefined;
  /** Selects the object with this id (one of `cameraTargets()`), or clears the selection (`undefined`); `read()` shows it at once. */
  setSelected(id: string | undefined): void;
  /** The ids of the story panels (moment panels and steps) the showing view shows, which a host may open. */
  panels(): readonly string[];
  /** Opens the story panel with this id (one of `panels()`), or closes the open one (`undefined`); `read()` shows it at once. */
  setPanel(id: string | undefined): void;
  /** Asks the scene camera for a follow, focus or pose through its own request path (the same one a view's camera rule uses). */
  setCamera(request: CameraRequest): void;
}

/** What a viewer hands its link about the scene's shelf parts (`Scene.addParts`). */
export interface ShelfControl {
  /** The id of every panel and block, with its kind. */
  readonly kinds: ReadonlyMap<string, string>;
  /** Every block by id: what `handle.part(block)` builds its control from. */
  readonly blocks: ReadonlyMap<string, import("./shelfContract").ShelfBlock>;
  /** The block's changing content for this viewer (its setters write it, a visitor's press writes it too); undefined for an id that is not a block. */
  cell(id: string): import("./shelfContract").ShelfCell | undefined;
  /** The element the viewer made for each custom block: alive from attach to detach. */
  readonly elements: ReadonlyMap<string, HTMLElement>;
  /** Whether the panel `id` is open now. */
  isOpen(id: string): boolean;
  /** Opens or closes the panel `id` (an id from `kinds`), as its button does; `isOpen` reads it at once and `partOpened` is not called for it. */
  setOpen(id: string, open: boolean): void;
}

/** The viewer's side of the host link; the public API supplies the implementation (`ViewerLink`). */
export interface ViewerPort {
  /** The viewer hands over its clock controls when it opens. */
  attach(control: ViewerControl): void;
  /** The viewer is going away: the controls are no longer valid. */
  detach(): void;
  /** The viewer reports the clock's current reading; the link tells the host only when it differs from the last one. */
  publish(state: ViewerState, cause: ViewerChangeCause): void;
  /** The viewer's selected object changed. `byMove`: the selection followed a move of the clock or the view (a drop, or a view rule's framing target; the cause is whatever last moved them); otherwise the visitor chose it. */
  publishSelection(state: ViewerState, byMove: boolean): void;
  /** The viewer's open story panel changed (a visitor, a host call, playback crossing a panel, or `"move"`: a view switch dropped it, and the cause is whatever last moved the view). */
  publishPanel(state: ViewerState, cause: ViewerChangeCause | "move"): void;
  /** The pressed option of the host's picker now (undefined until attached and without a picker). */
  pickNow(): string | undefined;
  /** Calls `watcher` when the pressed option moves (the host's `setPick`, or an attach or detach); returns the function that stops it. */
  watchPick(watcher: () => void): () => void;
  /** A visitor pressed an option of the picker other than the pressed one; the link tells the host's `onPick` listeners. */
  picked(value: string): void;
  /** The About now: the scene's, or the host's last `setAbout` (undefined until attached and without one). */
  aboutNow(): import("../api/aboutInput").AboutInput | undefined;
  /** Calls `watcher` when the About changes (the host's `setAbout`, or an attach or detach); returns the function that stops it. */
  watchAbout(watcher: () => void): () => void;
  /** A visitor opened or closed the shelf panel `id` (or something that shares its place did); the link tells the host's `PanelControl.onOpen` listeners. */
  partOpened(id: string, open: boolean): void;
  /** A visitor acted in the shelf block `id` (a chip press, an action button): the link tells the host's listeners for that block. */
  partHeard(id: string, event: unknown): void;
  /** The scene has drawn its first frame; the link tells the host's `onFirstDraw` listeners. */
  firstDraw(): void;
}
