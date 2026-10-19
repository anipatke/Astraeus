import { describe, expect, it } from "vitest";
import html from "../index.html?raw";
import { DEMO_ADDRESSES, RETIRED_ADDRESSES, danglingLinks } from "../tools/validate/public-addresses.mjs";

/** The addresses (O-024 T-091: the two showers are one) the owner's portfolio embeds (O-020 Decision 5), each of which the home page must open. */
const THREE_ADDRESSES = DEMO_ADDRESSES;

/** Every picture in site/, by its address from the repo root. */
const pictures = import.meta.glob("/site/*.jpg", { eager: false });

describe("home page demo cards (O-017 T-074)", () => {
  const cards = [...html.matchAll(/<a class="demo" href="([^"]+)">\s*<div class="shot"><img src="([^"]+)" alt="([^"]+)">/g)];

  it("links all three experience addresses, once each", () => {
    expect(cards.map((card) => card[1])).toEqual(THREE_ADDRESSES);
  });

  it("gives each card a picture that is in the site folder, with a description of what it shows", () => {
    for (const [, , picture, alt] of cards) {
      expect(Object.keys(pictures)).toContain(`/${picture}`);
      expect(alt?.length).toBeGreaterThan(40);
    }
  });

  it("links no retired address, and no built page does", () => {
    for (const address of RETIRED_ADDRESSES) expect(html).not.toContain(address);
    expect(danglingLinks(".")).toEqual([]);
  });

  it("names all three in the share text", () => {
    const share = /<meta property="og:description" content="([^"]+)">/.exec(html)?.[1] ?? "";
    for (const name of ["Apollo 11", "meteor showers", "Jupiter and Io"]) expect(share).toContain(name);
  });
});
