// I-183 (found by C-190): every host call that takes an options or look object refuses one that is not a plain object (a Map, a Date, a class instance, an array),
// with the call's own error code, instead of reading it as an empty object. One table across every such entry (`isPlainObject`, src/api/plainObject.ts).
import { describe, expect, it } from "vitest";
import { isPlainObject } from "../src/api/plainObject";
import { checkedGroupLook } from "../src/api/groupLookInput";
import { checkedLook } from "../src/api/lookInput";
import { cameraRequestOf } from "../src/api/cameraRequest";
import { SceneError } from "../src/api/errors";

class Options {
  color = "#123456";
}
const NOT_PLAIN: ReadonlyArray<[string, unknown]> = [
  ["a Map", new Map()],
  ["a Date", new Date(0)],
  ["a class instance", new Options()],
  ["an array", []],
  ["a function", () => undefined],
  ["null", null],
  ["a number", 3],
];
const PLAIN: ReadonlyArray<[string, unknown]> = [
  ["a literal", {}],
  ["Object.create(null)", Object.create(null)],
  ["parsed JSON", JSON.parse('{"a":1}')],
  ["a frozen literal", Object.freeze({ a: 1 })],
];

const ENTRIES: ReadonlyArray<[string, string, (value: unknown) => unknown]> = [
  ["setGroupLook", "bad-group", (value) => checkedGroupLook("g", value, { color: "#9de3a8", dotSizePx: 2.5 }, ["g"])],
  ["setLook", "bad-look", (value) => checkedLook(value as never)],
  ["setLook nested (sunGlow)", "bad-look", (value) => checkedLook({ sunGlow: value } as never)],
  ["setCamera", "bad-camera", (value) => cameraRequestOf(value, "setCamera", undefined)],
];

describe("isPlainObject", () => {
  it.each(PLAIN)("accepts %s", (_name, value) => expect(isPlainObject(value)).toBe(true));
  it.each(NOT_PLAIN)("refuses %s", (_name, value) => expect(isPlainObject(value)).toBe(false));
});

describe.each(ENTRIES)("%s", (_name, code, call) => {
  it.each(NOT_PLAIN)(`refuses %s with ${code}`, (_kind, value) => {
    let thrown: unknown;
    try {
      call(value);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe(code);
  });
});
