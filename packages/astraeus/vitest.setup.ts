import { vi } from "vitest";
import { loadPlanetSeries } from "./src/core/planetSeries";

// The pretend page (happy-dom) offers no WebGL 2, so the viewer's no-WebGL check would refuse every test that renders it: answer "yes" here; tests/noWebgl.test.ts undoes this.
vi.mock("./src/api/webglCheck", async (orig) => ({
  ...(await orig<typeof import("./src/api/webglCheck")>()),
  hasWebgl2: () => true,
}));

// The browser entry loads the planet series on demand; tests that read planet positions load them once up front.
await loadPlanetSeries();
