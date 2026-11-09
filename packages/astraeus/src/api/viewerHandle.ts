import type { LookInput, LookRead } from "./look";
import type { PickChange } from "./pickerInput";
import type { TimeInput } from "./time";
import type { SelectionChange } from "./viewerSelection";
import type { CameraPose, CameraTarget, EventZoneChange, ViewerChange, ViewerLink } from "./viewerLink";

/** Everything a host reads, sets and listens to on a drawn viewer: the handle `mount` returns (as `MountedScene`). Every call before the viewer is drawn or after it is gone throws `not-mounted`; reads are then undefined. */
export interface ViewerHandle {
  /** The viewer's time in Unix milliseconds UTC; undefined until `ready` has resolved and after `unmount`. */
  readonly timeUtcMs: number | undefined;
  /** The playback speed (simulated seconds per real second); undefined like `timeUtcMs`. */
  readonly rate: number | undefined;
  /** Whether the viewer is playing; undefined until `ready` has resolved and after `unmount`. */
  readonly playing: boolean | undefined;
  /** Plays or pauses the viewer, as its play button does. A non-boolean, or a scene without a timeline (`setTimeline({ none: true })`, which has no play control), throws `bad-timeline`; before `ready` or after `unmount` throws `not-mounted`. `onChange` hears it with `cause: "host"`. */
  setPlaying(playing: boolean): void;
  /** The id of the view showing; undefined until `ready` has resolved, after `unmount`, and in a scene without views. */
  readonly view: string | undefined;
  /** Moves the viewer to `time` (ISO text, a `Date` or Unix milliseconds). Outside the timeline throws `bad-time`; before `ready` or after `unmount` throws `not-mounted`. */
  setTime(time: TimeInput): void;
  /** Sets the playback speed to one of the speeds the timeline offers (`setTimeline({ rates })`); any other number throws `bad-timeline`. `"auto"` gives the speed back to the scene's `setTimeline({ pacing })` (throws `bad-timeline` when it has none). Before `ready` or after `unmount` throws `not-mounted`. */
  setRate(rate: number | "auto"): void;
  /** Switches to the view with this id (`setViews`). An unknown id, or a scene without views, throws `bad-view`; before `ready` or after `unmount` throws `not-mounted`. `onChange` hears it with `cause: "host"`. */
  setView(id: string): void;
  /** The camera as a plain value ({ focus, azimuthDeg, elevationDeg, distance }, the pose a copied view link carries); undefined until `ready` and after `unmount`; before the first frame is drawn it is the opening camera. Keep it and hand it to `setCamera` to put the camera back. */
  readonly camera: CameraPose | undefined;
  /** Points the camera: `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, or a pose from `camera` puts it back where it was read (relative to its object, which a moving object carries along). The object must be one the showing view shows; an unknown or hidden id, or a malformed argument, throws `bad-camera`; before `ready` or after `unmount`, `not-mounted`. The camera eases there. */
  setCamera(target: CameraTarget): void;
  /** The ids of the events whose zone (`withinSeconds` of an event, or a pacing rule) holds the viewer's time now, among the zones the showing view has (an empty list in a scene without event zones); undefined until `ready` and after `unmount`. */
  readonly eventZones: readonly string[] | undefined;
  /**
   * Calls `listener({ event, type?, object?, entered, timeUtcMs, cause })` when playback enters or leaves the zone of an event the showing view has (its `withinSeconds`, or a pacing event rule `setTimeline({ pacing: [{ near }] })`); returns the function that stops it.
   * `cause` is `playback` (the clock ran), `visitor` (timeline or view choice) or `host` (`setTime`, `setView`); overlapping zones report separately. A zone already active when the viewer opens reports `entered` once, with the first report after `ready` (within a tenth of a second), so a listener added right after `await ready` hears it. The engine moves nothing in response: a host composes its own behaviour, for example `setCamera`. No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it.
   */
  onEventZone(listener: (change: EventZoneChange) => void): () => void;
  /** The id of the object whose information the viewer has open (the one the object menu, a click or a view switch chose); undefined until `ready` has resolved, after `unmount`, and when nothing is selected. Set it with `setSelected`. */
  readonly selected: string | undefined;
  /**
   * Selects the object with this id, or clears the selection with `undefined`; `selected` reads it at once and `onSelect` hears it with `cause: "host"` (nothing is reported when the selection is already that).
   * The object must be one the showing view shows: an unknown or hidden id, an empty or non-string id throws `bad-selection`; before `ready` or after `unmount`, `not-mounted`. Like the object menu it opens the object's card, but the camera stays where it is (`setCamera` points the camera); a clear closes the card.
   * Like every host call it is the last word: made straight after `await ready`, before the first frame, or inside an `onChange` report of a view switch, it holds; a later view switch that no longer shows the object drops it as it drops a visitor's choice.
   */
  setSelected(id: string | undefined): void;
  /**
   * Calls `listener({ object?, timeUtcMs, cause })` when the selected object changes: `object` is the new id, absent when the selection was dropped (a view switch that no longer shows it, with nothing to take its place).
   * `cause` is `visitor` (the object menu, a click, or a time, speed or view the visitor chose), `host` (`setSelected`, or a drop caused by the host's own `setTime`, `setRate`, `setPlaying` or `setView`) or `playback` (a drop caused by the clock running); a drop takes the cause `onChange` reported for the move that caused it. The selection the viewer opens with is read from `selected`, not reported. The engine moves nothing in response.
   * No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it. Returns the function that stops it.
   */
  onSelect(listener: (change: SelectionChange) => void): () => void;
  /**
   * Calls `listener(pose)` with the camera as a plain value ({ focus, azimuthDeg, elevationDeg, distance }, what `camera` reads) when it changes: a visitor's drag, zoom or pick, a view's camera rule, or your own `setCamera`
   * (it reports as the camera eases, then stops when the pose settles). At most about ten times a second; an unchanged pose reports nothing, and neither does a camera following a moving object at a fixed pose.
   * The pose the viewer opens with is read from `camera`, not reported. The engine moves nothing in response. No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it. Returns the function that stops it.
   */
  onCameraChange(listener: (camera: CameraPose) => void): () => void;
  /** The looks in force, every one filled in (the scene's `setLook`, the page address and the Developer drawer over the defaults); undefined until `ready` has resolved and after `unmount`. */
  readonly look: LookRead | undefined;
  /** Sets the whole look, checked as `Scene.setLook` checks it (a look not named takes its default; a bad one throws `bad-look`); before `ready` or after `unmount` throws `not-mounted`. It wins over the same look in the page address, which only starts the viewer. Presentation only. `onChange` hears it with `cause: "host"`. */
  setLook(look: LookInput): void;
  /** The id of the scale showing; undefined until `ready` has resolved and after `unmount`. */
  readonly scale: string | undefined;
  /** Switches to one of the scales the viewer offers (`Scene.scales`); any other id throws `bad-scale`; before `ready` or after `unmount`, `not-mounted`. `onChange` hears it with `cause: "host"`. */
  setScale(id: string): void;
  /** The display switches the scene placed (`setSwitches`, wherever it placed them) that have something to act on, each on or off, by id (`orbitLines`, `labels`, `milkyWay`); empty when it placed none; undefined until `ready` has resolved and after `unmount`. */
  readonly switches: Readonly<Record<string, boolean>> | undefined;
  /** Turns a display switch the scene placed on or off, as the visitor's switch does; an id it did not place, or a non-boolean, throws `bad-switch`; before `ready` or after `unmount`, `not-mounted`. `onChange` hears it with `cause: "host"`. */
  setSwitch(id: string, on: boolean): void;
  /**
   * Calls `listener()` once when the scene's first frame has been drawn (not `ready`, which resolves when the clock attaches, a moment before); returns the function that stops it. A listener added after that frame is called at once.
   * A viewer rebuild (`AstraeusScene` given a new scene) draws a new first frame and calls the listeners still added again. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it. No callbacks arrive after `unmount`.
   */
  onFirstDraw(listener: () => void): () => void;
  /** The value of the option the picker shows pressed (`Scene.setPicker`); undefined until `ready` has resolved, after `unmount`, and in a scene without a picker. */
  readonly pick: string | undefined;
  /** Moves the pressed option to the option with this value, and does nothing else: no signal, no other change. A scene without a picker, or a value that is not one of its options, throws `bad-picker`; before `ready` or after `unmount`, `not-mounted`. */
  setPick(value: string): void;
  /**
   * Calls `listener({ picker, value })` when a visitor presses an option other than the pressed one; returns the function that stops it. The viewer only reports the press: the pressed option stays where it was until the host calls `setPick` (or mounts a new scene),
   * and the viewer never navigates or touches the page address. To keep the clock across a choice, read `timeUtcMs` inside the listener and set it on the next scene (`setTime`). No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it.
   */
  onPick(listener: (change: PickChange) => void): () => void;
  /** Calls `listener` on every change (see `MountOptions.onChange`); returns the function that stops it. No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it. */
  onChange(listener: (change: ViewerChange) => void): () => void;
}


