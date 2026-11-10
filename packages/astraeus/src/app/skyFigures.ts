// Sky figures as the app draws them: figures, outlines and the two reference circles, all as unit directions in the EQJ frame at infinity (ARCH-02: presentation only, no State).
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import type { SkyTraceAfter } from "../core/skyTrace";
import type { CameraRequest } from "./CameraController";

export type EqjDirection = readonly [number, number, number];

/** One figure ready to draw: segments (pairs of unit EQJ directions), the kind the display switches act on, and where its label stands. */
export interface SkyFigureLayer {
  readonly id: string;
  readonly label: string;
  readonly kind: "figure" | "boundary";
  readonly segments: readonly (readonly [EqjDirection, EqjDirection])[];
  /** Unit EQJ direction of the label. */
  readonly labelAt: EqjDirection;
  /** This figure's own line colour, over the look's. */
  readonly color?: string;
  /** True: nothing of the figure (lines or label) is drawn until a trace of it starts (`SkyFigureInput.shown: "whenTraced"`). */
  readonly whenTraced?: boolean;
  /** This figure's own label colour, font and size, over the look's. */
  readonly labelColor?: string;
  readonly labelFont?: string;
  readonly labelSizePx?: number;
}

/** Which kinds of sky line are shown now (the four display switches; live, replaced in place by value). */
export interface SkyLineSwitches {
  figures: boolean;
  boundaries: boolean;
  ecliptic: boolean;
  celestialEquator: boolean;
}

/** The starting state of the four switches: the figures show, the rest wait for the app to ask. */
export const DEFAULT_SKY_LINES: Readonly<SkyLineSwitches> = Object.freeze({ figures: true, boundaries: false, ecliptic: false, celestialEquator: false });

/** The colours of the sky lines and their labels, and of the lines a trace draws (T-297): every one a CSS colour text. The look `skyLines` sets them; `DEFAULT_SKY_COLOURS` is the one place the defaults are stated. */
export interface SkyColours {
  readonly figure: string;
  readonly label: string;
  readonly boundary: string;
  readonly ecliptic: string;
  readonly equator: string;
  readonly traced: string;
  readonly faded: string;
  /** The lines and name of the selected sky figure. */
  readonly selected: string;
}

export const DEFAULT_SKY_COLOURS: Readonly<SkyColours> = Object.freeze({ figure: "#8fb4ff", label: "#cfe0ff", boundary: "#5f7a9c", ecliptic: "#e0b25a", equator: "#7fd1b9", traced: "#ffd166", faded: "#44546d", selected: "#ffffff" });

/** A trace the host asked for (checked): the figure, how long, what follows, and whether the person asked for less motion when it was asked. */
export interface SkyTraceRequest {
  readonly id: string;
  readonly seconds: number;
  readonly after: SkyTraceAfter;
  readonly reduced: boolean;
}

/** A request to remove a figure's trace the host made (checked): the figure, how long it takes to go (0: at once), and whether the person asked for less motion (then it goes at once). */
export interface SkyClearRequest {
  readonly id: string;
  readonly seconds: number;
  readonly reduced: boolean;
}

/** True when the person asked the system for less motion (`prefers-reduced-motion: reduce`); false where the browser cannot say. */
export function prefersReducedMotion(): boolean {
  return typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The sky colours in force: the look's `skyLines`, every one not named at its default. */
export function skyColoursOf(look: { readonly skyLines?: Partial<SkyColours> }): SkyColours {
  return { ...DEFAULT_SKY_COLOURS, ...look.skyLines };
}

/** How many segments a built-in great circle is cut into (about 2 degrees each). */
const CIRCLE_SEGMENTS = 180;

/** The mean of the unit directions, normalised; the first when they cancel out. */
export function meanDirection(directions: readonly EqjDirection[]): EqjDirection {
  const sum = directions.reduce<[number, number, number]>((acc, d) => [acc[0] + d[0], acc[1] + d[1], acc[2] + d[2]], [0, 0, 0]);
  const length = Math.hypot(sum[0], sum[1], sum[2]);
  return length > 1e-9 ? [sum[0] / length, sum[1] / length, sum[2] / length] : directions[0]!;
}

function circleSegments(point: (angleRad: number) => EqjDirection): readonly (readonly [EqjDirection, EqjDirection])[] {
  const around = Array.from({ length: CIRCLE_SEGMENTS + 1 }, (_, i) => point((2 * Math.PI * i) / CIRCLE_SEGMENTS));
  return around.slice(1).map((end, i) => [around[i]!, end] as const);
}

/** The celestial equator: declination 0, as segments. */
export function celestialEquatorSegments(): readonly (readonly [EqjDirection, EqjDirection])[] {
  return circleSegments((angle) => [Math.cos(angle), Math.sin(angle), 0]);
}

/** The ecliptic of J2000 as segments, turned to EQJ by the engine's own ecliptic-to-equator matrix (STYLE-07: that is the one obliquity). */
export function eclipticSegments(): readonly (readonly [EqjDirection, EqjDirection])[] {
  const m = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
  return circleSegments((angle) => {
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return [m[0]! * x + m[1]! * y, m[3]! * x + m[4]! * y, m[6]! * x + m[7]! * y];
  });
}

/** A camera request with a look-out direction that names a sky figure turned into that figure's label point (the one place a figure id becomes a direction); any other request is returned as it is. */
export function aimAtFigure<T extends CameraRequest>(request: T, figures: readonly Pick<SkyFigureLayer, "id" | "labelAt">[]): T {
  if (request.kind !== "lookOut" || typeof request.direction !== "string") return request;
  const figure = figures.find(({ id }) => id === request.direction);
  return figure === undefined ? request : { ...request, direction: figure.labelAt };
}
