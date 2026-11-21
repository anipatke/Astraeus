// The readout tile part: a label and a live value, an optional line with a dot at a position, and a few small facts. Job: check its input and build the descriptor that carries its views and its control.
// It must not know what the numbers mean (the app's words say that), place itself (the tile area and the panel rule do), fetch data or hear a tap: the tile takes none on a wide viewer, and a phone's strip tap is the shell's.
import type { ShelfTile } from "../../app/shelfContract";
import { badPart, checkedId, checkedInput, checkedItems, checkedText, registered, type TilePart } from "../part";
import { ReadoutTileStrip, ReadoutTileView } from "./View";

/** A labelled tick on the tile's line, at `value` on the line's own axis. */
export interface ReadoutMark {
  readonly value: number;
  readonly label: string;
}

/** The line under the value: `low` to `high` on the app's own axis (its unit is the app's to say in the label or the marks), with a dot at `value`. */
export interface ReadoutScale {
  readonly low: number;
  readonly high: number;
  /** Where the dot sits: from `low` to `high`. */
  readonly value: number;
  /** `linear` (the default) or `log` (equal ratios are equal distances; `low` must be above 0). */
  readonly stretch?: "linear" | "log";
  /** Labelled ticks on the line; each `value` lies from `low` to `high`. */
  readonly marks?: readonly ReadoutMark[];
}

/** One small label and value under the line. */
export interface ReadoutFact {
  readonly label: string;
  readonly value: string;
}

/** What `readoutTile` takes. */
export interface ReadoutTileInput {
  /** Unique among part and block ids in the scene; `ViewInput.panels` lists it to show it in some views only. */
  readonly id: string;
  /** What the number is (a phone's strip and sheet show it too). */
  readonly label: string;
  /** The big value, as the app words it (for example "0.4 LD"). */
  readonly value: string;
  readonly scale?: ReadoutScale;
  /** Up to four small facts. */
  readonly facts?: readonly ReadoutFact[];
}

/** What `handle.part(tile)` gives for one viewer; every setter is silent and the tile hears nothing. */
export interface ReadoutTileControl {
  /** Sets the big value, and the dot's position when `scaleValue` is given (the tile must have a scale; the position must lie from its `low` to its `high`). */
  setValue(value: string, scaleValue?: number): void;
  /** Moves the dot (the tile must have a scale; the position must lie from its `low` to its `high`). */
  setScaleValue(value: number): void;
  /** Replaces the facts (up to four; an empty list shows none). */
  setFacts(facts: readonly ReadoutFact[]): void;
}

/** What one viewer's tile shows and changes. */
export interface ReadoutTileState {
  readonly value: string;
  readonly scaleValue?: number;
  readonly facts: readonly ReadoutFact[];
}

/** What the tile was given that never changes. */
export interface ReadoutTileData {
  readonly label: string;
  readonly scale?: Omit<ReadoutScale, "value"> & {
    readonly stretch: "linear" | "log";
    readonly marks: readonly ReadoutMark[];
  };
}

/** The most facts a tile holds. */
export const MAX_FACTS = 4;

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const factsOf = (value: unknown, who: string): readonly ReadoutFact[] => {
  const facts = checkedItems(
    value,
    who,
    "facts",
    "{ label, value } objects",
    (record, at) =>
      Object.freeze({
        label: checkedText(record.label, who, `${at}.label`),
        value: checkedText(record.value, who, `${at}.value`),
      }),
    true,
  );
  if (facts.length > MAX_FACTS) throw badPart(who, `facts holds at most ${MAX_FACTS} entries, got ${facts.length}`);
  return facts;
};

const within = (position: number, low: number, high: number): boolean => position >= low && position <= high;

/** The position of the dot or a mark along the line, from 0 (at `low`) to 1 (at `high`), on the line's own stretch. */
export function scaleFraction(
  scale: { readonly low: number; readonly high: number; readonly stretch: "linear" | "log" },
  value: number,
): number {
  if (scale.stretch === "log")
    return (Math.log(value) - Math.log(scale.low)) / (Math.log(scale.high) - Math.log(scale.low));
  return (value - scale.low) / (scale.high - scale.low);
}

