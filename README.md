# Astraeus

> **Space, time, and trajectories for Three.js**

Astraeus is a lightweight, framework-independent TypeScript/Three.js engine for interactive astronomy storytelling. It handles astronomical time, orbital trajectories, body orientation, dual-scale projection, and floating origins so developers can build scientifically grounded, explorable space experiences without rebuilding the hard orbital mechanics and graphics plumbing every time.

Astraeus is **reusable browser infrastructure for turning astronomical state into interactive space stories — not the story itself.**

---

## Guiding Principle

> *"Be reliable where the data exists, plausible where it doesn't, and explicit about the difference."*

There will always be a gap between scientific fact and engaging web storytelling. Creative liberties, reconstructions, and numerical approximations are allowed, but they are carried as **explicit metadata and provenance**, never hidden behind visual illusions.

---

## Why Astraeus?

Building interactive 3D space experiences in WebGL and Three.js presents fundamental engineering challenges that general-purpose 3D engines do not solve out of the box:

1. **32-Bit Floating-Point Jitter at Astronomical Scale**  
   The Earth–Moon distance is ~384,400 km, while a spacecraft is meters wide. At interplanetary coordinates, GPU single-precision Float32 coordinates cause catastrophic vertex jitter. Astraeus isolates calculations in a Float64 scientific core and applies a **floating origin** that rebases the camera frame before narrowing coordinates to GPU Float32.

2. **True Scale vs. Visual Legibility**  
   In true physical scale, planetary bodies become tiny, unreadable specks separated by immense voids. Astraeus introduces interchangeable **Scale Policies** (`TrueScale` vs. `ReadableScale`). Distance compression is applied downstream during coordinate mapping without ever mutating or distorting underlying scientific state.

3. **Strict Scientific Decoupling**  
   Unlike typical 3D demos where camera interaction, mesh spin, or visual hacks mutate world objects, Astraeus enforces a unidirectional, immutable pipeline:
   ```text
   Absolute UTC Time → Trajectory / Ephemeris → State (EQJ km) → ScalePolicy → Floating Origin → Render Axes → Three.js
   ```

4. **First-Class Provenance & Uncertainty**  
   Public space datasets (such as NASA mission archives) are often sparse anchor tables rather than continuous, second-by-second telemetry files. Rather than pretending synthetic interpolation is measured truth, Astraeus embeds provenance, interpolation method, and known residuals into trajectory contracts.

---

## Core Pipeline Architecture

```text
               +--------------------------------------+
               |      SimulationClock (UTC ms)       |
               +--------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                   State / Trajectory Providers                     |
|  - MoonTrajectory (Analytical ephemeris via Orb Meeus series)      |
|  - SampledTrajectory (Cubic Hermite interpolation with bounds)    |
|  - Earth / Sun orientation (IAU precession, nutation, GMST82)     |
+--------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|               Scientific State (Immutable, EQJ Frame)               |
|  - Position (km, Float64Array)     - Centers (earth, sun, moon)    |
|  - Velocity (km/s, Float64Array)   - Orientation (Hamilton Quat)   |
|  - Physical body -> Sun vectors    - Provenance metadata           |
+--------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                            ScalePolicy                             |
|  - TrueScalePolicy: 1:1 physical ratio (normalised to Earth radii) |
|  - ReadableScalePolicy: 10x distance compression, true radii ratio |
+--------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                          Floating Origin                           |
|  - Float64 subtraction: scaledAbsolute - scaledCameraOrigin        |
|  - Automatic threshold rebasing (prevents GPU Float32 jitter)      |
+--------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                      Render-Axis Conversion                        |
|  - Proper rotation: EQJ (x, y, z) -> Three.js (x, z, -y)           |
+--------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|             Three.js / React Three Fiber Scene & HUD               |
|  - Tracked bodies, open orbit paths, and NASA source anchors       |
|  - Independent per-body physical Sun lighting and terminators      |
|  - Camera controller: Overview, Focus, Follow                      |
|  - Mission timeline, event jumps, and provenance HUD               |
+--------------------------------------------------------------------+
```

---

## Proven Spikes & Demonstrations

Astraeus has been developed and validated through rigorous architectural spikes:

