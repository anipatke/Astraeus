import { describe, expect, it } from "vitest";
import html from "../index.html?raw";
import { decodeChunk } from "astraeus/core/chebyshevSeries";
import { readBytes, readJson } from "astraeus/tools/import/test-io.mjs";
import { DEMO_ADDRESSES, RETIRED_ADDRESSES, danglingLinks } from "../tools/validate/public-addresses.mjs";

/** The addresses (O-024 T-091: the two showers are one) the owner's portfolio embeds (O-020 Decision 5), each of which the home page must open. */
const THREE_ADDRESSES = DEMO_ADDRESSES;

/** Every picture in site/, by its address from the repo root. */
const pictures = import.meta.glob("/packages/astraeus-site/site/*.jpg", { eager: false });

describe("home page demo cards (O-017 T-074)", () => {
  const cards = [...html.matchAll(/<a class="demo" href="([^"]+)">\s*<div class="shot"><img src="([^"]+)" alt="([^"]+)">/g)];

  it("links all three experience addresses, once each", () => {
    expect(cards.map((card) => card[1])).toEqual(THREE_ADDRESSES);
  });

  it("gives each card a picture that is in the site folder, with a description of what it shows", () => {
    for (const [, , picture, alt] of cards) {
      expect(Object.keys(pictures)).toContain(`/packages/astraeus-site/${picture}`);
      expect(alt?.length).toBeGreaterThan(40);
    }
  });

  it("links no retired address, and no built page does", () => {
    for (const address of RETIRED_ADDRESSES) expect(html).not.toContain(address);
    expect(danglingLinks(".")).toEqual([]);
  });

  it("names all three in the share text", () => {
    const share = /<meta property="og:description" content="([^"]+)">/.exec(html)?.[1] ?? "";
    for (const name of ["Apollo 11", "meteor showers", "the planets with their moons"]) expect(share).toContain(name);
  });
});

