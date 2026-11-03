import type { ViewerChangeCause, ViewerState } from "../app/viewerPort";
import { callListeners } from "./listeners";
import type { EventZoneChange, LinkAccess } from "./viewerLink";

/** The host link's event zones: the zones holding the time now and the `onEventZone` callbacks. */
export class ViewerZones {
  readonly #listeners = new Set<(change: EventZoneChange) => void>();
  #active: readonly string[] = [];
  /** The view the last publish showed (`undefined` before the first publish and in a scene without views), to tell a view-caused zone change from a time-caused one. */
  #view: { view: string | undefined } | undefined;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached: nothing is known to be active yet. */
  reset(): void {
    this.#view = undefined;
    this.#active = [];
  }

  clearListeners(): void { this.#listeners.clear(); }

  /** The ids of the events whose zone holds the time now (empty without event zones); undefined before the viewer is drawn and after it is gone. */
  get eventZones(): readonly string[] | undefined {
    const control = this.access.control();
    return control === undefined ? undefined : control.read().zones ?? [];
  }

  /**
   * Calls `listener` when playback enters or leaves the zone of an event the showing view has (`withinSeconds` of the event, or a `near` rule of `setTimeline({ pacing })`); returns the function that stops it.
   * A zone the time is already inside when the viewer opens is reported as entered once, with the first report after `ready` (within a tenth of a second), so a listener added right after `await ready` hears it.
   * A viewer rebuild (`AstraeusScene` given a new scene) starts over the same way.
   */
  onEventZone(listener: (change: EventZoneChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    const now = state.zones ?? [];
    const before = this.#active;
    const via = this.#view !== undefined && this.#view.view !== state.view ? "view" : "time";
    this.#view = { view: state.view };
    if (now.length === before.length && now.every((id, index) => id === before[index])) return;
    this.#active = now;
    const reports: [string, boolean][] = [...before.filter((id) => !now.includes(id)).map((id): [string, boolean] => [id, false]), ...now.filter((id) => !before.includes(id)).map((id): [string, boolean] => [id, true])];
    for (const [id, entered] of reports) {
      const event = this.access.control()?.events.find((candidate) => candidate.id === id);
      const change: EventZoneChange = { event: id, ...(event?.type === undefined ? {} : { type: event.type }), ...(event?.object === undefined ? {} : { object: event.object }), entered, time: state.timeUtcMs, cause, via };
      callListeners(this.#listeners, change);
    }
  }
}