### Spike 01 — Earth–Moon Scientific Foundation
- **Analytical Ephemeris:** Implemented via `@lizard-isana/orb` (truncated Meeus lunar series, IAU 2006 precession, IAU 2000B nutation, GMST82, and EPV00 Earth/Sun coordinates).
- **Benchmarked Accuracy:** Validated against JPL Horizons DE441 geometric vectors:
  - Lunar geocentric angular error: **≤ 0.071 arcmin** (measured 2024-01-22).
  - Lunar range error: **≤ 6.385 km** (measured 2025-06-01).
  - Sun position error: **≈ 0.0001 arcmin** (0.008 arcsec) and **≤ 1.373 km**.
- **Physical Illumination:** Body-to-Sun vectors calculated in true physical space before scale mapping, providing accurate lunar phases verified against USNO phase tables (2024–2026).
- **Full Design Note:** [`docs/ASTRAEUS_SPIKE_01.md`](docs/ASTRAEUS_SPIKE_01.md) and [`docs/ASTRONOMY_VALIDATION.md`](docs/ASTRONOMY_VALIDATION.md).

### Spike 02 — Apollo 11 Mission Reconstruction
- **NASA Historical Data:** Educational trajectory reconstruction synthesized from authoritative postflight records in the *Apollo 11 Mission Report* (MSC-00171 / SP-238).
- **Dual Vehicle Tracking:** Simultaneous tracking of **Columbia (CSM)** and **Eagle (LM)** across translunar injection, lunar orbit insertion, powered descent, lunar stay, ascent, rendezvous, trans-Earth injection, and entry interface.
- **Physics Integration:** Offline RK4 numerical integration (Earth point-mass + J2 gravitational harmonic + Moon and Sun third-body perturbations) blended across 40 authoritative NASA anchor states.
- **Generic Core Contract:** The spacecraft trajectory adheres to the identical `Trajectory → State` interface as the Moon. The scientific core contains zero mission-specific keywords.
- **Full Design Note:** [`docs/ASTRAEUS_SPIKE_02.md`](docs/ASTRAEUS_SPIKE_02.md) and [`docs/APOLLO11_RECONSTRUCTION.md`](docs/APOLLO11_RECONSTRUCTION.md).

### Spike 03 — Reusable Astronomy UI Shell *(In Progress)*
- Extracting a clean, modular astronomy UI shell around the canvas:
  - Time controls (play, pause, rate scaling from 1× to 10,000×, event seeking).
  - Chronological mission event timeline.
  - Camera modes (System Overview, Body Focus, Vehicle Follow).
  - Real-time scale toggle (`ReadableScale` ↔ `TrueScale`).
  - Transparent provenance, coordinate readouts, and uncertainty disclosures.

---

## Quickstart

### Prerequisites
- Node.js 18+ (tested with modern Node and npm)

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/Astraeus.git
cd Astraeus

# Install dependencies
npm install

# Start local development server (Vite)
npm run dev
```

Visit `http://localhost:5173` to launch the interactive viewer.

### Testing & Verification
Astraeus enforces strict offline verification with 127 automated tests:
```bash
# Run Vitest test suite
npm test

# Run TypeScript typecheck without emit
npm run typecheck

# Build production bundle
npm run build

# Re-run offline Apollo 11 numerical reconstruction pipeline
npm run apollo11:reconstruct
```

---

## Developer Experience & API Concepts

### The Core Contract: `Trajectory` and `State`
Every body in Astraeus — whether a planet, moon, or spacecraft — is queried through the generic `Trajectory` interface:

```typescript
import type { BodyId, CenterId } from "./core/body";
import type { State } from "./core/state";

export interface Trajectory {
  readonly body: BodyId;
  readonly bounds?: { readonly startUtcMs: number; readonly endUtcMs: number };
  stateAt(timeUtcMs: number, center?: CenterId): State;
}
```

### Instantiating State & Trajectories
```typescript
import { createOrbAstronomyAdapter } from "./core/astronomyAdapter";
import { MoonTrajectory } from "./core/moonTrajectory";
import { SampledTrajectory } from "./core/sampledTrajectory";
import { SimulationClock } from "./core/clock";
import { readableScale, trueScale } from "./core/scalePolicy";

// 1. Initialise simulation clock with integer UTC Unix milliseconds
const clock = new SimulationClock(Date.parse("1969-07-20T20:17:40Z"));
clock.setRate(100); // 100x playback speed

// 2. Ephemeris adapter and trajectory
const adapter = createOrbAstronomyAdapter();
const moonTrajectory = new MoonTrajectory(adapter);

// Query Moon state relative to Earth
const moonState = moonTrajectory.stateAt(clock.timeUtcMs, "earth");
console.log(moonState.positionKm); // Float64Array [x, y, z] in EQJ frame

// 3. Project to rendering coordinates
const scaledPos = readableScale.mapPosition(moonState.positionKm);
```

