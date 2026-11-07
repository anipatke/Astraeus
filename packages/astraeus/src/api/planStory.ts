import type { TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
import type { TimeBounds } from "../core/trajectory";
import { DEFAULT_PANEL_PLAYBACK, type CheckedPanel, type PanelPlayback, type StoryPanelSet } from "../core/storyPanels";
import type { ExperienceConfig } from "../shell/experience";
import { checkEventObjects, eventProvenanceOf, eventsOf, panelBatchOf, panelPlaybackOf, panelsOf, type AddEventsOptions, type EventInput, type StoryPanelInput, type StoryPanelPlaybackInput } from "./story";
import type { Tracked } from "./planPaths";
import { frozenList, type SceneEventRead, type ScenePanelRead } from "./sceneReads";

/** What a `Scene` has planned for its story layer: events, where their times come from, and story panels. */
export class StoryPlan {
  events: readonly TimelineEvent[] = [];
  #eventProvenance: Provenance | undefined;
  readonly #eventOwnProvenance = new Map<string, Provenance>();
  #panels: readonly CheckedPanel[] | undefined;
  #playback: PanelPlayback = DEFAULT_PANEL_PLAYBACK;

  addEvents(events: readonly EventInput[], options: AddEventsOptions): void {
    const merged = eventsOf(events, this.events);
    const own = events.flatMap((event): [string, Provenance][] => event.provenance === undefined ? [] : [[event.id, eventProvenanceOf(event.provenance, event.id)]]);
    const batch = options.provenance === undefined ? undefined : eventProvenanceOf(options.provenance);
    this.events = merged;
    for (const [id, provenance] of own) this.#eventOwnProvenance.set(id, provenance);
    if (batch !== undefined) this.#eventProvenance = batch;
  }

  /** Appends a batch; one that fails its checks adds nothing. */
  addPanels(panels: readonly StoryPanelInput[]): void {
    const known = this.#panels ?? [];
    this.#panels = [...known, ...panelBatchOf(panels, known)];
  }

  setPanelPlayback(playback: StoryPanelPlaybackInput): void {
    this.#playback = panelPlaybackOf(playback);
  }

  /** The events name only objects the scene holds. */
  checkObjects(ids: ReadonlySet<string>): void {
    checkEventObjects(this.events, ids);
  }

  /** The story panels, resolved against this scene's events, the anchors of its paths, its objects and timeline span. */
  panels(window: TimeBounds, tracked: Iterable<Tracked>, objectIds: readonly string[]): StoryPanelSet | undefined {
    if (this.#panels === undefined) return undefined;
    const anchors = new Map<string, number>();
    for (const { body } of tracked) body.anchorLabels?.forEach((label, index) => { if (!anchors.has(label)) anchors.set(label, body.anchorTimesUtcMs[index]!); });
    return panelsOf(this.#panels, this.#playback, { events: this.events, anchors, objectIds, window });
  }

  /** The events sorted by time, each with its own provenance, else the batch's. */
  eventReads(): readonly SceneEventRead[] {
    return frozenList(this.events.map(({ id, label, timeUtcMs, type, object, withinMs }): SceneEventRead => {
      const provenance = this.#eventOwnProvenance.get(id) ?? this.#eventProvenance;
      return { id, label, timeUtcMs, ...(type === undefined ? {} : { type }), ...(object === undefined ? {} : { object }), ...(withinMs === undefined ? {} : { withinSeconds: withinMs / 1000 }), ...(provenance === undefined ? {} : { provenance }) };
    }));
  }

  /** The story panels as the public list states them (resolved as `panels` resolves them); empty when none were added. */
  panelReads(window: TimeBounds, tracked: Iterable<Tracked>, objectIds: readonly string[]): readonly ScenePanelRead[] {
    const set = this.panels(window, tracked, objectIds);
    return frozenList((set?.panels ?? []).map(({ id, timeUtcMs, title, body, details, provenance, objectId }): ScenePanelRead => ({
      id, timeUtcMs, title, provenance,
      body: Object.freeze([...body]), details: Object.freeze([...details]),
      ...(objectId === undefined ? {} : { object: objectId }),
    })));
  }

  /** The event provenance entries of the experience: the batch's, and each event's own. */
  provenanceEntries(): Pick<ExperienceConfig, "eventProvenance" | "eventProvenanceById"> {
    return {
      ...(this.#eventProvenance === undefined ? {} : { eventProvenance: this.#eventProvenance }),
      ...(this.#eventOwnProvenance.size === 0 ? {} : { eventProvenanceById: Object.fromEntries(this.#eventOwnProvenance) }),
    };
  }
}
