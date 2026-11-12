// What the current view hides: one derivation of the ids a view does not show, and the one filtered experience the shell lists read (T-219, I-124).
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import type { ResolvedView, ViewSettings } from "./views";

/** The ids the current view hides: objects (bodies, paths, groups) and story panels. Empty sets: everything shows. */
export interface ViewHidden {
  readonly objects: ReadonlySet<string>;
  readonly panels: ReadonlySet<string>;
}

/** The view with this id, else the opening one; undefined for a scene without views. */
export function viewById(settings: ViewSettings | undefined, id: string): ResolvedView | undefined {
  return settings?.views.find((view) => view.id === id) ?? settings?.views.find((view) => view.id === settings.start);
}

type Kind = "objects" | "events" | "panels";

/** The ids of `kind` some view shows and `view` does not. An id no view's set holds (the sky, an orbit line) is never the views' to hide. */
function hiddenIds(settings: ViewSettings, view: ResolvedView, kind: Kind): ReadonlySet<string> {
  const hidden = new Set<string>();
  for (const other of settings.views) for (const id of other[kind]) if (!view[kind].has(id)) hidden.add(id);
  return hidden;
}

/** What `view` hides. A scene without views hides nothing. An object that belongs to a hidden one (`partOf`: a body's Sun-orbit line) is hidden with it, so a view never names orbit lines. */
export function hiddenByView(settings: ViewSettings | undefined, view: ResolvedView | undefined, experience?: ExperienceConfig): ViewHidden {
  if (settings === undefined || view === undefined) return { objects: new Set(), panels: new Set() };
  const objects = new Set(hiddenIds(settings, view, "objects"));
  for (const object of experience?.objects ?? []) if (object.partOf !== undefined && objects.has(object.partOf)) objects.add(object.id);
  return { objects, panels: hiddenIds(settings, view, "panels") };
}

/** The experience as the view shows it: its objects, timeline events and story panels. The same object when there are no views, so a scene without views is untouched. */
export function experienceInView(experience: ExperienceConfig, settings: ViewSettings | undefined, view: ResolvedView | undefined): ExperienceConfig {
  if (settings === undefined || view === undefined) return experience;
  const hiddenEvents = hiddenIds(settings, view, "events");
  const { objects, panels } = hiddenByView(settings, view, experience);
  const storySet = experience.storyPanels;
  return {
    ...experience,
    objects: experience.objects.filter((object) => !objects.has(object.id)),
    events: experience.events.filter((event) => !hiddenEvents.has(event.id)),
    ...(storySet === undefined ? {} : { storyPanels: { ...storySet, panels: storySet.panels.filter((panel) => !panels.has(panel.id)), ...(storySet.steps === undefined ? {} : { steps: storySet.steps.filter((step) => !panels.has(step.id)) }) } }),
  };
}

/** `hidden` with the body the camera stands inside added while it looks out. The same object when nothing is added, so a normal frame allocates nothing. */
export function hiddenWithLookOut(hidden: ViewHidden | undefined, body: string | null): ViewHidden | undefined {
  if (body === null) return hidden;
  return { objects: new Set([...(hidden?.objects ?? []), body]), panels: hidden?.panels ?? new Set() };
}

/** Whether `object` is shown at `timeUtcMs`: `startUtcMs <= t < endUtcMs`, an absent end unbounded, no span always shown (`shownDuring`). The one rule, so an object that ends at T and one that starts at T never both show or both hide. */
export function shownAt(object: Pick<ExperienceObject, "shownDuring">, timeUtcMs: number): boolean {
  const span = object.shownDuring;
  return span === undefined || ((span.startUtcMs === undefined || span.startUtcMs <= timeUtcMs) && (span.endUtcMs === undefined || timeUtcMs < span.endUtcMs));
}

/**
 * `hidden` with every object not shown at `timeUtcMs` added, and what belongs to one (`partOf`: a body's orbit line) with it. The same object when no object has a span or
 * every span shows, so a frame without `shownDuring` allocates nothing. The one place the time-aware hidden set is built; the frame's `hiddenOf` calls it.
 */
export function hiddenWithShownSpans(hidden: ViewHidden | undefined, objects: readonly ExperienceObject[] | undefined, timeUtcMs: number | undefined): ViewHidden | undefined {
  if (objects === undefined || timeUtcMs === undefined) return hidden;
  let ids: Set<string> | undefined;
  for (const object of objects) if (!shownAt(object, timeUtcMs)) (ids ??= new Set(hidden?.objects)).add(object.id);
  if (ids === undefined) return hidden;
  for (const object of objects) if (object.partOf !== undefined && ids.has(object.partOf)) ids.add(object.id);
  return { objects: ids, panels: hidden?.panels ?? new Set() };
}
