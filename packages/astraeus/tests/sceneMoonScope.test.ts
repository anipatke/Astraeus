// @vitest-environment happy-dom
// O-084 T-358: every public path reads the scene's own moon data and never the process-wide systems, which this project preloads (vitest.setup.ts). A path that falls back to them fails here.
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runtimeOf = vi.hoisted(() => new WeakMap<Element, import("../src/app/AstraeusScene").SceneRuntime>());
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: { runtime: import("../src/app/AstraeusScene").SceneRuntime }) =>
    createElement("div", {
      "data-testid": "scene",
      ref: (el: HTMLDivElement | null) => {
        if (el) runtimeOf.set(el, props.runtime);
      },
    }),
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { io, jupiter, sun } from "../src/api/bodies";
import type { DataSource } from "../src/api/data";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { catalogue, bindCatalogue } from "../src/assets/catalogue";
import { createSceneMoonData } from "../src/core/moonData";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const T2016 = Date.parse("2016-06-01T00:00:00Z");
const km = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const m of mounted.splice(0)) m.unmount();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

const sunJupiter = () =>
  new Scene()
    .addBody(sun)
    .addBody(jupiter)
    .setTimeline({ start: Date.UTC(2016, 4, 15), end: Date.UTC(2016, 5, 15), rate: 60, rates: [60, 3600] });
/** Jupiter's barycentre answer: a resolver whose catalogue holds no moon data of its own, made apart from any Scene. */
const barycentre = () => {
  const own = bindCatalogue(catalogue, createSceneMoonData());
  return createStateResolver(own.definitions(), own.sources(), createOrbAstronomyAdapter()).stateOf(
    "jupiter",
    T2016,
    "sun",
  );
};
const preloaded = () =>
  createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter()).stateOf(
    "jupiter",
    T2016,
    "sun",
  );

/** Jupiter's committed moon fits behind a counting fetch. */
function stubData() {
  const folder = moonDataFolder("jupiter");
  const index = readJson(`${folder}index.json`) as { bodies: { chunks: { path: string }[] }[] };
  const chunkUrls: Record<string, string> = Object.fromEntries(
    index.bodies.flatMap((body) => body.chunks.map(({ path }) => [path, `${folder}${path}`])),
  );
  const fetched: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    fetched.push(url);
    const bytes = readBytes(url) as Uint8Array;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    };
  });
  const data: DataSource[] = [
    {
      name: "astraeus-data-jupiter",
      provides: ["io", "amalthea"],
      moonPositions: { center: "jupiter", loadIndex: async () => index, chunkUrls },
    },
  ];
  return { data, fetched };
}
const open = async (scene: Scene, data: readonly DataSource[] = []) => {
  const element = document.createElement("div");
  document.body.append(element);
  const viewer = mount(element, scene, { data });
  mounted.push(viewer);
  await viewer.ready;
  return runtimeOf.get(element.querySelector("[data-testid=scene]")!)!;
};
const listedScene = (year: number) =>
  new Scene()
    .addBody(jupiter)
    .addBody(io)
    .addBodySet({
      id: "small",
      families: [{ id: "f", label: "F" }],
      members: [{ id: "amalthea", family: "f" }],
      provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "Not real.", notes: "" },
    })
    .setTimeline({ start: Date.UTC(year, 2, 1), end: Date.UTC(year, 2, 20), rate: 60, rates: [60, 3600] });

describe("a scene reads its own moon data, never the process-wide systems", () => {
  it("the preloaded systems would move Jupiter, so the other rows mean something", () => {
    expect(km(preloaded().positionKm, barycentre().positionKm)).toBeGreaterThan(1);
  });

  it("row 1: a scene with no moon data answers Jupiter's barycentre, not the preloaded centre", async () => {
    const scene = sunJupiter();
    await scene.load();
    expect(scene.stateOf("jupiter", T2016)).toEqual(barycentre());
  });

  it("row 2: the mounted viewer's resolver answers the same", async () => {
    const runtime = await open(sunJupiter());
    expect(runtime.resolver.stateOf("jupiter", T2016, "sun")).toEqual(barycentre());
  });

  it("row 3: a listed-moon set answers from its scene's own chunks, and another scene's set without that window throws", async () => {
    const { data } = stubData();
    const a = await open(listedScene(2020), data);
    const b = await open(listedScene(2023), data);
    const instant = Date.parse("2020-03-05T00:00:00Z");
    expect(() => a.bodySets![0]!.group.memberStateAt(0, instant)).not.toThrow();
    // Before its window a group may read any chunk its own scene holds: B holds 2023 only, so A's 2020 chunks must not answer for it.
    const out = new Float64Array(3);
    expect(() => a.bodySets![0]!.group.memberPositionKmInto(0, instant, out, 0)).not.toThrow();
    expect(() => b.bodySets![0]!.group.memberPositionKmInto(0, instant, out, 0)).toThrow();
  });

  it("row 4: load then mount of one scene fetches no chunk again", async () => {
    const { data, fetched } = stubData();
    const scene = listedScene(2020);
    await scene.load({ data });
    const loaded = fetched.length;
    expect(loaded).toBeGreaterThan(0);
    await open(scene, data);
    expect(fetched.length).toBe(loaded);
  });
});
