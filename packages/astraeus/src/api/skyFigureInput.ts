import type { SkyDirection } from "./viewerLink";

/** One end of a figure's line: a catalogue star by its Hipparcos number (`{ star: 11767 }`), or a star-map position (`{ raDeg, decDeg }`, J2000 degrees). */
export type SkyFigureEnd = { readonly star: number } | SkyDirection;

/**
 * A figure or an outline drawn on the sky at infinity, as `Scene.addSkyFigures` takes it. A `"figure"` (the default) has `segments`, each a pair of ends; a `"boundary"` has `points`, a closed loop of at least three positions
 * (the last joins the first). `labelAt` places the label; without it the label stands at the mean direction of the ends.
 */
export interface SkyFigureInput {
  /** Unique among the scene's bodies, paths, groups, body sets and sky figures. */
  readonly id: string;
  /** The name drawn on the sky. */
  readonly label: string;
  /** `"figure"` (the default, drawn from `segments`) or `"boundary"` (drawn from `points`). The display switches `skyFigures` and `skyBoundaries` act on one kind each. */
  readonly kind?: "figure" | "boundary";
  /** The lines of a figure: pairs of ends. Required for a figure, refused for a boundary. */
  readonly segments?: readonly (readonly [SkyFigureEnd, SkyFigureEnd])[];
  /** The corners of a boundary, in order. Required for a boundary, refused for a figure. */
  readonly points?: readonly SkyDirection[];
  /** Where the label stands. */
  readonly labelAt?: SkyDirection;
  /** This figure's line colour, a CSS colour text; default: the look's `skyLines.figure` or `skyLines.boundary`. */
  readonly color?: string;
  /** This figure's label colour, a CSS colour text; default: the look's `skyLines.label`. */
  readonly labelColor?: string;
  /** This figure's label font, a CSS font-family text; default: the look's `labels.fontFamily`. */
  readonly labelFont?: string;
  /** This figure's label size in pixels, 8 to 24; default: the look's `labels.sizePx`. */
  readonly labelSizePx?: number;
}
