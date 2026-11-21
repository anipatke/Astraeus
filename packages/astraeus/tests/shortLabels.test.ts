// Short labels (O-079 T-326): the optional `shortLabel` on a picker option and on a view. A good one is carried to the definition, a bad one is refused under
// `bad-picker` / `bad-view` (one input changed alone, ARCH-03), and the phone row uses it. Made-up scenes only.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, type PickerInput, type ViewInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { pickerSwitch } from "../src/app/listSwitch";

const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const picker: PickerInput = { id: "world", label: "World", options: [{ value: "tarn", label: "Tarn", shortLabel: "T" }, { value: "mere", label: "Mere" }], value: "tarn" };
const base = () => new Scene().addBody(earth);
const view: ViewInput = { id: "a", label: "Asteroid belt", shortLabel: "Belt" };

describe("shortLabel on a picker option", () => {
  it("is carried to the picker read and the definition, and to the control's options", () => {
    const scene = base().setPicker(picker);
    expect(scene.picker!.options[0]).toEqual({ value: "tarn", label: "Tarn", shortLabel: "T" });
    expect(scene.picker!.options[1]).toEqual({ value: "mere", label: "Mere" });
    expect(pickerSwitch(scene.picker!, "tarn", () => undefined).options.map((option) => option.shortLabel)).toEqual(["T", undefined]);
  });

  it.each([["an empty string", ""], ["a number", 3], ["null", null]])("refuses %s with bad-picker, naming the option", (_name, bad) => {
    const input = { ...picker, options: [{ value: "tarn", label: "Tarn", shortLabel: bad }, { value: "mere", label: "Mere" }] } as unknown as PickerInput;
    expect(codeOf(() => base().setPicker(input))).toMatch(/^bad-picker: setPicker: option "tarn" shortLabel must be a non-empty string/);
  });
});

describe("shortLabel on a view", () => {
  const scene = (input: ViewInput) => base().setViews([input, { id: "b", label: "Jupiter's influence" }], { place: "top-bar" });

  it("is carried to the resolved view, and absent when not given", () => {
    const views = definitionOf(scene(view)).views!.views;
    expect(views[0]!.shortLabel).toBe("Belt");
    expect("shortLabel" in views[1]!).toBe(false);
  });

  it.each([["an empty string", ""], ["a number", 3], ["null", null]])("refuses %s with bad-view, naming the view", (_name, bad) => {
    expect(codeOf(() => scene({ ...view, shortLabel: bad } as unknown as ViewInput))).toMatch(/^bad-view: setViews: view "a" shortLabel must be a non-empty string/);
  });
});
