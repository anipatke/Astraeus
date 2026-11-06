// The page heading (moved from the engine's experience contract tests, O-059 T-272): the site writes it, from each demo's own label.
import { describe, expect, it } from "vitest";
import appHtml from "../app.html?raw";
import { APOLLO11_LABEL } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import { JUPITER_LABEL } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";
import { pageTitle } from "../src/pageTitle";

describe("the page heading", () => {
  it("is Astraeus until an experience opens, then the experience's own label before it", () => {
    expect(appHtml).toMatch(/<title>Astraeus<\/title>/);
    expect(appHtml).not.toMatch(/spike/i);
    expect(pageTitle(undefined)).toBe("Astraeus");
    expect(pageTitle("  ")).toBe("Astraeus");
    expect(pageTitle("Perseids")).toBe("Perseids · Astraeus");
  });

  it("is taken from each real experience's own label, so the engine names none", () => {
    const titles = [APOLLO11_LABEL, JUPITER_LABEL, parseShowerSettings(perseidsFile).label].map(pageTitle);
    expect(titles).toEqual(["Apollo 11 · Astraeus", "Jupiter and Io · Astraeus", "Perseids · Astraeus"]);
  });
});
