import { VIEW_PLACES, type ResolvedView, type ViewCameraRule, type ViewPlace, type ViewSettings } from "../app/views";
import { SceneError } from "./errors";

/** What a view's camera does when what it follows or focuses on is not in the view: `"stay"` (default) keeps the pose and stops following, `"start"` takes the scene's start, `{ follow: id }` / `{ focus: id }` takes that framing (the object must be in the view). */
export type ViewCameraInput = "stay" | "start" | { readonly follow: string } | { readonly focus: string };

/** One named view. `paths` are `addTrajectory` ids, `bodies` are `addBody` or `addGroup` ids, `events` are `addEvents` ids and `panels` are `addStoryPanels` ids. */
export interface ViewInput {
  readonly id: string;
  readonly label: string;
  readonly paths?: readonly string[];
  readonly bodies?: readonly string[];
  readonly events?: readonly string[];
  readonly panels?: readonly string[];
  readonly camera?: ViewCameraInput;
}

/** Options of `setViews`: where the choice shows (`"top-bar"` or `"panel"`) and the opening view (default the first). */
export interface ViewsOptions {
  readonly place: ViewPlace;
  readonly start?: string;
}

/** A `setViews` call, checked for shape; its ids are checked against the scene by `resolveViews`. */
export interface ViewsPlan {
  readonly place: ViewPlace;
  readonly start: string;
  readonly views: readonly ViewInput[];
}

const KINDS = ["paths", "bodies", "events", "panels"] as const;

/** What the finished scene holds, for `resolveViews`. */
export interface ViewScope {
  readonly paths: readonly string[];
  readonly bodies: readonly string[];
  readonly events: readonly string[];
  readonly panels: readonly string[];
}

const bad = (message: string) => new SceneError("bad-view", `setViews: ${message}`);

/** Checks the shape of a `setViews` call (list, ids, labels, place, start, camera form, id lists); the ids are checked when the scene is built. */
export function viewsOf(input: readonly ViewInput[], options: ViewsOptions): ViewsPlan {
  // A deep copy first, so a later edit to the caller's objects cannot slip past the checks below.
  const views = Array.isArray(input) ? structuredClone(input) as readonly ViewInput[] : input;
  if (!Array.isArray(views) || views.length === 0) throw bad(`give a non-empty list such as [{ id: "all", label: "All" }]`);
  if (typeof options !== "object" || options === null || !(VIEW_PLACES as readonly unknown[]).includes(options.place)) throw bad(`place must be one of ${VIEW_PLACES.join(", ")}, got ${JSON.stringify((options as { place?: unknown } | null)?.place)}`);
  const seen = new Set<string>();
  views.forEach((view, index) => {
    const where = `view ${index}`;
    if (typeof view !== "object" || view === null) throw bad(`${where} must be an object { id, label, ... }`);
    if (typeof view.id !== "string" || view.id === "") throw bad(`${where} needs a non-empty id`);
    if (typeof view.label !== "string" || view.label === "") throw bad(`view "${view.id}" needs a non-empty label`);
    if (seen.has(view.id)) throw bad(`view "${view.id}" appears twice`);
    seen.add(view.id);
    for (const kind of KINDS) {
      const ids = view[kind];
      if (ids !== undefined && (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && id !== ""))) throw bad(`view "${view.id}" ${kind} must be a list of non-empty ids`);
    }
    cameraOf(view);
  });
  const start = options.start ?? views[0]!.id;
  if (!seen.has(start)) throw bad(`start "${String(start)}" is not a view (views: ${[...seen].join(", ")})`);
  return { place: options.place, start, views: views.map((view) => ({ ...view })) };
}

/** The camera rule a view asks for; a malformed one throws `bad-view`. */
function cameraOf(view: ViewInput): ViewCameraRule {
  const camera = view.camera;
  if (camera === undefined || camera === "stay") return { rule: "stay" };
  if (camera === "start") return { rule: "start" };
  const follow = (camera as { follow?: unknown } | null)?.follow;
  const focus = (camera as { focus?: unknown } | null)?.focus;
  const target = follow ?? focus;
  if (typeof camera !== "object" || camera === null || typeof target !== "string" || target === "" || (follow !== undefined) === (focus !== undefined)) throw bad(`view "${view.id}" camera must be "stay", "start", { follow: id } or { focus: id }, got ${JSON.stringify(camera)}`);
  return { rule: "start", framing: follow === undefined ? { focus: target } : { follow: target } };
}

/**
 * Resolves the membership once: for each kind, an id no view names shows in every view, and an id some views name shows only in those. Throws `bad-view` for an id the scene does not hold
 * and for a camera target the view does not show.
 */
export function resolveViews(plan: ViewsPlan, scope: ViewScope): ViewSettings {
  const known = { paths: new Set(scope.paths), bodies: new Set(scope.bodies), events: new Set(scope.events), panels: new Set(scope.panels) };
  const what = { paths: "a path (addTrajectory)", bodies: "a body or group", events: "an event (addEvents)", panels: "a story panel (addStoryPanels)" };
  const named = { paths: new Set<string>(), bodies: new Set<string>(), events: new Set<string>(), panels: new Set<string>() };
  for (const view of plan.views) {
    for (const kind of KINDS) {
      for (const id of view[kind] ?? []) {
        if (!known[kind].has(id)) throw bad(`view "${view.id}" ${kind}: "${id}" is not ${what[kind]} in the scene`);
        named[kind].add(id);
      }
    }
  }
  const shows = (view: ViewInput, kind: (typeof KINDS)[number], id: string): boolean => !named[kind].has(id) || (view[kind] ?? []).includes(id);
  const views = plan.views.map((view): ResolvedView => {
    const objects = new Set([...scope.paths.filter((id) => shows(view, "paths", id)), ...scope.bodies.filter((id) => shows(view, "bodies", id))]);
    const camera = cameraOf(view);
    if (camera.rule === "start" && camera.framing !== undefined) {
      const target = "follow" in camera.framing ? camera.framing.follow : camera.framing.focus;
      if (!objects.has(target)) throw bad(`view "${view.id}" camera: "${target}" is not shown in that view (a body or path of the scene it names, or one no view hides from it)`);
    }
    return { id: view.id, label: view.label, camera, objects, events: new Set(scope.events.filter((id) => shows(view, "events", id))), panels: new Set(scope.panels.filter((id) => shows(view, "panels", id))) };
  });
  return { place: plan.place, start: plan.start, views };
}
