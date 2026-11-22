// @vitest-environment happy-dom
// O-092 T-432: a lost graphics context can come back. three's own WebGLRenderer prevents the default of `webglcontextlost` (which is what lets the browser restore the
// context) and listens for `webglcontextrestored`. The engine adds no listener of its own, so two things must stay true: the installed three still does this, and
// AstraeusScene lets react-three-fiber build that stock renderer (an options object for `gl`, never a renderer factory). The wake after a restore is pinned by the
// restore case in glowAndHooksDom.test.ts (TEST-03).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const canvas = vi.hoisted(() => ({ gl: [] as unknown[] }));
vi.mock("@react-three/fiber", async (orig) => ({
  ...(await orig<typeof import("@react-three/fiber")>()),
  Canvas: ({ gl }: { gl?: unknown }) => {
    canvas.gl.push(gl);
    return null;
  },
}));
vi.mock("../src/assets/sky", async (orig) => ({
  ...(await orig<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("./synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: { ...syntheticDefinition }, ready: Promise.resolve() }) };
});

import { AstraeusScene as HostScene } from "../src/api/AstraeusScene";
import { Scene, earth } from "astraeus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The renderer source of the installed three (resolved from the package, not a fixed path). */
function rendererSource(): string {
  // The package's exports hide package.json, so find the package folder from its entry file (`<root>/build/three.*js`).
  const root = dirname(dirname(createRequire(import.meta.url).resolve("three")));
  return readFileSync(join(root, "src/renderers/WebGLRenderer.js"), "utf8");
}

/** The body of the function a listener is registered with, up to the next top-level `function` or the end. */
function handlerBody(source: string, event: string): string {
  const name = new RegExp(`addEventListener\\(\\s*['"]${event}['"]\\s*,\\s*(\\w+)`).exec(source)?.[1];
  expect(name, `three adds no ${event} listener`).toBeDefined();
  const start = source.search(new RegExp(`function\\s+${name}\\s*\\(`));
  expect(start, `three has no handler function ${name}`).toBeGreaterThanOrEqual(0);
  return source.slice(start, start + 600);
}

describe("three's own renderer handles a lost context", () => {
  it("prevents the default of webglcontextlost and listens for webglcontextrestored", () => {
    const source = rendererSource();
    expect(handlerBody(source, "webglcontextlost")).toMatch(/\.preventDefault\(\)/);
    handlerBody(source, "webglcontextrestored");
  });
  it("fails on a copy of the source without the preventDefault call", () => {
    const broken = rendererSource().replace(/event\.preventDefault\(\);/g, "");
    expect(handlerBody(broken, "webglcontextlost")).not.toMatch(/\.preventDefault\(\)/);
  });
});

describe("AstraeusScene builds the stock renderer", () => {
  it("gives the Canvas an options object for gl, not a renderer factory", async () => {
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => {
      root.render(createElement(HostScene, { scene: new Scene().addBody(earth) }));
    });
    for (let tries = 0; tries < 100 && canvas.gl.length === 0; tries += 1)
      await act(async () => {
        await new Promise((done) => setTimeout(done, 10));
      });
    expect(canvas.gl.length, "the scene never reached its canvas").toBeGreaterThan(0);
    for (const gl of canvas.gl) {
      expect(typeof gl).toBe("object");
      expect(gl).not.toBeNull();
      expect(Object.getPrototypeOf(gl)).toBe(Object.prototype);
    }
    act(() => root.unmount());
  });
});
