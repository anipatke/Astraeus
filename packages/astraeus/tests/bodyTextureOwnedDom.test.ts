// @vitest-environment happy-dom
// useBodyTexture (O-092 T-428): the loader keeps one decoded picture per URL for the page, but each use draws its own clone and disposes only
// that clone; a picture that failed to load is cleared from the loader cache at unmount so the next mount tries again.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Texture } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loader = vi.hoisted(() => ({ cache: new Map<string, unknown>(), clear: vi.fn() }));
vi.mock("@react-three/fiber", () => {
  const useLoader = (_loader: unknown, url: string) => loader.cache.get(url);
  useLoader.clear = loader.clear;
  return {
    useLoader,
    useThree: (select: (state: unknown) => unknown) => select({ gl: { capabilities: { getMaxAnisotropy: () => 4 } } }),
  };
});

import { useBodyTexture } from "../src/app/useBodyTexture";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  loader.cache.clear();
  loader.clear.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const loaded = (): Texture => {
  const texture = new Texture({ width: 2, height: 2 } as unknown as HTMLImageElement);
  texture.needsUpdate = true; // the loader's own upload flag; the clone starts at version 0
  return texture;
};
const heard = (texture: Texture) => {
  const count = { n: 0 };
  texture.addEventListener("dispose", () => (count.n += 1));
  return count;
};

describe("body pictures", () => {
  it("gives each use its own uploadable clone and disposes only that clone at unmount", () => {
    const original = loaded();
    loader.cache.set("a.jpg", original);
    const originalHeard = heard(original);
    const got: (Texture | null)[] = [null, null];
    const Use = (props: { slot: number }) => {
      got[props.slot] = useBodyTexture("a.jpg");
      return null;
    };
    const second = document.createElement("div");
    const secondRoot = createRoot(second);
    act(() => {
      root.render(createElement(Use, { slot: 0 }));
      secondRoot.render(createElement(Use, { slot: 1 }));
    });
    const [one, two] = got;
    expect(one).not.toBeNull();
    expect(two).not.toBeNull();
    expect(one).not.toBe(two);
    expect(one).not.toBe(original);
    expect(one!.version).toBeGreaterThan(0);
    expect(two!.version).toBeGreaterThan(0);
    const oneHeard = heard(one!);
    const twoHeard = heard(two!);
    act(() => root.render(null));
    expect(oneHeard.n).toBe(1);
    expect(twoHeard.n).toBe(0);
    expect(originalHeard.n).toBe(0);
    expect(loader.clear).not.toHaveBeenCalled();
    act(() => secondRoot.unmount());
  });

  it("clears a failed load from the loader cache at unmount, and never while mounted or for a loaded one", () => {
    loader.cache.set("missing.jpg", new Texture());
    loader.cache.set("ok.jpg", loaded());
    const Use = (props: { url: string }) => {
      useBodyTexture(props.url);
      return null;
    };
    act(() => root.render(createElement(Use, { url: "missing.jpg" })));
    expect(loader.clear).not.toHaveBeenCalled();
    act(() => root.render(null));
    expect(loader.clear).toHaveBeenCalledTimes(1);
    expect(loader.clear.mock.calls[0]?.[1]).toBe("missing.jpg");
    loader.clear.mockClear();
    act(() => root.render(createElement(Use, { url: "ok.jpg" })));
    act(() => root.render(null));
    expect(loader.clear).not.toHaveBeenCalled();
  });
});
