import { isCssColour, isFontFamily, isTimeZone } from "../presentation/lookValues";
import { LOOK_FIELDS, lookName, lookValue, lookWith, type LookField } from "../app/look";
import type { LookInput } from "./look";
import { SceneError } from "./errors";
import { isPlainObject } from "./plainObject";

const TOP_LEVEL = [...new Set(LOOK_FIELDS.map(({ path }) => path[0]))];

/** Checks a `setLook` argument: an object of known looks, each a finite number in its range, a boolean, a CSS colour, a font-family text, a time zone or one of a few names as its field says. Returns a frozen copy (the scene keeps no reference to the caller's object). */
export function checkedLook(input: LookInput): LookInput {
  const bad = (message: string) => new SceneError("bad-look", `setLook: ${message}`);
  const isObject = isPlainObject;
  if (!isObject(input)) throw bad(`give an object such as { starBrightness: 1.4 } (looks: ${TOP_LEVEL.join(", ")})`);
  for (const [key, value] of Object.entries(input)) {
    const fields = LOOK_FIELDS.filter(({ path }) => path[0] === key);
    if (fields.length === 0) throw bad(`"${key}" is not a look (known: ${TOP_LEVEL.join(", ")})`);
    const nested = fields.some(({ path }) => path.length === 2);
    if (nested && value !== undefined) {
      if (!isObject(value)) throw bad(`${key} must be an object such as { sizePx: 100 }, got ${JSON.stringify(value)}`);
      const names = fields.map(({ path }) => path[1]);
      const unknown = Object.keys(value).find((name) => !names.includes(name));
      if (unknown !== undefined) throw bad(`${key}.${unknown} is not a look (known: ${names.join(", ")})`);
    }
  }
  let look: LookInput = {};
  for (const field of LOOK_FIELDS) {
    const value = lookValue(input, field);
    if (value === undefined) continue;
    const problem = valueProblem(field, value);
    if (problem !== null) throw bad(`${lookName(field)} ${problem}, got ${JSON.stringify(value)}`);
    look = lookWith(look, field, value);
  }
  return Object.freeze(look);
}

function valueProblem(field: LookField, value: unknown): string | null {
  const { spec } = field;
  if (spec.kind === "range") return typeof value === "number" && Number.isFinite(value) && value >= spec.min && value <= spec.max ? null : `must be a number from ${spec.min} to ${spec.max}`;
  if (spec.kind === "colour") return isCssColour(value) ? null : "must be a CSS colour such as \"#8fb4ff\" or \"rgb(143, 180, 255)\"";
  if (spec.kind === "zone") return isTimeZone(value) ? null : "must be \"UTC\", \"local\" or an IANA zone name such as \"Australia/Sydney\"";
  if (spec.kind === "choice") return typeof value === "string" && spec.values.includes(value) ? null : `must be one of ${spec.values.map((v) => JSON.stringify(v)).join(", ")}`;
  if (spec.kind === "font") return isFontFamily(value) ? null : "must be a non-empty CSS font-family text";
  return typeof value === "boolean" ? null : "must be true or false";
}
