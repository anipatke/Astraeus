import type { TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
import type { TimeBounds } from "../core/trajectory";
import type { StoryPanelSet } from "../core/storyPanels";
import type { ExperienceConfig } from "../shell/experience";
import { checkEventObjects, eventProvenanceOf, eventsOf, panelsOf, type AddEventsOptions, type EventInput, type StoryPanelsInput } from "./story";
import type { Tracked } from "./planPaths";
import { frozenList, type SceneEventRead, type ScenePanelRead } from "./sceneReads";

/** What a `Scene` has planned for its story layer: events, where their times come from, and story panels. */
export class StoryPlan {
  events: readonly TimelineEvent[] = [];
  #eventProvenance: Provenance | undefined;
  readonly #eventOwnProvenance = new Map<string, Provenance>();
  #panels: StoryPanelsInput | undefined;

  addEvents(events: readonly EventInput[], options: AddEventsOptions): void {
    const merged = eventsOf(events, this.events);
    const own = events.flatMap((event): [string, Provenance][] => event.provenance === undefined ? [] : [[event.id, eventProvenanceOf(event.provenance, event.id)]]);
    const batch = options.provenance === undefined ? undefined : eventProvenanceOf(options.provenance);
    this.events = merged;
    for (const [id, provenance] of own) this.#eventOwnProvenance.set(id, provenance);
    if (batch !== undefined) this.#eventProvenance = batch;
  }

  addPanels(panels: StoryPanelsInput): void {
    this.#panels = panels;
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
    return panelsOf(this.#panels, { events: this.events, anchors, objectIds, window });
  }

  /** The events sorted by time, each with its own provenance, else the batch's. */
  eventReads(): readonly SceneEventRead[] {
    return frozenList(this.events.map(({ id, label, timeUtcMs, type, object }): SceneEventRead => {
      const provenance = this.#eventOwnProvenance.get(id) ?? this.#eventProvenance;
      return { id, label, timeUtcMs, ...(type === undefined ? {} : { type }), ...(object === undefined ? {} : { object }), ...(provenance === undefined ? {} : { provenance }) };
    }));
  }

  /** The story panels as the public list states them (resolved as `panels` resolves them); empty when none were added. */
  panelReads(window: TimeBounds, tracked: Iterable<Tracked>, objectIds: readonly string[]): readonly ScenePanelRead[] {
    const set = this.panels(window, tracked, objectIds);
    return frozenList((set?.panels ?? []).map(({ id, timeUtcMs, title, body, badge, details, sources, objectId }): ScenePanelRead => ({
      id, timeUtcMs, title, badge,
      body: Object.freeze([...body]), details: Object.freeze([...details]), sources: Object.freeze([...sources]),
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
