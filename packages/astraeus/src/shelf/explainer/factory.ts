// The explainer part: a heading, paragraphs and notes the story fills with its own words. Job: check its input and build the descriptor that carries its view and its control.
// It must not draw anything or hold a viewer's text: each viewer's paragraphs live in its own cell.
import type { ShelfBlock } from "../../app/shelfContract";
import { badPart, checkedId, checkedInput, checkedStrings, checkedText, registered, type BlockPart } from "../part";
import { ExplainerView } from "./View";

/** What `explainer` takes. */
export interface ExplainerInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
  /** A heading above the text. */
  readonly heading?: string;
  /** The paragraphs; may be empty beside a heading or notes. */
  readonly paragraphs: readonly string[];
  /** Smaller notes below the paragraphs (a caveat, a source). */
  readonly notes?: readonly string[];
}

/** What `handle.part(explainer)` gives for one viewer. */
export interface ExplainerControl {
  /** Replaces the paragraphs, open or shut, silently (the host hears no event; a screen reader hears the new paragraphs politely while the explainer is shown). A blank paragraph is `bad-part`. */
  setParagraphs(paragraphs: readonly string[]): void;
}

/** The part's own data: what the view reads. */
export interface ExplainerData {
  readonly heading: string | undefined;
  readonly notes: readonly string[];
}
/** The paragraphs one viewer shows. */
export interface ExplainerState {
  readonly paragraphs: readonly string[];
}

/**
 * Text for a panel: a heading, paragraphs and notes in the story's own words; `handle.part(block).setParagraphs` changes the paragraphs, which a screen reader hears politely while shown.
 * @shelf
 * @example
 * explainer({ id: "lit", heading: "Why?", paragraphs: ["A body in the gap meets Jupiter every third lap."] })
 */
export function explainer(input: ExplainerInput): BlockPart<"explainer"> {
  const who = "explainer";
  const fields = checkedInput(input, who, "a { id, paragraphs } object");
  const id = checkedId(fields, who);
  const heading = fields.heading === undefined ? undefined : checkedText(fields.heading, who, "heading");
  const paragraphs = checkedStrings(fields.paragraphs, who, "paragraphs");
  const notes = fields.notes === undefined ? [] : checkedStrings(fields.notes, who, "notes");
  if (paragraphs.length === 0 && heading === undefined && notes.length === 0)
    throw badPart(who, "give a heading, paragraphs or notes: an empty explainer shows nothing");
  const block: ShelfBlock = {
    kind: "explainer",
    id,
    view: ExplainerView,
    data: Object.freeze({ heading, notes } satisfies ExplainerData),
    initial: Object.freeze({ paragraphs } satisfies ExplainerState),
    control: (link) =>
      ({
        setParagraphs: (next: readonly string[]) => {
          const checked = checkedStrings(next, "ExplainerControl.setParagraphs", "paragraphs");
          link.cell("ExplainerControl.setParagraphs").set({ paragraphs: checked } satisfies ExplainerState);
        },
      }) satisfies ExplainerControl,
  };
  return registered(block) as unknown as BlockPart<"explainer">;
}
