import { describe, expect, it } from "vitest";
import { dotMaterial } from "../src/app/dotMaterial";

const sources = import.meta.glob("../src/app/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*/g, "$1");

/** Far-away dots are round (owner, O-047 T-203): an untextured point is a square, so every dot goes through dotMaterial. */
describe("round dots", () => {
  it("no file in src/app makes a PointsMaterial except the dot helper", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith("/dotMaterial.ts"))
      .filter(([, source]) => /new\s+PointsMaterial\s*\(/.test(code(source)))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("dotMaterial keeps the caller's size and colour and adds a round map with a cutoff", () => {
    const material = dotMaterial({ color: "#ff0000", size: 3, sizeAttenuation: false });
    expect(material.size).toBe(3);
    expect(material.color.getHexString()).toBe("ff0000");
    expect(material.map).not.toBeNull();
    expect(material.alphaTest).toBeGreaterThan(0);
  });
});
