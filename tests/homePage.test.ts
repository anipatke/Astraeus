import { describe, expect, it } from "vitest";
import html from "../index.html?raw";

/** The addresses the owner's portfolio embeds (O-020 Decision 5), each of which the home page must open. */
const FIVE_ADDRESSES = ["app.html", "app.html?experience=shower-perseids", "app.html?experience=shower-geminids", "app.html?experience=earth-moon", "app.html?experience=jupiter-io"];

/** Every picture in site/, by its address from the repo root. */
const pictures = import.meta.glob("/site/*.jpg", { eager: false });

describe("home page demo cards (O-017 T-074)", () => {
  const cards = [...html.matchAll(/<a class="demo" href="([^"]+)">\s*<div class="shot"><img src="([^"]+)" alt="([^"]+)">/g)];

  it("links all five experience addresses, once each", () => {
    expect(cards.map((card) => card[1])).toEqual(FIVE_ADDRESSES);
  });

  it("gives each card a picture that is in the site folder, with a description of what it shows", () => {
    for (const [, , picture, alt] of cards) {
      expect(Object.keys(pictures)).toContain(`/${picture}`);
      expect(alt?.length).toBeGreaterThan(40);
    }
  });

  it("names all five in the share text", () => {
    const share = /<meta property="og:description" content="([^"]+)">/.exec(html)?.[1] ?? "";
    for (const name of ["Apollo 11", "Perseids", "Geminids", "Earth and the Moon", "Jupiter and Io"]) expect(share).toContain(name);
  });
});
