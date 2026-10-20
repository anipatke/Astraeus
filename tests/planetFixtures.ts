import excerpt from "./fixtures/iau-pck-excerpt.txt?raw";
import type { PlanetId } from "../src/core/astronomyAdapter";
import type { IauRotationElements } from "../src/core/iauRotation";
import positionFixture from "./fixtures/planets-horizons.json";
import rotationFixture from "./fixtures/planets-rotation-horizons.json";

/** The four planets with catalogue bodies and archived Horizons vectors in planets-horizons.json (the outer planets: outer-planets-horizons.json). */
export const PLANETS = ["mercury", "venus", "mars", "jupiter"] as const satisfies readonly PlanetId[];
export { positionFixture, rotationFixture };

interface PckLine { readonly kernel: string; readonly body: number; readonly key: string; readonly values: number[] }

/** The raw NAIF kernel lines archived in tests/fixtures/iau-pck-excerpt.txt, parsed. */
export function pckLines(): PckLine[] {
  const text = excerpt;
  const lines: PckLine[] = [];
  for (const line of text.split("\n")) {
    const match = /^(pck\d+)\s+BODY(\d+)_(POLE_RA|POLE_DEC|PM)\s*=\s*\(([^)]*)\)/.exec(line);
    if (match === null) continue;
    lines.push({ kernel: match[1], body: Number(match[2]), key: match[3], values: match[4].trim().split(/\s+/).map(Number) });
  }
  return lines;
}

/** IAU elements as a kernel states them (pole per century, W per day; the third value is the unused quadratic term). */
export function elementsFromKernel(kernel: string, body: number): IauRotationElements {
  const pick = (key: string): number[] => {
    const line = pckLines().find((candidate) => candidate.kernel === kernel && candidate.body === body && candidate.key === key);
    if (line === undefined) throw new Error(`no ${key} for ${body} in ${kernel}`);
    return line.values;
  };
  const pair = (key: string): readonly [number, number] => [pick(key)[0], pick(key)[1]];
  return { poleRaDeg: pair("POLE_RA"), poleDecDeg: pair("POLE_DEC"), primeMeridianDeg: pair("PM"), citation: `NAIF ${kernel}.tpc` };
}
