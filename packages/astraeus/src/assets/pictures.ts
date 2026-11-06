import { textureRightsProblem, type TextureRef } from "./licence";
import type { BodyVisual } from "./visual";

/**
 * Pictures that ship in a data package (`astraeus-data`) rather than in the engine, by name: a body id (`titan`), `venus-8k`, `milky-way`.
 * Each carries its own licence record, so the credit travels with the file (PROV-02). A viewer draws only the pictures of the packages passed to it
 * (its definition's `pictures`): a picture that was not passed is simply absent, so the body is drawn as a flat colour and the sky without its
 * Milky Way (DATA-01: nothing is invented to fill the gap), and one viewer's pictures never reach another's.
 */
export type Pictures = Readonly<Record<string, TextureRef>>;

/** No pictures: what a viewer given no data package draws with. */
export const NO_PICTURES: Pictures = Object.freeze({});

/** The pictures of several packages as one set; a later package's picture of the same name replaces an earlier one's. */
export function mergePictures(sets: readonly (Pictures | undefined)[]): Pictures {
  return Object.freeze(Object.assign({}, ...sets.map((set) => set ?? {})) as Record<string, TextureRef>);
}

/** The first picture in the set that fails the rights rule, as "<name> <problem>", or null when every one has exactly one of licence and local-only. */
export function picturesProblem(pictures: Pictures): string | null {
  for (const [name, texture] of Object.entries(pictures)) {
    const problem = textureRightsProblem(texture);
    if (problem !== null) return `the picture "${name}" ${problem}`;
  }
  return null;
}

/**
 * The picture a look draws with, from the pictures this viewer was given: the look's own texture (an engine file) when it has one, else the picture it
 * names. A named large variant (`desktopPicture`) is added to the texture as its desktop file when the viewer holds it. Undefined: flat colour.
 */
export function textureOf(visual: BodyVisual, pictures: Pictures): TextureRef | undefined {
  const base = visual.texture ?? (visual.picture === undefined ? undefined : pictures[visual.picture]);
  if (base === undefined || visual.desktopPicture === undefined) return base;
  const large = pictures[visual.desktopPicture];
  return large === undefined ? base : { ...base, desktop: { url: large.url, widthPx: large.widthPx, heightPx: large.heightPx, minViewportWidthPx: 768 } };
}
