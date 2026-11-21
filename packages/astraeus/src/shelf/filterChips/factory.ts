// The filter chips part: a row of chips, one or several lit, that move themselves on a press and report it. Job: check its input and build the descriptor that carries its view and its control.
// It must not filter anything: the host does, from `onSelect`.
import type { ShelfBlock } from "../../app/shelfContract";
import {
  badPart,
  checkedColour,
  checkedId,
  checkedInput,
  checkedItems,
  checkedText,
  registered,
  type BlockPart,
} from "../part";
import { FilterChipsView } from "./View";

/** One chip. */
export interface ChipChoice {
  /** What `selected` and `onSelect` carry; unique. */
  readonly value: string;
  readonly label: string;
  /** A colour dot, a CSS colour text. */
  readonly color?: string;
}

/** What `filterChips` takes. */
export interface FilterChipsInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
  /** The chips, in order. */
  readonly choices: readonly ChipChoice[];
  /** True: several may be lit. Default: one, and pressing it again clears it. */
  readonly multiple?: boolean;
  /** The values lit at the start. */
  readonly selected?: readonly string[];
  /** A label above the chips. */
  readonly label?: string;
}

/** What a visitor's press told `FilterChipsControl.onSelect`. */
export interface ChipSelection {
  readonly part: string;
  /** The values lit now. */
  readonly values: readonly string[];
  /** Always "visitor": setters are silent. */
  readonly cause: "visitor";
}

/** What `handle.part(filterChips)` gives for one viewer. */
export interface FilterChipsControl {
  /** The values lit now. */
  readonly selected: readonly string[];
  /** Lights exactly these values, silently. A stranger, a repeat or two values in a single row is `bad-part`. */
  setSelected(values: readonly string[]): void;
  /** Replaces the chips, silently; values still there stay lit. */
  setChoices(choices: readonly ChipChoice[]): void;
  /** Calls `listener` when a visitor presses a chip, not for a setter; returns the stop function. */
  onSelect(listener: (selection: ChipSelection) => void): () => void;
}

/** The part's own data: what does not change. */
export interface FilterChipsData {
  readonly multiple: boolean;
  readonly label: string | undefined;
}
/** The chips and the lit values one viewer shows. */
export interface FilterChipsState {
  readonly choices: readonly ChipChoice[];
  readonly selected: readonly string[];
}

const choicesOf = (value: unknown, who: string, field = "choices"): readonly ChipChoice[] => {
  const seen = new Set<string>();
  return checkedItems(value, who, field, "{ value, label, color? } objects", (record, at) => {
    const chipValue = checkedText(record.value, who, `${at}.value`);
    if (seen.has(chipValue)) throw badPart(who, `${at}.value "${chipValue}" is used twice`);
    seen.add(chipValue);
    return Object.freeze({
      value: chipValue,
      label: checkedText(record.label, who, `${at}.label`),
      ...(record.color === undefined ? {} : { color: checkedColour(record.color, who, `${at}.color`) }),
    });
  });
};

/** The values among `choices`, in their order, checked: a repeat, a stranger or too many for a single row is `bad-part`. */
function selectionOf(
  values: unknown,
  choices: readonly ChipChoice[],
  multiple: boolean,
  who: string,
): readonly string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string"))
    throw badPart(who, "selected must be a list of choice values");
  const set = new Set<string>(values as string[]);
  if (set.size !== values.length) throw badPart(who, "selected names a value twice");
  const strange = values.find((value) => !choices.some((choice) => choice.value === value));
  if (strange !== undefined)
    throw badPart(
      who,
      `selected "${strange}" is not one of the choices (${choices.map((choice) => choice.value).join(", ")})`,
    );
  if (!multiple && values.length > 1)
    throw badPart(who, "a single-choice row (multiple: false) can light at most one value");
  return Object.freeze(choices.map((choice) => choice.value).filter((value) => set.has(value)));
}

/**
 * Chips to filter by: they light up on a press at once and the host hears the values through `handle.part(block).onSelect`.
 * @shelf
 * @example
 * filterChips({ id: "gap", choices: [{ value: "3:1", label: "3:1" }, { value: "5:2", label: "5:2" }] })
 */
export function filterChips(input: FilterChipsInput): BlockPart<"filterChips"> {
  const who = "filterChips";
  const fields = checkedInput(input, who, "an { id, choices } object");
  const id = checkedId(fields, who);
  const choices = choicesOf(fields.choices, who);
  if (fields.multiple !== undefined && typeof fields.multiple !== "boolean")
    throw badPart(who, "multiple must be true or false");
  const multiple = fields.multiple === true;
  const label = fields.label === undefined ? undefined : checkedText(fields.label, who, "label");
  const selected = fields.selected === undefined ? [] : selectionOf(fields.selected, choices, multiple, who);
  const block: ShelfBlock = {
    kind: "filterChips",
    id,
    view: FilterChipsView,
    data: Object.freeze({ multiple, label } satisfies FilterChipsData),
    initial: Object.freeze({ choices, selected } satisfies FilterChipsState),
    control: (link, self) => {
      const { multiple: several } = self.data as FilterChipsData;
      const state = (what: string) => link.cell(what).get() as FilterChipsState;
      return {
        get selected() {
          return state("FilterChipsControl.selected").selected;
        },
        setSelected: (values: readonly string[]) => {
          const now = state("FilterChipsControl.setSelected");
          link
            .cell("FilterChipsControl.setSelected")
            .set({
              choices: now.choices,
              selected: selectionOf(values, now.choices, several, "FilterChipsControl.setSelected"),
            } satisfies FilterChipsState);
        },
        setChoices: (next: readonly ChipChoice[]) => {
          const now = state("FilterChipsControl.setChoices");
          const replaced = choicesOf(next, "FilterChipsControl.setChoices");
          link
            .cell("FilterChipsControl.setChoices")
            .set({
              choices: replaced,
              selected: replaced.map(({ value }) => value).filter((value) => now.selected.includes(value)),
            } satisfies FilterChipsState);
        },
        onSelect: (listener: (selection: ChipSelection) => void) =>
          link.listen((event) => listener(event as ChipSelection)),
      } satisfies FilterChipsControl;
    },
  };
  return registered(block) as unknown as BlockPart<"filterChips">;
}