const scaleOf = (
  value: unknown,
  who: string,
): { readonly data: NonNullable<ReadoutTileData["scale"]>; readonly start: number } => {
  const record = checkedInput(value, who, "scale as { low, high, value, stretch?, marks? }");
  const { low, high } = record;
  if (!finite(low) || !finite(high)) throw badPart(who, "scale.low and scale.high must be finite numbers");
  if (low >= high) throw badPart(who, "scale.low must be less than scale.high");
  if (!finite(record.value) || !within(record.value, low, high))
    throw badPart(who, "scale.value must be a finite number from scale.low to scale.high");
  const stretch = record.stretch === undefined ? "linear" : record.stretch;
  if (stretch !== "linear" && stretch !== "log") throw badPart(who, 'scale.stretch must be "linear" or "log"');
  if (stretch === "log" && low <= 0) throw badPart(who, "a log scale needs scale.low above 0");
  const marks =
    record.marks === undefined
      ? Object.freeze([])
      : checkedItems(
          record.marks,
          who,
          "scale.marks",
          "{ value, label } objects",
          (mark, at) => {
            if (!finite(mark.value) || !within(mark.value, low, high))
              throw badPart(who, `${at}.value must be a finite number from scale.low to scale.high`);
            return Object.freeze({ value: mark.value, label: checkedText(mark.label, who, `${at}.label`) });
          },
          true,
        );
  return { data: Object.freeze({ low, high, stretch, marks }), start: record.value };
};

/**
 * A live readout with its own place on screen: a label, a big value, an optional line with a dot at a position and labelled ticks, and a few small facts. On a wide viewer it sits at the top of the left column, always shown;
 * on a phone it is a one-line strip above the timeline that opens the full tile in the bottom sheet when tapped. At most one tile shows in a view. `handle.part(tile)` gives `setValue`, `setScaleValue` and `setFacts`, all silent.
 * @shelf
 * @example
 * scene.addParts([readoutTile({ id: "miss", label: "Closest approach", value: "0.4 LD", scale: { low: 0.1, high: 100, value: 0.4, stretch: "log", marks: [{ value: 1, label: "Moon" }] }, facts: [{ label: "Speed", value: "14 km/s" }] })]);
 */
export function readoutTile(input: ReadoutTileInput): TilePart {
  const who = "readoutTile";
  const fields = checkedInput(input, who, "an { id, label, value } object");
  const id = checkedId(fields, who);
  const label = checkedText(fields.label, who, "label");
  const value = checkedText(fields.value, who, "value");
  const scale = fields.scale === undefined ? undefined : scaleOf(fields.scale, who);
  const facts = fields.facts === undefined ? Object.freeze([]) : factsOf(fields.facts, who);
  const shelf: ShelfTile = {
    kind: "readoutTile",
    id,
    label,
    view: ReadoutTileView,
    strip: ReadoutTileStrip,
    data: Object.freeze({ label, ...(scale === undefined ? {} : { scale: scale.data }) } satisfies ReadoutTileData),
    initial: Object.freeze({
      value,
      ...(scale === undefined ? {} : { scaleValue: scale.start }),
      facts,
    } satisfies ReadoutTileState),
    control: (link, block) => {
      const data = block.data as ReadoutTileData;
      const position = (next: unknown, what: string): number => {
        if (data.scale === undefined) throw badPart(what, "this tile has no scale");
        if (!finite(next) || !within(next, data.scale.low, data.scale.high))
          throw badPart(what, `the position must be a finite number from ${data.scale.low} to ${data.scale.high}`);
        return next;
      };
      const write = (what: string, change: (now: ReadoutTileState) => Partial<ReadoutTileState>): void => {
        const cell = link.cell(what);
        cell.set(Object.freeze({ ...(cell.get() as ReadoutTileState), ...change(cell.get() as ReadoutTileState) }));
      };
      return {
        setValue: (next: string, scaleValue?: number) => {
          const what = "ReadoutTileControl.setValue";
          const text = checkedText(next, what, "value");
          const at = scaleValue === undefined ? undefined : position(scaleValue, what);
          write(what, () => ({ value: text, ...(at === undefined ? {} : { scaleValue: at }) }));
        },
        setScaleValue: (next: number) => {
          const at = position(next, "ReadoutTileControl.setScaleValue");
          write("ReadoutTileControl.setScaleValue", () => ({ scaleValue: at }));
        },
        setFacts: (next: readonly ReadoutFact[]) => {
          const list = factsOf(next, "ReadoutTileControl.setFacts");
          write("ReadoutTileControl.setFacts", () => ({ facts: list }));
        },
      } satisfies ReadoutTileControl;
    },
  };
  return registered(shelf) as unknown as TilePart;
}
