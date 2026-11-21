import { loadPlanetSeries } from "./src/core/planetSeries";

// The browser entry loads the planet series on demand; tests that read planet positions load them once up front.
await loadPlanetSeries();
