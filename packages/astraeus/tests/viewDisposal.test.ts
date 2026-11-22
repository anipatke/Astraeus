// @vitest-environment happy-dom
// O-092 T-429: every view that makes GPU objects frees them when it goes, and only them. One table over the view classes: each row builds the view
// from made-up data, listens for `dispose` on everything reachable from its root, and calls `dispose()`. A scan fails when a new view class makes
// geometry, materials or textures and is not in the table (the trap becomes a failing test).
import { PICTURES } from "astraeus-data";
import { Texture, TextureLoader, type BufferGeometry, type Object3D } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { milkyWayPicture } from "../src/assets/sky";
import { BodySetView } from "../src/app/BodySetView";
import { KeplerPoints } from "../src/app/KeplerPoints";
import { OrbitSetView } from "../src/app/OrbitSetView";
import { PathView } from "../src/app/PathView";
import { PointsView } from "../src/app/PointsView";
import { RingView } from "../src/app/RingView";
import { SkyFiguresView } from "../src/app/SkyFiguresView";
import { SkyView } from "../src/app/SkyView";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import {
  MADE_UP_STARS,
  ORBIT_LOOK,
  RING_BANDS,
  belt,
  bodySetLayer,
  listen,
  owned,
  pathLayer,
  skyFigureLayers,
  trackedBody,
} from "./disposalFixtures";

// The same layer objects feed every build of a row, as one page's two viewers share one definition.
const small = belt(50);
const large = belt(2500);
const body = trackedBody();
const setLayer = bodySetLayer();
const figures = skyFigureLayers();

interface Row {
  readonly name: string;
  /** The class the row covers, for the scan. */
  readonly cls: string;
  readonly make: () => { readonly roots: readonly Object3D[]; readonly dispose: () => void };
}

const rows: readonly Row[] = [
  {
    name: "PathView, bare line",
    cls: "PathView",
    make: () => {
      const view = new PathView(pathLayer);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "PathView, with the orbit look",
    cls: "PathView",
    make: () => {
      const view = new PathView(pathLayer, { orbitLook: ORBIT_LOOK });
      expect(view.group.children).toHaveLength(2);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "PointsView, small",
    cls: "PointsView",
    make: () => {
      const view = new PointsView(small);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "PointsView, large (with its shader-placed child)",
    cls: "PointsView",
    make: () => {
      const view = new PointsView(large);
      expect(view.group.children).toHaveLength(2);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "KeplerPoints",
    cls: "KeplerPoints",
    make: () => {
      const points = new KeplerPoints(large.group.keplerElements!()!, "#ffffff", 4);
      return { roots: [points.points], dispose: () => points.dispose() };
    },
  },
  {
    name: "TrackedBodyView",
    cls: "TrackedBodyView",
    make: () => {
      const view = new TrackedBodyView(body);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "BodySetView",
    cls: "BodySetView",
    make: () => {
      const view = new BodySetView(setLayer);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "OrbitSetView",
    cls: "OrbitSetView",
    make: () => {
      const view = new OrbitSetView(setLayer);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "SkyView (stars set, picture built)",
    cls: "SkyView",
    make: () => {
      const view = new SkyView({
        starBrightness: 1,
        milkyWayBrightness: 1,
        pixelRatio: 1,
        picture: null,
        pictureSet: milkyWayPicture(PICTURES),
        milkyWay: true,
      });
      view.requestPicture();
      view.setStars(MADE_UP_STARS);
      expect(view.group.children).toHaveLength(2);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "SkyFiguresView",
    cls: "SkyFiguresView",
    make: () => {
      const view = new SkyFiguresView(figures);
      return { roots: [view.group], dispose: () => view.dispose() };
    },
  },
  {
    name: "RingView",
    cls: "RingView",
    make: () => {
      const view = new RingView(RING_BANDS, 0.01, 3);
      return { roots: [view.mesh], dispose: () => view.dispose() };
    },
  },
];

beforeEach(() => {
  vi.spyOn(TextureLoader.prototype, "load").mockImplementation(() => new Texture());
  const gradient = { addColorStop: vi.fn() };
  // A canvas context that accepts every drawing call and records none (there is no GPU or canvas here).
  const quiet: CanvasRenderingContext2D = new Proxy({} as CanvasRenderingContext2D, {
    get: (_t, key) =>
      key === "createRadialGradient" || key === "createLinearGradient" ? () => gradient : () => undefined,
    set: () => true,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(quiet as never);
});
afterEach(() => vi.restoreAllMocks());

describe("a view frees what it made when it goes", () => {
  it.each(rows)("$name: every geometry, material and texture hears dispose, and the data stays", ({ make }) => {
    const { roots, dispose } = make();
    const objects = owned(...roots);
    expect(objects.size).toBeGreaterThan(0);
    const heard = listen(objects);
    const sizes = (): number[] =>
      [...objects].flatMap((object) =>
        (object as BufferGeometry).isBufferGeometry === true
          ? Object.values((object as BufferGeometry).attributes).flatMap((a) => [a.array.length, a.count])
          : [],
      );
    const before = sizes();
    expect(before.length).toBeGreaterThan(0);
    dispose();
    for (const [object, count] of heard) expect(count, `${object.type} ${object.uuid}`).toBeGreaterThanOrEqual(1);
    // Only the GPU copies go: every attribute keeps its array, so a view freed and then drawn again is uploaded afresh (StrictMode).
    expect(sizes()).toEqual(before);
  });

  it.each(rows)("$name: two views of one layer share nothing, and freeing one leaves the other alone", ({ make }) => {
    const first = make();
    const second = make();
    const mine = owned(...first.roots);
    const theirs = owned(...second.roots);
    for (const object of mine) expect(theirs.has(object), `${object.type} shared`).toBe(false);
    const heardMine = listen(mine);
    const heardTheirs = listen(theirs);
    first.dispose();
    for (const count of heardTheirs.values()) expect(count).toBe(0);
    for (const count of heardMine.values()) expect(count).toBeGreaterThanOrEqual(1);
    second.dispose();
    for (const count of heardTheirs.values()) expect(count).toBeGreaterThanOrEqual(1);
  });
});

const sources = import.meta.glob(["../src/app/*.ts", "../src/app/*.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("no view class skips disposal", () => {
  it("requires every exported class that builds geometry, materials or textures to have dispose() and a row in the table", () => {
    const covered = new Set(rows.map((row) => row.cls));
    const makers = /new \w*(Geometry|Material|Texture)\(|dotMaterial\(/;
    const found: string[] = [];
    const missing: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      for (const match of text.matchAll(/^export class (\w+)[^\n]*\{\n([\s\S]*?)\n\}\n/gm)) {
        const [, name, classBody] = match;
        if (!makers.test(classBody!)) continue;
        found.push(name!);
        if (!/\n {2}dispose\(/.test(classBody!)) missing.push(`${name} (${file}) has no dispose()`);
        if (!covered.has(name!)) missing.push(`${name} (${file}) is not a row of the disposal table`);
      }
    }
    expect(found.length).toBeGreaterThanOrEqual(8); // the scan itself sees the views
    expect(missing).toEqual([]);
  });
});
