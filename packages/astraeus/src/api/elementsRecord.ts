import { ElementsBodyError, parseElementsBodyRecord as parseRecord, type ElementsBodyRecord } from "../core/elementsBody";
import { SceneError } from "./errors";

/** Checks a body record field by field and returns it typed, with the optional marker and limitations filled by their defaults. A fault is `bad-element` and the message names the field. */
export function parseElementsBodyRecord(input: unknown, path = "body"): ElementsBodyRecord {
  try {
    return parseRecord(input, path);
  } catch (error) {
    if (error instanceof ElementsBodyError) throw new SceneError("bad-element", error.message);
    throw error;
  }
}
