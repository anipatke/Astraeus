import type { TimeInput } from "./time";
import type { CameraPose, CameraTarget, EventZoneChange, ViewerChange, ViewerLink } from "./viewerLink";

/** Everything a host reads, sets and listens to on a drawn viewer: the handle `mount` returns (as `MountedScene`). Every call before the viewer is drawn or after it is gone throws `not-mounted`; reads are then undefined. */
export interface ViewerHandle {
  /** The viewer's time in Unix milliseconds UTC; undefined until `ready` has resolved and after `unmount`. */
  readonly time: number | undefined;
  /** The playback speed (simulated seconds per real second); undefined like `time`. */
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
  /** The ids of the events whose pacing zone holds the viewer's time now, among the zones the showing view has (an empty list in a scene without pacing event rules); undefined until `ready` and after `unmount`. */
  readonly eventZones: readonly string[] | undefined;
  /**
   * Calls `listener({ event, type?, object?, entered, time, cause })` when playback enters or leaves the zone of a pacing event rule (`setTimeline({ pacing: [{ near }] })`) for an event the showing view has; returns the function that stops it.
   * `cause` is `playback` (the clock ran), `visitor` (timeline or view choice) or `host` (`setTime`, `setView`); overlapping zones report separately. A zone already active when the viewer opens reports `entered` once, with the first report after `ready` (within a tenth of a second), so a listener added right after `await ready` hears it. The engine moves nothing in response: a host composes its own behaviour, for example `setCamera`. No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it.
   */
  onEventZone(listener: (change: EventZoneChange) => void): () => void;
  /** Calls `listener` on every change (see `MountOptions.onChange`); returns the function that stops it. No callbacks arrive after `unmount`. A listener that throws is reported to the page (`reportError`) and does not stop the listeners after it. */
  onChange(listener: (change: ViewerChange) => void): () => void;
}


/** The handle a host holds for `link`: one object whose reads and calls go straight to the link, so `mount` and `AstraeusScene` hand out the same thing and cannot drift apart. */
export function viewerHandleOf(link: ViewerLink): ViewerHandle {
  return {
    get time() { return link.time; },
    get rate() { return link.rate; },
    get playing() { return link.playing; },
    get view() { return link.view; },
    get camera() { return link.camera; },
    get eventZones() { return link.eventZones; },
    setView: (id) => link.setView(id),
    setCamera: (target) => link.setCamera(target),
    setTime: (time) => link.setTime(time),
    setRate: (rate) => link.setRate(rate),
    setPlaying: (playing) => link.setPlaying(playing),
    onChange: (listener) => link.onChange(listener),
    onEventZone: (listener) => link.onEventZone(listener),
  };
}
