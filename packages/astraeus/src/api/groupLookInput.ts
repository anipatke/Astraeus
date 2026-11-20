import { SceneError } from "./errors";
import { HEX } from "./group";

/** What `handle.setGroupLook` takes; a field left out keeps its value. */
export interface GroupLookInput {
  /** A hex colour, as `addGroup` takes it. */
  readonly color?: string;
  /** Screen pixels, above 0. */
  readonly dotSizePx?: number;
}

/** What `handle.groupLook` reads. */
export interface GroupLookRead {
  /** The dots' colour. */
  readonly color: string;
  /** Screen pixels. */
  readonly dotSizePx: number;
}

const FIELDS = ["color", "dotSizePx"];
const bad = (id: unknown, message: string): SceneError => new SceneError("bad-group", `setGroupLook("${String(id)}"): ${message}`);

/**
 * Checks a `setGroupLook` call and fills the fields left out from `current` (the look in force); throws `bad-group` naming the id when it is not a group
 * (`current` undefined), or naming the field when a value is wrong.
 */
export function checkedGroupLook(id: unknown, look: unknown, current: GroupLookRead | undefined, groups: readonly string[]): GroupLookRead {
  if (typeof id !== "string" || current === undefined) {
    throw bad(id, `"${String(id)}" is not a group this viewer draws (${groups.length === 0 ? "the scene added none; add them with addGroup" : groups.join(", ")})`);
  }
  if (typeof look !== "object" || look === null || Array.isArray(look)) throw bad(id, `expected { color?, dotSizePx? }, got ${String(look)}`);
  const given = look as Record<string, unknown>;
  for (const key of Object.keys(given)) if (!FIELDS.includes(key)) throw bad(id, `"${key}" is not a group look field (${FIELDS.join(", ")})`);
  const { color = current.color, dotSizePx = current.dotSizePx } = given;
  if (typeof color !== "string" || !HEX.test(color)) throw bad(id, `color "${String(color)}" is not a hex colour such as "#9de3a8"`);
  if (typeof dotSizePx !== "number" || !Number.isFinite(dotSizePx) || dotSizePx <= 0) throw bad(id, `dotSizePx must be a finite number above 0, got ${String(dotSizePx)}`);
  return { color, dotSizePx };
}
