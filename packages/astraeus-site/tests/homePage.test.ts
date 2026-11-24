import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import html from "../index.html?raw";
import { decodeChunk } from "./helpers/decodeChunk";
import { readBytes, readJson } from "./helpers/testIo.mjs";
import { DEMO_ADDRESSES, RETIRED_ADDRESSES, danglingLinks } from "../tools/validate/public-addresses.mjs";

/** The addresses (O-024 T-091: the two showers are one) the owner's portfolio embeds (O-020 Decision 5), each of which the home page must open. */
const THREE_ADDRESSES = DEMO_ADDRESSES;

/** Every picture in site/, by its address from the repo root. */
const pictures = import.meta.glob("/packages/astraeus-site/site/*.jpg", { eager: false });

describe("home page demo cards (O-017 T-074)", () => {
  const cards = [...html.matchAll(/<a class="demo" href="([^"]+)">\s*<img src="([^"]+)" alt="([^"]+)">/g)];

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
  const data = JSON.parse(
    /<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "{}",
  ) as {
    startTdbS: number;
    pieceSeconds: number;
    jupiterPieceSeconds: number;
    coefficients: number;
    io: number[];
    jupiter: number[];
    plane: { e1: number[]; e2: number[] };
    tableStepMinutes: number;
    figures: {
      ioTableBytes: number;
      ioFitBytes: number;
      ioWorstM: number;
      bodies: number;
      worstOfAllM: number;
      planets?: { beforeBytes: number; afterBytes: number };
    };
  };
  const dataDir = new URL("../../astraeus-data-jupiter/data/jupiter-moons/", import.meta.url).pathname;
  const index = readJson(`${dataDir}index.json`) as {
    bodies: {
      id: string;
      fit: { segmentSeconds: number; degree: number; quantumKm: number };
      chunks: { path: string; startTdbS: number; segmentCount: number }[];
      accuracy: { span: { worstM: number } };
    }[];
  };
  const chunkOf = (id: string) => {
    const body = index.bodies.find((b) => b.id === id)!;
    const entry = body.chunks.find((c) => c.path === `${id}/2016.bin`)!;
    return decodeChunk(readBytes(`${dataDir}${entry.path}`), {
      startTdbS: entry.startTdbS,
      segmentSeconds: body.fit.segmentSeconds,
      segmentCount: entry.segmentCount,
      coefficientCount: body.fit.degree + 1,
      quantumKm: body.fit.quantumKm,
    });
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
    const cheb = (c: number[], o: number, x: number) => {
      let b1 = 0;
      let b2 = 0;
      for (let k = n - 1; k >= 1; k -= 1) {
        const b0 = 2 * x * b1 - b2 + c[o + k];
        b2 = b1;
        b1 = b0;
      }
      return x * b1 - b2 + c[o];
    };
    for (let t = 0; t <= data.jupiterPieceSeconds; t += 3_600) {
      const piece = Math.min(1, Math.floor(t / data.pieceSeconds));
      const rel = [0, 1, 2].map(
        (a) =>
          cheb(data.io, piece * 3 * n + a * n, 2 * (t / data.pieceSeconds - piece) - 1) -
          cheb(data.jupiter, a * n, 2 * (t / data.jupiterPieceSeconds) - 1),
      );
      const inPlane = Math.hypot(
        rel[0] * data.plane.e1[0] + rel[1] * data.plane.e1[1] + rel[2] * data.plane.e1[2],
        rel[0] * data.plane.e2[0] + rel[1] * data.plane.e2[1] + rel[2] * data.plane.e2[2],
      );
      expect(Math.hypot(...rel)).toBeGreaterThan(400_000);
      expect(Math.hypot(...rel)).toBeLessThan(445_000);
      expect(inPlane / Math.hypot(...rel)).toBeGreaterThan(0.999);
    }
  });

  it("quotes only measured figures: sizes from the T-096 measurement, accuracy from the index, planets from the T-101 build measurement", () => {
    const measure = readJson(
      new URL("../../../docs/evidence/o025-t096-20261018T043531Z/measure.json", import.meta.url).pathname,
    ) as { rawTables: { id: string; float64Bytes: number; fittedBytes: number; stepMinutes: number }[] };
    const io = measure.rawTables.find((row) => row.id === "io")!;
    expect(data.figures.ioTableBytes).toBe(io.float64Bytes);
    expect(data.figures.ioFitBytes).toBe(io.fittedBytes);
    expect(data.tableStepMinutes).toBe(io.stepMinutes);
    expect(data.figures.ioWorstM).toBe(index.bodies.find((b) => b.id === "io")!.accuracy.span.worstM);
    expect(data.figures.worstOfAllM).toBe(Math.max(...index.bodies.map((b) => b.accuracy.span.worstM)));
    expect(data.figures.worstOfAllM).toBeLessThanOrEqual(1);
    const planets = readJson(
      new URL("../../../docs/evidence/o025-t101-20261019/planets-size.json", import.meta.url).pathname,
    ) as { figures: { beforeBytes: number; afterBytes: number } };
    expect(data.figures.planets).toEqual(expect.objectContaining(planets.figures));
  });

  it("is built phone first: one column, a 44 px slider, no fixed widths, and no motion of its own", () => {
    const css = /\/\* Curve fits[\s\S]*?(?=\n@media \(max-width: 960px\))/.exec(html)?.[0] ?? "";
    expect(css).toContain(".fit-grid { display: grid; grid-template-columns: minmax(0, 1fr);");
    expect(css).toMatch(
      /@media \(min-width: 760px\) \{ \.fit-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
    );
    expect(css).toMatch(/\.fit-row input\[type=range\] \{[^}]*min-height: 44px/);
    expect(css).not.toMatch(/[{;]\s*width: \d+px/);
    expect(css).not.toMatch(/animation|transition/);
    expect(html).toMatch(/<label for="fit-time">/);
  });

  it("runs its script without error: draws every dot, and the slider moves the marker", () => {
    const script =
      [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map((m) => m[1])
        .find((text) => text.includes("fit-photos")) ?? "";
    const made: FakeElement[] = [];
    class FakeElement {
      attrs: Record<string, string> = {};
      children: FakeElement[] = [];
      dataset: Record<string, string> = {};
      listeners: Record<string, () => void> = {};
      textContent: string;
      value = "0";
      constructor(
        public tag: string,
        text = "",
      ) {
        this.textContent = text;
        made.push(this);
      }
      setAttribute(k: string, v: string) {
        this.attrs[k] = v;
      }
      appendChild(child: FakeElement) {
        this.children.push(child);
      }
      addEventListener(type: string, fn: () => void) {
        this.listeners[type] = fn;
      }
      closest() {
        return row;
      }
    }
    const photos = new FakeElement("svg");
    const recipe = new FakeElement("svg");
    const slider = new FakeElement("input");
    const readout = new FakeElement("p");
    const row = new FakeElement("div");
    const dataNode = new FakeElement(
      "script",
      /<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)![1],
    );
    const document = {
      getElementById: (id: string) =>
        ({ "fit-data": dataNode, "fit-photos": photos, "fit-recipe": recipe })[id] ?? null,
      querySelector: (selector: string) =>
        selector === "[data-fit-slider]" ? slider : selector === "[data-fit-readout]" ? readout : null,
      querySelectorAll: () => [] as FakeElement[],
      createElementNS: (_ns: string, tag: string) => new FakeElement(tag),
    };
    new Function("document", script)(document);
    const dotPath = photos.children.find((c) => c.attrs.class === "fit-dots")!;
    expect(dotPath.attrs.d.split("M").length - 1).toBe(325);
    expect(row.dataset.fitDots).toBe("325");
    const at = (minutes: number) => {
      slider.value = String(minutes);
      slider.listeners.input();
      return [Number(row.dataset.fitMarkX), Number(row.dataset.fitMarkY), Number(row.dataset.fitKm)];
    };
    const a = at(0);
    const b = at(1620);
    const c = at(3240);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeGreaterThan(20);
    for (const p of [a, b, c]) {
      expect(p[2]).toBeGreaterThan(400_000);
      expect(p[2]).toBeLessThan(445_000);
    }
    expect(readout.textContent).toMatch(/^Hour 54\.0 · Io is [\d,]+ km from Jupiter's centre$/);
  });
});

/** The text a page element starts with: the first `attribute="key"` element's text up to its first tag. */
const shown = (attribute: string, key: string): string => {
  const found = new RegExp(`${attribute}="${key}"[^>]*>([^<]*)<`).exec(html);
  if (found === null) throw new Error(`no ${attribute}="${key}" on the home page`);
  return found[1]!;
};
/** Every element with `attribute="key"`, by its text up to its first tag. */
const allShown = (attribute: string, key: string): string[] =>
  [...html.matchAll(new RegExp(`${attribute}="${key}"[^>]*>([^<]*)<`, "g"))].map((m) => m[1]!);
const grouped = (value: number) => value.toLocaleString("en-US");

describe("home page figures (owner's choice of preview A2, 2026-11-24): each one from the engine, the data or the evidence", () => {
  type MoonIndex = { bodies: { id: string; accuracy: { span: { worstM: number; count: number } } }[] };
  const moonIndex = (planet: string) =>
    readJson(
      new URL(`../../astraeus-data-${planet}/data/${planet}-moons/index.json`, import.meta.url).pathname,
    ) as MoonIndex;
  const worstM = (planet: string) => Math.max(...moonIndex(planet).bodies.map((b) => b.accuracy.span.worstM));
  const moonsOf = (planet: string) => moonIndex(planet).bodies.length - 1; // each index holds the planet too
  const PACKAGES = ["mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

  it("shows the hero's call as real public API, with the answer and the sources the engine gives", async () => {
    const { Scene, earth, moon } = await import("astraeus");
    const when = "1969-07-20T20:17:40Z";
    const scene = new Scene().addBody(earth).addBody(moon).setTime(when);
    await scene.load();
    const state = scene.stateOf("moon", when);
    expect(state.center).toBe("earth");
    expect(state.plane).toBe("EQJ");
    const code = /<pre data-home-code>([\s\S]*?)<\/pre>/.exec(html)![1]!.replace(/<[^>]+>/g, "");
    expect(code).toContain(`scene.stateOf("moon", when).positionKm;`);
    expect(code).toContain(`// → [${[...state.positionKm].map((v) => v.toFixed(1)).join(", ")}]`);
    expect(code).toContain(`const when = "${when}";`);
    const provenance = scene.provenanceOf("moon");
    expect(code).toContain(`scene.provenanceOf("moon").sources;`);
    const source = provenance.sources[0]!;
    expect(code.replace(/\s*\n\/\/\s+/g, " ")).toContain(source.slice(0, source.indexOf(",")));
    // The engine's own accuracy note, as the hero notes and the figures quote it.
    const accuracy = provenance.accuracy ?? "";
    const [, count, from, to] =
      /against (\w+) JPL Horizons \(DE441\) geometric vectors from (\d{4}-\d\d) to (\d{4}-\d\d)/.exec(accuracy)!;
    const km = /(\d+(?:\.\d+)?) km in distance/.exec(accuracy)![1]!;
    expect(count).toBe("eight");
    expect(html).toContain(`against 8 JPL Horizons (DE441) vectors, ${from} to ${to}: at most ${km} km in distance`);
    expect(shown("data-home", "moonKm")).toBe(km);
    expect(shown("data-home", "moonRow")).toBe(`within ${km} km`);
    expect(html).toContain(`8 vectors · ${from!.slice(0, 4)} to ${to!.slice(0, 4)}`);
    expect(html).not.toContain("stateAt(");
  });

  it("rounds the planets' recorded differences from Horizons (Mercury to Neptune) up to the 1 km it shows", async () => {
    const A = await import("astraeus");
    const planets = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
    let scene = new A.Scene().addBody(A.sun);
    for (const id of planets) scene = scene.addBody(A[id]);
    await scene.load();
    const kms = planets.flatMap((id) => {
      const text = scene.provenanceOf(id).accuracy ?? "";
      expect(text, id).toMatch(/2 January of each year 1972/);
      return [...text.matchAll(/within (\d+(?:\.\d+)?) km/gi)].map((m) => Number(m[1]));
    });
    expect(kms.length).toBeGreaterThanOrEqual(planets.length);
    expect(Math.max(...kms)).toBeLessThanOrEqual(1);
    expect(Math.max(...kms)).toBeGreaterThan(0.5); // so "1 km" is the honest rounding, not a loose bound
    expect(shown("data-home", "planetsKm")).toBe("1");
    expect(shown("data-home", "planetsRow")).toBe("within 1 km");
  });

  it("takes Io's figures and every moon package's worst difference from the packages' own indexes", () => {
    const io = moonIndex("jupiter").bodies.find((b) => b.id === "io")!.accuracy.span;
    expect(shown("data-home", "ioCm")).toBe(String(Math.round(io.worstM * 100)));
    expect(shown("data-home", "ioRow")).toBe(`within ${Math.round(io.worstM * 100)} cm`);
    expect(allShown("data-home", "ioCount")).toEqual([grouped(io.count), grouped(io.count)]);
    expect(worstM("jupiter")).toBeLessThanOrEqual(1);
    expect(shown("data-home", "jupiterRow")).toBe("within 1 m");
    expect(allShown("data-home", "jupiterMoons")).toEqual([String(moonsOf("jupiter")), String(moonsOf("jupiter"))]);
    expect(worstM("saturn")).toBeGreaterThan(1);
    expect(worstM("saturn")).toBeLessThanOrEqual(20);
    expect(shown("data-home", "saturnRow")).toBe("within 20 m");
    expect(shown("data-home", "saturnMoons")).toBe(String(moonsOf("saturn")));
    for (const planet of ["mars", "uranus", "neptune", "pluto"]) expect(worstM(planet), planet).toBeLessThanOrEqual(1);
    expect(shown("data-home", "otherRow")).toBe("within 1 m");
    expect(shown("data-home", "moonCount")).toBe(String(PACKAGES.reduce((sum, p) => sum + moonsOf(p), 0)));
  });

  it("counts the meteor orbits and the stars from the shipped data", () => {
    const showers = readJson(
      new URL("../../astraeus-demo-showers/tests/fixtures/showers-before-rebuild.json", import.meta.url).pathname,
    ) as Record<"perseids" | "geminids", { group: { count: number } }>;
    expect(shown("data-home", "perseids")).toBe(grouped(showers.perseids.group.count));
    expect(shown("data-home", "geminids")).toBe(grouped(showers.geminids.group.count));
    const stars = readJson(
      new URL("../../astraeus/src/assets/stars/hyg-v42-naked-eye.json", import.meta.url).pathname,
    ) as { stars: unknown[] };
    expect(shown("data-home", "stars")).toBe(grouped(stars.stars.length));
  });

  it("states the curve-fit table's step, years and window start from the fit data, and its fallback text equals what the script writes", () => {
    const data = JSON.parse(/<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)![1]!) as {
      startTdbS: number;
      tableStepMinutes: number;
      figures: { span: [string, string]; ioWorstM: number };
    };
    expect(shown("data-home", "step")).toBe(String(data.tableStepMinutes));
    expect(shown("data-home", "spanFrom")).toBe(data.figures.span[0].slice(0, 4));
    expect(shown("data-home", "spanTo")).toBe(data.figures.span[1].slice(0, 4));
    // TDB seconds from J2000 (2000-01-01 12:00 TDB), written as a TDB calendar time.
    const start = new Date(Date.UTC(2000, 0, 1, 12) + data.startTdbS * 1000);
    const month = start.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
    const hhmm = start.toISOString().slice(11, 16);
    expect(shown("data-home", "fitStart")).toBe(`${start.getUTCDate()} ${month} ${start.getUTCFullYear()} ${hhmm} TDB`);
    // Run the page's script with every data-fit element present; each one's text before the script runs must equal what the script writes.
    const script =
      [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map((m) => m[1])
        .find((text) => text?.includes("fit-photos")) ?? "";
    const written = new Map<string, string>();
    const node = (key?: string) => ({
      attrs: {} as Record<string, string>,
      dataset: {} as Record<string, string>,
      children: [] as unknown[],
      value: "0",
      listeners: {} as Record<string, () => void>,
      setAttribute() {},
      appendChild(child: unknown) {
        this.children.push(child);
      },
      addEventListener(type: string, fn: () => void) {
        this.listeners[type] = fn;
      },
      closest: () => node(),
      set textContent(text: string) {
        if (key !== undefined) written.set(key, text);
      },
    });
    const readout = node("readout");
    const document = {
      getElementById: (id: string) =>
        id === "fit-data"
          ? { textContent: /<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html)![1] }
          : id === "fit-photos" || id === "fit-recipe"
            ? node()
            : null,
      querySelector: (selector: string) =>
        selector === "[data-fit-slider]" ? node() : selector === "[data-fit-readout]" ? readout : null,
      querySelectorAll: (selector: string) => [node(/data-fit="([^"]+)"/.exec(selector)![1])],
      createElementNS: () => node(),
    };
    new Function("document", script)(document);
    const body = html.slice(0, html.indexOf("<script>"));
    const keys = [...new Set([...body.matchAll(/data-fit="(\w+)"/g)].map((m) => m[1]!))];
    expect(keys.length).toBeGreaterThan(5);
    for (const key of keys) {
      expect(written.has(key), key).toBe(true);
      for (const text of allShown("data-fit", key)) expect(text, key).toBe(written.get(key));
    }
    expect(/data-fit-readout>([^<]*)</.exec(html)![1]).toBe(written.get("readout"));
    expect(written.get("accuracy")).toBe(`${Math.round(data.figures.ioWorstM * 100)} cm`);
    expect(html).not.toContain("over those years");
  });
});

describe("home page accuracy scale and type (owner's choice of colour preview A, 2026-11-24)", () => {
  const body = html.slice(html.indexOf("<body>") + "<body>".length, html.indexOf("<script>"));
  const script =
    [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!).find((text) => text.includes("scale-bar")) ??
    "";
  const metresIn = (text: string): number => {
    const m = /([\d.,]+)\s*(cm|km|m)\b/.exec(text);
    if (m === null) throw new Error(`no length in ${JSON.stringify(text)}`);
    return Number(m[1]!.replace(/,/g, "")) * { cm: 0.01, m: 1, km: 1000 }[m[2] as "cm" | "m" | "km"];
  };
  const run = () => {
    const window = new Window();
    const document = window.document as unknown as Document;
    document.body.innerHTML = body;
    new Function("document", script)(document);
    return document;
  };

  it("draws the legend's marks from the comparison table, one per distinct difference, at its place on the log scale", () => {
    const document = run();
    const table = [...document.querySelectorAll(".facts td.fig")].map((cell) => metresIn(cell.textContent ?? ""));
    const marks = [...document.querySelectorAll<HTMLElement>(".scale-mark")];
    expect(marks.map((m) => Number(m.dataset.metres))).toEqual([...new Set(table)].sort((a, b) => a - b));
    for (const mark of marks) {
      const metres = Number(mark.dataset.metres);
      expect(Number.parseFloat(mark.style.left)).toBeCloseTo(((Math.log10(metres) + 2) / 6) * 100, 1);
    }
  });

  it("colours each figure by its own number: the same colour as the legend mark at that difference, darker as the difference grows", () => {
    const document = run();
    const colourOf = (el: Element) => (el as HTMLElement).style.getPropertyValue("--scale-c");
    const byMetres = new Map(
      [...document.querySelectorAll<HTMLElement>(".scale-mark")].map((m) => [Number(m.dataset.metres), colourOf(m)]),
    );
    const painted = [
      ...document.querySelectorAll(".figures b, [data-home-moon-check], [data-fit='accuracy'], .facts td.fig"),
    ].filter((el) => /\d\s*(cm|km|m)\b/.test(el.textContent ?? ""));
    expect(painted.length).toBeGreaterThanOrEqual(11);
    for (const el of painted)
      expect(colourOf(el), el.textContent ?? "").toBe(byMetres.get(metresIn(el.textContent ?? "")));
    // The moon count is not a difference, so it keeps the page's gold.
    expect(colourOf(document.querySelector('[data-home="moonCount"]')!)).toBe("");
    const lightness = [...byMetres.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, colour]) => Number(/oklch\(([\d.]+)/.exec(colour)![1]));
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]).toBeLessThan(lightness[i - 1]!);
  });

  it("loads only the faces and weights the page uses: IBM Plex Sans and Mono", () => {
    const link = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/.exec(html)![1]!;
    const families = [...link.matchAll(/family=([^:&]+):wght@([\d;]+)/g)].map((m) => ({
      name: m[1]!.replace(/\+/g, " "),
      weights: m[2]!.split(";").map(Number),
    }));
    expect(families.map((f) => f.name)).toEqual(["IBM Plex Sans", "IBM Plex Mono"]);
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)![1]!;
    for (const family of families) {
      expect(css).toContain(`"${family.name}"`);
      for (const weight of family.weights)
        if (weight !== 400)
          expect(new RegExp(`font(-weight)?: ${weight}\\b`).test(css), `${family.name} ${weight}`).toBe(true);
    }
    for (const retired of ["Inter", "Newsreader", "JetBrains Mono"]) expect(html).not.toContain(`"${retired}"`);
  });
});
