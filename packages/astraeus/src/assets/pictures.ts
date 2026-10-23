import type { TextureRef } from "./licence";
import type { BodyVisual } from "./visual";

/**
 * Pictures that ship in a data package (`astraeus-data`) rather than in the engine, by name: a body id (`titan`), `venus-8k`, `milky-way-left`.
 * Each carries its own licence record, so the credit travels with the file (PROV-02). A picture that was never registered is simply absent:
 * the body is drawn as a flat colour, the sky without its Milky Way (DATA-01: nothing is invented to fill the gap).
 */
export type Pictures = Readonly<Record<string, TextureRef>>;

const book = new Map<string, TextureRef>();

/** Makes a package's pictures known; later calls add to or replace earlier ones of the same name. */
export function registerPictures(set: Pictures): void {
  for (const [name, texture] of Object.entries(set)) book.set(name, texture);
}

export function pictureOf(name: string): TextureRef | undefined {
  return book.get(name);
}

/** The names registered so far, for tests and error messages. */
export function registeredPictures(): readonly string[] {
  return [...book.keys()];
}

/** Forgets every registered picture (tests only). */
export function clearPictures(): void {
  book.clear();
}

/** A visual whose `texture` is read from the registered picture when asked for, so it picks the picture up whenever the data package is registered. */
export function withPicture(name: string, visual: Omit<BodyVisual, "texture">): BodyVisual {
  const look = { ...visual };
  Object.defineProperty(look, "texture", { enumerable: true, get: () => pictureOf(name) });
  return Object.freeze(look) as BodyVisual;
}