/** The handle a host holds for `link`: one object whose reads and calls go straight to the link, so `mount` and `AstraeusScene` hand out the same thing and cannot drift apart. */
export function viewerHandleOf(link: ViewerLink): ViewerHandle {
  return {
    get timeUtcMs() { return link.timeUtcMs; },
    get rate() { return link.rate; },
    get playing() { return link.playing; },
    get view() { return link.view; },
    get camera() { return link.camera; },
    get eventZones() { return link.eventZones; },
    get selected() { return link.selected; },
    get look() { return link.look; },
    get scale() { return link.scale; },
    get switches() { return link.switches; },
    get pick() { return link.pick; },
    setPick: (value) => link.setPick(value),
    onPick: (listener) => link.onPick(listener),
    setLook: (look) => link.setLook(look),
    setScale: (id) => link.setScale(id),
    setSwitch: (id, on) => link.setSwitch(id, on),
    setView: (id) => link.setView(id),
    setCamera: (target) => link.setCamera(target),
    setSelected: (id) => link.setSelected(id),
    setTime: (time) => link.setTime(time),
    setRate: (rate) => link.setRate(rate),
    setPlaying: (playing) => link.setPlaying(playing),
    onChange: (listener) => link.onChange(listener),
    onFirstDraw: (listener) => link.onFirstDraw(listener),
    onEventZone: (listener) => link.onEventZone(listener),
    onSelect: (listener) => link.onSelect(listener),
    onCameraChange: (listener) => link.onCameraChange(listener),
  };
}