describe("home page curve-fit section (O-025 T-101)", () => {
  const data = JSON.parse(/<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "{}") as {
    startTdbS: number; pieceSeconds: number; jupiterPieceSeconds: number; coefficients: number; io: number[]; jupiter: number[];
    plane: { e1: number[]; e2: number[] }; tableStepMinutes: number;
    figures: { ioTableBytes: number; ioFitBytes: number; ioWorstM: number; bodies: number; worstOfAllM: number; planets?: { beforeBytes: number; afterBytes: number } };
  };
  const dataDir = new URL("../../astraeus/data/ephemerides/jupiter-moons/", import.meta.url).pathname;
  const index = readJson(`${dataDir}index.json`) as { bodies: { id: string; fit: { segmentSeconds: number; degree: number; quantumKm: number }; chunks: { path: string; startTdbS: number; segmentCount: number }[]; accuracy: { span: { worstM: number } } }[] };
  const chunkOf = (id: string) => {
    const body = index.bodies.find((b) => b.id === id)!;
    const entry = body.chunks.find((c) => c.path === `${id}/2016.bin`)!;
    return decodeChunk(readBytes(`${dataDir}${entry.path}`), { startTdbS: entry.startTdbS, segmentSeconds: body.fit.segmentSeconds, segmentCount: entry.segmentCount, coefficientCount: body.fit.degree + 1, quantumKm: body.fit.quantumKm });
  };

  it("draws Io's real fitted pieces: the page holds the committed coefficients, 2 of Io's and 1 of Jupiter's", () => {
    const io = chunkOf("io");
    const jupiter = chunkOf("jupiter");
    const n = data.coefficients;
    const firstIo = Math.round((data.startTdbS - io.startTdbS) / io.segmentSeconds);
    const firstJupiter = Math.round((data.startTdbS - jupiter.startTdbS) / jupiter.segmentSeconds);
    expect(data.io.length).toBe(2 * 3 * n);
    expect(data.jupiter.length).toBe(3 * n);
    data.io.forEach((value, i) => expect(value).toBeCloseTo(io.coefficients[firstIo * 3 * n + i], 4));
    data.jupiter.forEach((value, i) => expect(value).toBeCloseTo(jupiter.coefficients[firstJupiter * 3 * n + i], 4));
    expect(data.pieceSeconds * 2).toBe(data.jupiterPieceSeconds);
  });

  it("puts Io at its orbit's distance from Jupiter everywhere in the window, in the orbit plane", () => {
    const n = data.coefficients;
    const cheb = (c: number[], o: number, x: number) => { let b1 = 0; let b2 = 0; for (let k = n - 1; k >= 1; k -= 1) { const b0 = 2 * x * b1 - b2 + c[o + k]; b2 = b1; b1 = b0; } return x * b1 - b2 + c[o]; };
    for (let t = 0; t <= data.jupiterPieceSeconds; t += 3_600) {
      const piece = Math.min(1, Math.floor(t / data.pieceSeconds));
      const rel = [0, 1, 2].map((a) => cheb(data.io, piece * 3 * n + a * n, 2 * (t / data.pieceSeconds - piece) - 1) - cheb(data.jupiter, a * n, 2 * (t / data.jupiterPieceSeconds) - 1));
      const inPlane = Math.hypot(rel[0] * data.plane.e1[0] + rel[1] * data.plane.e1[1] + rel[2] * data.plane.e1[2], rel[0] * data.plane.e2[0] + rel[1] * data.plane.e2[1] + rel[2] * data.plane.e2[2]);
      expect(Math.hypot(...rel)).toBeGreaterThan(400_000);
      expect(Math.hypot(...rel)).toBeLessThan(445_000);
      expect(inPlane / Math.hypot(...rel)).toBeGreaterThan(0.999);
    }
  });

  it("quotes only measured figures: sizes from the T-096 measurement, accuracy from the index, planets from the T-101 build measurement", () => {
    const measure = readJson(new URL("../../../docs/evidence/o025-t096-20261018T043531Z/measure.json", import.meta.url).pathname) as { rawTables: { id: string; float64Bytes: number; fittedBytes: number; stepMinutes: number }[] };
    const io = measure.rawTables.find((row) => row.id === "io")!;
    expect(data.figures.ioTableBytes).toBe(io.float64Bytes);
    expect(data.figures.ioFitBytes).toBe(io.fittedBytes);
    expect(data.tableStepMinutes).toBe(io.stepMinutes);
    expect(data.figures.ioWorstM).toBe(index.bodies.find((b) => b.id === "io")!.accuracy.span.worstM);
    expect(data.figures.worstOfAllM).toBe(Math.max(...index.bodies.map((b) => b.accuracy.span.worstM)));
    expect(data.figures.worstOfAllM).toBeLessThanOrEqual(1);
    const planets = readJson(new URL("../../../docs/evidence/o025-t101-20261019/planets-size.json", import.meta.url).pathname) as { figures: { beforeBytes: number; afterBytes: number } };
    expect(data.figures.planets).toEqual(expect.objectContaining(planets.figures));
  });

  it("is built phone first: one column, a 44 px slider, no fixed widths, and no motion of its own", () => {
    const css = /\/\* Curve fits[\s\S]*?(?=\n@media \(max-width: 960px\))/.exec(html)?.[0] ?? "";
    expect(css).toContain(".fit-grid { display: grid; grid-template-columns: minmax(0, 1fr);");
    expect(css).toMatch(/@media \(min-width: 760px\) \{ \.fit-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    expect(css).toMatch(/\.fit-row input\[type=range\] \{[^}]*min-height: 44px/);
    expect(css).not.toMatch(/[{;]\s*width: \d+px/);
    expect(css).not.toMatch(/animation|transition/);
    expect(html).toMatch(/<label for="fit-time">/);
  });

  it("runs its script without error: draws every dot, and the slider moves the marker", () => {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((text) => text.includes("fit-photos")) ?? "";
    const made: FakeElement[] = [];
    class FakeElement {
      attrs: Record<string, string> = {}; children: FakeElement[] = []; dataset: Record<string, string> = {}; listeners: Record<string, () => void> = {};
      textContent: string; value = "0";
      constructor(public tag: string, text = "") { this.textContent = text; made.push(this); }
      setAttribute(k: string, v: string) { this.attrs[k] = v; }
      appendChild(child: FakeElement) { this.children.push(child); }
      addEventListener(type: string, fn: () => void) { this.listeners[type] = fn; }
      closest() { return row; }
    }
    const photos = new FakeElement("svg"); const recipe = new FakeElement("svg"); const slider = new FakeElement("input"); const readout = new FakeElement("p"); const row = new FakeElement("div");
    const dataNode = new FakeElement("script", /<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)![1]);
    const document = {
      getElementById: (id: string) => ({ "fit-data": dataNode, "fit-photos": photos, "fit-recipe": recipe }[id] ?? null),
      querySelector: (selector: string) => (selector === "[data-fit-slider]" ? slider : selector === "[data-fit-readout]" ? readout : null),
      querySelectorAll: () => [] as FakeElement[],
      createElementNS: (_ns: string, tag: string) => new FakeElement(tag),
    };
    new Function("document", script)(document);
    const dotPath = photos.children.find((c) => c.attrs.class === "fit-dots")!;
    expect(dotPath.attrs.d.split("M").length - 1).toBe(325);
    expect(row.dataset.fitDots).toBe("325");
    const at = (minutes: number) => { slider.value = String(minutes); slider.listeners.input(); return [Number(row.dataset.fitMarkX), Number(row.dataset.fitMarkY), Number(row.dataset.fitKm)]; };
    const a = at(0); const b = at(1620); const c = at(3240);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeGreaterThan(20);
    for (const p of [a, b, c]) { expect(p[2]).toBeGreaterThan(400_000); expect(p[2]).toBeLessThan(445_000); }
    expect(readout.textContent).toMatch(/^Hour 54\.0 · Io is [\d,]+ km from Jupiter's centre$/);
  });
});
