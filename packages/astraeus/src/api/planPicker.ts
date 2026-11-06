import { SceneError } from "./errors";
import type { PickerInput } from "./pickerInput";

const bad = (message: string): SceneError => new SceneError("bad-picker", `setPicker: ${message}`);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

/** Checks the picker's id, label, options and starting value; throws `bad-picker`. */
function checkInput(input: PickerInput): void {
  if (typeof input !== "object" || input === null) throw bad("give an { id, label, options, value } object");
  if (!isText(input.id)) throw bad("the picker needs a non-empty id");
  if (!isText(input.label)) throw bad("the picker needs a label");
  if (!Array.isArray(input.options)) throw bad("options must be a list");
  const values = new Set<string>();
  for (const option of input.options) {
    if (!isText(option?.value)) throw bad("every option needs a non-empty value");
    if (!isText(option.label)) throw bad(`option "${option.value}" needs a label`);
    if (values.has(option.value)) throw bad(`option "${option.value}" appears twice`);
    values.add(option.value);
  }
  if (!values.has(input.value)) throw bad(`value "${String(input.value)}" is not one of the options`);
}

/** What a `Scene` has planned for its picker. */
export class PickerPlan {
  #input: PickerInput | undefined;

  set(input: PickerInput): void {
    checkInput(input);
    this.#input = Object.freeze({ id: input.id, label: input.label, value: input.value, options: Object.freeze(input.options.map((option) => Object.freeze({ value: option.value, label: option.label }))) });
  }

  /** The picker as set (frozen); undefined when none was set. */
  get input(): PickerInput | undefined { return this.#input; }

  /** The definition's entry; absent when none was set. */
  entry(): { readonly picker: PickerInput } | Record<string, never> {
    return this.#input === undefined ? {} : { picker: this.#input };
  }
}
