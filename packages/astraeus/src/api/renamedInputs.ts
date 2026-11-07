import { SceneError } from "./errors";

/** One input field that was renamed: where a caller gives it (`scope`, the receiving call reads that shape), the old name, the new name and the call named in the message. */
export interface RenamedInput {
  readonly scope: string;
  readonly call: string;
  readonly old: string;
  readonly use: string;
}

/** The replacement of the old `addStoryPanels({ panels, pauseSeconds, autoOpen })` object: a list, and a call of its own for the two settings. */
const PANELS_CALLS = "addStoryPanels(list) with setStoryPanelPlayback({ pauseSeconds, autoOpen })";

/**
 * Every input field renamed in 0.8.0, old to new, in one place (O-057 T-276). A plain JavaScript caller who passes an old name would otherwise see it ignored without a word,
 * so each receiving call hands the object it was given to `rejectRenamed` with its `scope`; the old name is refused, never accepted. Inputs only: a removed method fails by itself
 * and a renamed read is covered by the migration table. Every row's `scope` must be read by some call (`tests/renamedInputs.test.ts` proves it).
 */
export const RENAMED_INPUTS: readonly RenamedInput[] = Object.freeze([
  { scope: "MoonPositions", call: "mount", old: "centre", use: "center" },
  { scope: "TextureRefDesktop", call: "mount", old: "minViewportWidth", use: "minViewportWidthPx" },
  { scope: "PacingSpan", call: "setTimeline", old: "from", use: "start" },
  { scope: "PacingSpan", call: "setTimeline", old: "to", use: "end" },
  { scope: "PacingSpan", call: "setTimeline", old: "ramp", use: "rampSeconds" },
  { scope: "PacingRule", call: "setTimeline", old: "ramp", use: "rampSeconds" },
  { scope: "PacingNear", call: "setTimeline", old: "within", use: "withinSeconds" },
  { scope: "ViewInput", call: "setViews", old: "paths", use: "objects" },
  { scope: "ViewInput", call: "setViews", old: "bodies", use: "objects" },
  { scope: "AddBodyOptions", call: "addBody", old: "labelReach", use: "labelReachEarthRadii" },
  { scope: "TrajectoryInput", call: "addTrajectory", old: "labelReach", use: "labelReachEarthRadii" },
  { scope: "ElementsBodyRecord", call: "addBodyFromElements", old: "frame", use: "plane" },
  { scope: "ElementsAccuracy", call: "addBodyFromElements", old: "validFromUtc", use: "valid.start" },
  { scope: "ElementsAccuracy", call: "addBodyFromElements", old: "validToUtc", use: "valid.end" },
  { scope: "StoryPanelInput", call: "addStoryPanels", old: "badge", use: "provenance.sourceType" },
  { scope: "StoryPanelInput", call: "addStoryPanels", old: "sources", use: "provenance.sources" },
  { scope: "StoryPanelAt", call: "addStoryPanels", old: "utc", use: "time" },
  { scope: "AddStoryPanelsCall", call: "addStoryPanels", old: "panels", use: PANELS_CALLS },
  { scope: "AddStoryPanelsCall", call: "addStoryPanels", old: "pauseSeconds", use: PANELS_CALLS },
  { scope: "AddStoryPanelsCall", call: "addStoryPanels", old: "autoOpen", use: PANELS_CALLS },
].map((row) => Object.freeze(row)));

/** Throws `renamed` when `value` carries an old name of the `scope`, naming its replacement; a value that is not an object is left to the caller's own checks. `where` leads the message, such as `setTimeline: pacing[1]`. */
export function rejectRenamed(scope: string, value: unknown, where: string): void {
  if (typeof value !== "object" || value === null) return;
  for (const row of RENAMED_INPUTS) {
    if (row.scope === scope && Object.hasOwn(value, row.old)) throw new SceneError("renamed", `${where}: \`${row.old}\` is now \`${row.use}\` (the old name is not accepted)`);
  }
}
