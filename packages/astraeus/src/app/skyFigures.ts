// Sky figures as the app draws them: figures, outlines and the two reference circles, all as unit directions in the EQJ frame at infinity (ARCH-02: presentation only, no State).
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";

export type EqjDirection = readonly [number, number, number];

/** One figure ready to draw: segments (pairs of unit EQJ directions), the kind the display switches act on, and where its label stands. */
export interface SkyFigureLayer {
  readonly id: string;
  readonly label: string;
  readonly kind: "figure" | "boundary";
  readonly segments: readonly (readonly [EqjDirection, EqjDirection])[];
  /** Unit EQJ direction of the label. */
  readonly labelAt: EqjDirection;
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

/** The fixed default colours of the lines and their labels (T-296 turns these into looks); the one place they are stated. */
export const SKY_LINE_COLOURS = Object.freeze({ figure: "#8fb4ff", boundary: "#5f7a9c", ecliptic: "#e0b25a", celestialEquator: "#7fd1b9" });

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
