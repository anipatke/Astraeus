// The colour key part: swatches with labels, counts and notes. Job: check its input and build the descriptor that carries its view and its control.
// It must not know what the colours mean: the story's entries say that.
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
import { ColourKeyView } from "./View";

/** One row of a colour key. */
export interface ColourKeyEntry {
  readonly label: string;
  readonly color: string;
  /** How many (a whole number of 0 or more). */
  readonly count?: number;
  /** Small text under the label. */
  readonly note?: string;
}

/** What `colourKey` takes. */
export interface ColourKeyInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
  /** The rows, in order; at least one. */
  readonly entries: readonly ColourKeyEntry[];
}

/** What `handle.part(colourKey)` gives for one viewer. */
export interface ColourKeyControl {
  /** Replaces the rows, silently. */
  setEntries(entries: readonly ColourKeyEntry[]): void;
}

/** The rows one viewer shows. */
export interface ColourKeyState {
  readonly entries: readonly ColourKeyEntry[];
}

const SHAPE = "{ label, color, count?, note? } objects";

const entriesOf = (value: unknown, who: string): readonly ColourKeyEntry[] => {
  if (Array.isArray(value) && value.length === 0) throw badPart(who, `entries must be a non-empty list of ${SHAPE}`);
  return listOf(value, who);
};

// Empty is refused above with its own words; `true` keeps the not-a-list message plain.
const listOf = (value: unknown, who: string): readonly ColourKeyEntry[] =>
  checkedItems(
    value,
    who,
    "entries",
    SHAPE,
    (record, at) => {
      const count = record.count;
      if (count !== undefined && (typeof count !== "number" || !Number.isFinite(count) || count < 0))
        throw badPart(who, `${at}.count must be a number of 0 or more`);
      if (count !== undefined && !Number.isInteger(count))
        throw badPart(who, `${at}.count must be a whole number of 0 or more`);
      return Object.freeze({
        label: checkedText(record.label, who, `${at}.label`),
        color: checkedColour(record.color, who, `${at}.color`),
        ...(count === undefined ? {} : { count }),
        ...(record.note === undefined ? {} : { note: checkedText(record.note, who, `${at}.note`) }),
      });
    },
    true,
  );

/**
 * A key of colours: a swatch, a label and optionally a count and a note per row; `handle.part(block).setEntries` replaces the rows.
 * @shelf
 * @example
 * colourKey({ id: "regions", entries: [{ label: "Main belt", color: "#8fb4ff", count: 1200 }] })
 */
export function colourKey(input: ColourKeyInput): BlockPart<"colourKey"> {
  const who = "colourKey";
  const fields = checkedInput(input, who, "an { id, entries } object");
  const block: ShelfBlock = {
    kind: "colourKey",
    id: checkedId(fields, who),
    view: ColourKeyView,
    initial: Object.freeze({ entries: entriesOf(fields.entries, who) } satisfies ColourKeyState),
    control: (link) =>
      ({
        setEntries: (next: readonly ColourKeyEntry[]) => {
          const entries = entriesOf(next, "ColourKeyControl.setEntries");
          link.cell("ColourKeyControl.setEntries").set({ entries } satisfies ColourKeyState);
        },
      }) satisfies ColourKeyControl,
  };
  return registered(block) as unknown as BlockPart<"colourKey">;
}
