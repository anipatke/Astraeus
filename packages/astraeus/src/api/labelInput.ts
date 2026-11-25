import type { BodyId } from "../core/body";
import type { Provenance } from "../core/provenance";

/**
 * Where a host's label stands, as `Scene.addLabels` takes it: exactly one form.
 * A fixed point (`positionKm` in `plane`, about `center`, the scene's centre when absent), or the dots of one or more groups (`groups`, ids of `addGroup`).
 * A group named in any label's `anchor.groups` draws no name of its own while that label is in the scene; the Labels switch shows and hides the label instead.
 */
export type LabelAnchorInput =
  | {
      /** The point, kilometres, in `plane`. Three finite numbers. */
      readonly positionKm: readonly [number, number, number];
      /** The frame `positionKm` is given in. */
      readonly plane: "ecliptic-j2000" | "EQJ";
      /** A body of the scene the point is measured from; the scene's centre when absent. */
      readonly center?: BodyId;
    }
  | {
      /** One or more group ids: distinct, non-empty, each a group of the scene. */
      readonly groups: readonly string[];
    };

/**
 * What a tap on a label selects: exactly one form. `groups` with one id selects that group exactly as the Object list does; with several ids it selects them together under the label's id, with the card given on the label.
 * `panel` opens that story or shelf panel.
 */
export type LabelSelectsInput = { readonly groups: readonly string[] } | { readonly panel: string };

/** A label the host places (`Scene.addLabels`). */
export interface LabelInput {
  /** Unique among the scene's bodies, paths, groups, body-set members, sky figures, story and shelf panels and other labels. */
  readonly id: string;
  /** The text drawn; not blank. */
  readonly label: string;
  /** The label's colour, CSS hex ("#rgb" or "#rrggbb"); the look's label colour when absent. */
  readonly color?: string;
  /** How strongly the label holds its place against others when they overlap; finite, default 80 (a group's). */
  readonly labelPriority?: number;
  /** Where the label stands. */
  readonly anchor: LabelAnchorInput;
  /** What a tap selects. Absent: the label is text only and a tap passes through to the scene. */
  readonly selects?: LabelSelectsInput;
  /** The card's text; only with `selects.groups` of two or more ids. */
  readonly description?: string;
  /** The card's source; only with `selects.groups` of two or more ids. */
  readonly provenance?: Provenance;
  /** The card's known limitations, each a non-empty text; only with `selects.groups` of two or more ids. */
  readonly knownLimitations?: readonly string[];
}
