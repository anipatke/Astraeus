// @vitest-environment happy-dom
// No GPU picture is shared between viewers (O-092 T-428): each dot material, anchor material and halo makes its own, so one viewer's
// disposal can never reach what another viewer draws. The canvas gradient is a recording stub (the halo picture is a canvas).
import {
  Sprite,
  type BufferGeometry,
  type Material,
  type PointsMaterial,
  type SpriteMaterial,
  type Texture,
} from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGlow } from "../src/app/bodyDraw";
import { dotMaterial } from "../src/app/dotMaterial";
import { anchorSpriteTexture } from "../src/app/TrackedBodyView";

beforeEach(() => {
  const gradient = { addColorStop: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    createRadialGradient: () => gradient,
    fillRect: vi.fn(),
    set fillStyle(_v: unknown) {
      /* recorded by nothing */
    },
    // `never`: the spy types its return from getContext's last overload, which @types/three 0.181 widens to GPUCanvasContext (I-195); type-only.
  } as never);
});
afterEach(() => vi.restoreAllMocks());

type Disposable = BufferGeometry | Material | Texture;
/** Counts `dispose` events heard by each object. */
function listen(objects: readonly Disposable[]): Map<Disposable, number> {
  const heard = new Map<Disposable, number>();
  for (const object of objects) {
    heard.set(object, 0);
    object.addEventListener("dispose", () => heard.set(object, (heard.get(object) ?? 0) + 1));
  }
  return heard;
}

describe("each material owns its pictures", () => {
  it("makes a new round dot for each material, and none when the caller passes its own map", () => {
    expect(dotMaterial({}).map).not.toBe(dotMaterial({}).map);
    const own = anchorSpriteTexture();
    expect(dotMaterial({ map: own }).map).toBe(own);
    expect(anchorSpriteTexture()).not.toBe(own);
  });

  it("gives each halo its own picture and its own geometry, never three's shared sprite geometry", () => {
    const a = createGlow("#fff", 0);
    const b = createGlow("#fff", 0);
    const shared = new Sprite().geometry;
    expect(a.material.map).not.toBe(b.material.map);
    expect(a.geometry).not.toBe(b.geometry);
    expect(a.geometry).not.toBe(shared);
    expect(b.geometry).not.toBe(shared);
    expect(Object.keys(a.geometry.attributes)).toEqual(Object.keys(shared.attributes));
    for (const name of Object.keys(shared.attributes)) {
      expect(a.geometry.attributes[name]?.count).toBe(shared.attributes[name]?.count);
    }
    expect(a.geometry.index?.count).toBe(shared.index?.count);
  });

  it("two viewers: disposing everything of one is never heard by the other or by three's shared sprite geometry", () => {
    const build = (): Disposable[] => {
      const dots = [dotMaterial({}), dotMaterial({})];
      const anchors = [dotMaterial({ map: anchorSpriteTexture() }), dotMaterial({ map: anchorSpriteTexture() })];
      const glows = [createGlow("#fff", 0), createGlow("#fff", 0)];
      const materials: (PointsMaterial | SpriteMaterial)[] = [...dots, ...anchors, ...glows.map((g) => g.material)];
      const out: Disposable[] = [...glows.map((g) => g.geometry)];
      for (const material of materials) {
        out.push(material);
        if (material.map) out.push(material.map);
      }
      return out;
    };
    const a = build();
    const b = build();
    const shared = new Sprite().geometry;
    const heardB = listen([...b, shared]);
    for (const object of a) object.dispose();
    for (const [, count] of heardB) expect(count).toBe(0);
  });
});
