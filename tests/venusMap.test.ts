import { afterEach, describe, expect, it, vi } from "vitest";
import { describeBody } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { VENUS_LIGHT, VENUS_MATERIAL, VENUS_TEXTURE, VENUS_VISUAL } from "../src/assets/bodies/venus";
import { textureRightsProblem, textureUrlFor } from "../src/assets/licence";
import { trueScale } from "../src/core/scalePolicy";
import { buildShowerDefinition, showerComposition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseidsFile from "../data/showers/perseids.json";
import geminidsFile from "../data/showers/geminids.json";

// Node modules are loaded by a computed name so the browser-typed project needs no node types (as tests/publicBuild.test.ts does).
const node = async (name: string): Promise<any> => import(/* @vite-ignore */ `node:${name}`);
const shippedPackage = async () => {
  const { readFileSync } = await node("fs");
  return JSON.parse(readFileSync("data/bodies/venus/map.json", "utf8") as string) as { textures: { src: string; sha256: string; minViewportWidth?: number }[] };
};
const sha = async (file: string): Promise<string> => {
  const [{ readFileSync }, { createHash }] = [await node("fs"), await node("crypto")];
  return createHash("sha256").update(readFileSync(`src/assets/textures/${file}`)).digest("hex") as string;
};
const desktop = VENUS_TEXTURE.desktop!;

afterEach(() => vi.unstubAllGlobals());

describe("Venus Magellan map (I-054)", () => {
  it("picks the 2k file below 768 px and the 8k file from 768 px up", async () => {
    for (const width of [320, 375, 414, 600, 767]) expect(textureUrlFor(VENUS_TEXTURE, width)).toBe(VENUS_TEXTURE.url);
    for (const width of [768, 1024, 1920]) expect(textureUrlFor(VENUS_TEXTURE, width)).toBe(desktop.url);
    expect(VENUS_TEXTURE.url).not.toBe(desktop.url);
    expect(desktop.minViewportWidth).toBe(768);
    expect((await shippedPackage()).textures.find((t) => t.src.includes("8k"))?.minViewportWidth).toBe(768);
  });

  it("a phone-width window never gets the 8k file from the draw plan; a desktop one does", () => {
    const venus = catalogue.get("venus");
    vi.stubGlobal("window", { innerWidth: 375 });
    expect(describeBody(venus, trueScale).textureUrl).toBe(VENUS_TEXTURE.url);
    vi.stubGlobal("window", { innerWidth: 1280 });
    expect(describeBody(venus, trueScale, true).textureUrl).toBe(desktop.url);
    vi.stubGlobal("window", { innerWidth: 375 });
    expect(describeBody(venus, trueScale, true).textureUrl).toBe(VENUS_TEXTURE.url);
  });

  it("asks for the 2k file at desktop width unless the experience opts in (I-068, T-141)", () => {
    const venus = catalogue.get("venus");
    vi.stubGlobal("window", { innerWidth: 1280 });
    expect(describeBody(venus, trueScale).textureUrl).toBe(VENUS_TEXTURE.url);
    expect(describeBody(venus, trueScale, false).textureUrl).toBe(VENUS_TEXTURE.url);
  });

  it("a desktop-width showers page draws Venus from the 2k file", () => {
    vi.stubGlobal("window", { innerWidth: 1280 });
    for (const file of [perseidsFile, geminidsFile]) {
      const settings = parseShowerSettings(file);
      expect(showerComposition(settings).bodies).toContain("venus");
      const definition = buildShowerDefinition(settings, { kind: "absent" });
      expect(definition.desktopTextures).toBeUndefined();
      expect(describeBody(catalogue.get("venus"), trueScale, definition.desktopTextures === true).textureUrl).toBe(VENUS_TEXTURE.url);
    }
  });

  it("leaves a body with no variant on its one file", () => {
    const earth = catalogue.get("earth").visual.texture!;
    expect(earth.desktop).toBeUndefined();
    expect(textureUrlFor(earth, 375)).toBe(earth.url);
    expect(textureUrlFor(earth)).toBe(earth.url);
  });

  it("ships the donor files byte for byte", async () => {
    const sums = Object.fromEntries((await shippedPackage()).textures.map((t) => [t.src.split("/").pop(), t.sha256]));
    expect(await sha("venus-2k-balanced.jpg")).toBe(sums["venus-2k-balanced.jpg"]);
    expect(await sha("venus-8k-balanced.jpg")).toBe(sums["venus-8k-balanced.jpg"]);
  });

  it("uses the donor material and lighting, with no yaw, and a public-domain licence", () => {
    expect(VENUS_MATERIAL).toEqual({ color: "#f6e1b9", emissive: "#4f2e16", emissiveIntensity: 0.04, roughness: 0.9, metalness: 0.04 });
    expect(VENUS_LIGHT).toEqual({ ambient: 0.24, directional: 1.18 });
    expect(VENUS_VISUAL.light).toBe(VENUS_LIGHT);
    expect(VENUS_VISUAL.textureYawRad).toBe(0);
    expect(VENUS_TEXTURE.licence?.licence).toBe("public domain");
    expect(VENUS_TEXTURE.licence?.source).toContain("USGS");
    expect(textureRightsProblem(VENUS_TEXTURE)).toBeNull();
  });
});
