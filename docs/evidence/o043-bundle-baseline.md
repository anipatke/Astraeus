# O-043 bundle baseline (T-178)

- Date: 2026-10-24. Commit: 17210392 (branch o043-coverage-bundle, plus the uncommitted T-178 measuring files).
- Command: `npm run measure:example` (builds the packed `examples/hello-scene` through `tools/build-example.mjs`, then counts `examples/hello-scene/dist`).
- Method: the emitted `index.html` names the entry script and stylesheet; the entry script's static imports (`import"./x.js"`, `from"./x.js"`) are followed; `import()` is on demand. Pictures and JSON are not counted. Gzip is Node `zlib.gzipSync` defaults.

## First open (hello-scene)

| File | Raw bytes | Gzip bytes | When |
|------|-----------|------------|------|
| assets/index-CblZbIQ9.js | 1,558,533 | 449,411 | first-open |
| assets/index-V3uHjv0f.css | 44,750 | 8,846 | first-open |
| assets/planetModels-BB1RwBiI.js | 329,770 | 218,255 | on-demand |
| First-open total | 1,603,283 | 458,257 | |

Also fetched on first open but not counted here (not JS/CSS): `hyg-v42-naked-eye` star JSON 284 kB, Earth 4k picture 1.56 MB, plus the Moon picture used by the scene.

## Breakdown of the first-open script by source

Method: a throwaway build with a source map, `cd examples/hello-scene && npx vite build --sourcemap --outDir <scratch>/sm --emptyOutDir` (no repository file changed), then a script in the session scratch space decoded the map's VLQ `mappings` and added each segment's generated-column span to its source file, grouped by `node_modules/<package>` (the engine's compiled files under `node_modules/astraeus/src/<folder>`). Shares are of the 1,417,223 mapped characters (the script is 1,558,533 bytes; the rest is unmapped glue and multi-byte text).

| Source | Characters | Share |
|--------|-----------|-------|
| three.js | 528,750 | 37.3% |
| react-dom | 207,333 | 14.6% |
| @react-three/fiber | 168,204 | 11.9% |
| astraeus `src/app` | 140,782 | 9.9% |
| Orb (@lizard-isana/orb) | 97,885 | 6.9% |
| astraeus `src/core` | 77,678 | 5.5% |
| unmapped glue | 67,276 | 4.7% |
| astraeus `src/shell` | 62,486 | 4.4% |
| astraeus `src/api` | 27,357 | 1.9% |
| astraeus `src/assets` | 16,867 | 1.2% |
| react, scheduler, react-use-measure, its-fine, others | about 21,000 | 1.5% |
| example's own `main.js` | 2,116 | 0.1% |

The engine is about 325,000 characters (23%); the libraries it needs are about 1,000,000 (70%).

## Candidate savings (engine parts a plain app does not need on first open)

| Part | Size (chars) | Verdict |
|------|-------------|---------|
| Developer panels: `app/DeveloperSettings` 7,485, `app/FrameRateSection` 4,035, `app/DebugOverlay` 2,506, `app/sceneDebug` 1,851 (plus `metricReadouts` 964 if only they use it) | about 16,000 (1.1%) | Small and safe in principle: `App.tsx` imports `DeveloperSettings`, which pulls the rest; load with `React.lazy`/`import()` only when the developer drawer is switched on. `SettingControls` (1,161) is also imported directly by `App.tsx`, so it stays. `DebugOverlay`, `FrameRateSection` and `sceneDebug` are also imported by `AstraeusScene`, so the split needs care (T-179 owns it). |
| Planet-system data modules: `core/bodies/outerPlanets` 4,246, `moonSystem` 4,010, `planetMoons` 3,216, `swiftTuttle` 3,237 (+180 in assets), `assets/bodies/planetSystemMaps` 2,438, `shell/MoonFamilyPanel` 2,966 | about 20,000 (1.4%) | Needs an owner decision: `api/bodies` exports every named body (Jupiter to Charon, Phobos), so loading them on demand changes how those refs resolve. |
| `core/chebyshevEphemeris` 6,074, `core/sunCentredSources` 3,544 | about 9,600 (0.7%) | Needs an owner decision; used when a planet or moon is drawn from series data, which is the engine's job. |
| three.js 528,750 (37%) | n/a | Largest share, but it comes from the consumer's dependency (`@react-three/fiber` imports the whole of three); not an engine change. Mention to the owner only. |
| Orb 97,885 (7%) | n/a | Used by `core/bodies/{earth,moon,sun}`, `astronomyAdapter`, `twoBodyAdapter`; needed for any Earth or Moon scene. A replacement is out of scope. |

Reading: the engine's own share is about 23% of the script, and the named developer-panel candidate is about 1% of it. Even all engine candidates together are under 3.5%. `planetModels` (330 kB raw, 218 kB gzip) is already loaded on demand.

## After T-179 (developer panels on demand)

- Date: 2026-10-24. Command: `npm run measure:example`.
- `App.tsx` reaches `DeveloperSettings` (with `DebugOverlay` and `FrameRateSection`) only through `app/developerPanels.tsx`, six `React.lazy` wrappers over one dynamic `import()`, inside one `Suspense`. The per-frame figures `buildDebugReadout` and its types moved to `app/debugReadout.ts` so the scene keeps collecting stats without the panel code.

| File | Raw bytes | Gzip bytes | When |
|------|-----------|------------|------|
| assets/index-Bvj3AWzI.js | 1,544,787 | 445,267 | first-open |
| assets/index-V3uHjv0f.css | 44,750 | 8,846 | first-open |
| assets/DeveloperSettings-pp231YOh.js | 14,479 | 4,589 | on-demand (new) |
| assets/planetModels-OJ4kSAlo.js | 329,775 | 218,257 | on-demand |
| First-open total | 1,589,537 | 454,113 | |

Change against baseline: first-open raw 1,603,283 to 1,589,537 (-13,746, -0.86%); gzip 458,257 to 454,113 (-4,144, -0.90%).

Not done, by owner choice (2026-10-24, "Panels only"): planet-system modules (`outerPlanets`, `moonSystem`, `planetMoons`, `swiftTuttle`, `planetSystemMaps`, `MoonFamilyPanel`), `chebyshevEphemeris`, `sunCentredSources`. three.js and Orb are consumer dependencies, out of scope.