### Piecewise Spacecraft Trajectories with `SampledTrajectory`
```typescript
import { SampledTrajectory } from "./core/sampledTrajectory";

const eagle = new SampledTrajectory({
  body: "eagle",
  center: "earth",
  samples: [
    { timeUtcMs: 14552880000, positionKm: [x0, y0, z0], velocityKmS: [vx0, vy0, vz0] },
    { timeUtcMs: 14552940000, positionKm: [x1, y1, z1], velocityKmS: [vx1, vy1, vz1] },
  ],
  provenance: {
    sourceType: "reconstructed",
    sources: ["NASA MSC-00171 Table 7-II"],
    accuracy: "NASA anchor cubic Hermite fit",
    notes: "Spacecraft velocities in Earth-centred EQJ",
  },
});

// Cubic Hermite interpolation with bounds enforcement:
const stateAtTouchdown = eagle.stateAt(Date.parse("1969-07-20T20:17:40Z"));
```

---

## Codebase Map

| Directory / File | Responsibility |
|---|---|
| [`src/core/`](src/core/) | **Framework-independent scientific core**. State vectors, UTC clock, orientation quaternions, reference centers, scale policies, illumination math, generic trajectories, and provenance. Zero Three.js or React imports. |
| [`src/core/astronomyAdapter.ts`](src/core/astronomyAdapter.ts) | The isolated boundary importing `@lizard-isana/orb` and converting coordinates to Astraeus Float64 EQJ kilometres. |
| [`src/app/`](src/app/) | **Rendering & presentation layer**. Float64 floating origin, EQJ-to-render axis conversions, React Three Fiber scene, shaders, camera controller, and HUD overlays. |
| [`src/mission/`](src/mission/) | Mission configurations and data wiring (e.g. Apollo 11 tracked bodies, events, and notes). |
| [`data/apollo11/`](data/apollo11/) | Archival NASA raw anchor JSON files and generated sample sets. |
| [`tools/apollo11/`](tools/apollo11/) | Deterministic offline reconstruction pipeline (`npm run apollo11:reconstruct`). |
| [`tools/validate/`](tools/validate/) | Headless browser validation scripts and independent coordinate conversion audits. |
| [`tests/`](tests/) | Unit and integration test suites (ephemeris precision, floating origin, controls, and reconstruction). |
| [`docs/`](docs/) | Deep-dive design notes, mathematical proofs, and source citations. |

---

## Documentation & Research Notes

For detailed documentation, mathematical derivations, and validation proofs:

- [**Spike 01 Design Note**](docs/ASTRAEUS_SPIKE_01.md): Earth–Moon architecture, scale conventions, and floating-origin design.
- [**Spike 02 Design Note**](docs/ASTRAEUS_SPIKE_02.md): Apollo 11 reconstruction methodology, anchor residuals, and frame conversions.
- [**Astronomy Validation Report**](docs/ASTRONOMY_VALIDATION.md): Provider comparisons, SOFA verification, and JPL Horizons DE441 residual tables.
- [**Apollo 11 Sources & Citations**](docs/APOLLO11_SOURCES.md): Archival NASA document references, coordinate systems, and conversion limits.
- [**Apollo 11 Reconstruction Audit**](docs/APOLLO11_RECONSTRUCTION.md): Generated anchor residuals, burn cutoff fits, and smoothing metrics.
- [**Donor Provenance & Licensing**](docs/DONOR_PROVENANCE.md): Texture source attribution, shader donor provenance, and usage boundaries.

---

## License & Provenance Notice

- Core Astraeus code is private / project-owned.
- Third-party library notices (including SGP4 and Orb) are preserved in [`licenses/`](licenses/).
- Textures (Earth and Moon) are adapted for local research and educational exploration; see [`docs/DONOR_PROVENANCE.md`](docs/DONOR_PROVENANCE.md) for texture attribution notes before any redistribution.
