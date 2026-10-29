---
type: project-design
status: active
---

# Astraeus — Design

## Architecture

Astraeus is a TypeScript astronomy engine with a scientific core, a reusable asset layer, React Three Fiber presentation and a generic viewer shell. The site and demos live in separate packages. Absolute UTC feeds physical state in EQJ kilometres; scale policies, floating origin and render-axis conversion act downstream and never change scientific State. The engine imports no other workspace package. Guardrails owns the layer, naming, provenance and reuse constraints.

This overview describes current architecture. Detailed contracts and dated reconciliation records are linked below; load only the relevant sections. Planned work belongs in Objectives, verification results in Tasks and Checks, and original owner intent in Idea.

## Components/Codebase Map

| Module | Purpose |
|--------|---------|
| `packages/astraeus/` | The engine. The workspace uses its source (`exports` point at `.ts`); `tools/build-packages.mjs` compiles it to `dist/` for npm (O-036), with `x-publish` in its `package.json` describing the published `exports` and `files`: `src/core/` (scientific core: clock, frames, bodies, providers, curve-fit state; no presentation, no experience names, ARCH-01, ARCH-02), `src/assets/` (catalogue, compositions, visuals, rings, sky), `src/app/` (scene and adapter; `sceneFrame.ts` per-frame stages, `scenePointer.ts` pointer listeners, CODE-02), `src/shell/` (generic UI; `useDrawers.ts`), `src/experiences/` (shared helpers such as `settingsFields.ts`), `src/synthetic/` (made-up experiences that prove the plug-in contract), `data/` core data, `licenses/` library notices, `tools/` importers, `tests/`. Imports no other package; its `package.json` `exports` are the only doorways |
| `packages/astraeus-demo-apollo11/` | Apollo 11 demo: `src/experiences/apollo11`, data, story panels, reconstruction tool, `credits/` (CREDITS.md, APOLLO11_SOURCES.md) |
| `packages/astraeus-demo-showers/` | Perseids and Geminids demo: `src/experiences/showers`, `data/showers`, GMN stories, `tools/data/fetch-meteoroid-orbits.mjs`, `credits/` |
| `packages/astraeus-demo-planets/` | Planets demo (Mercury to Pluto, Jupiter view): `src/experiences/planets`, `jupiter-io`, planet data and stories, `credits/` |
| `packages/astraeus-site/` | Pages (`index.html`, `app.html`, `assets.html`), `src/main.tsx` demo list, `vite.config.ts`, `public/`, `site/` pictures, `tools/site` generators and credits gatherer, `tools/validate/` browser checks (`harness.mjs`, `driver.mjs`), and `tests/packageBoundaries.test.ts` |
| `packages/astraeus-data/` | npm package of the moon pictures (Io to Charon, plus Pluto), the 8k Venus map and the Milky Way, with their credits (`src/pictures.ts`, `NOTICE`); about 35.5 MB packed (the Milky Way is the 0.53 MB starless render since I-026); `dataSource` for `mount(..., { data })` |
| `packages/astraeus-data-{jupiter,saturn,uranus,neptune,mars,pluto}/` | One npm package per planet system: moon-position chunks (`data/<planet>-moons/`), a `loadIndex` and a generated `src/chunks.js` of chunk URLs (each ends `?no-inline` so Vite keeps them as files); `dataSource` for `mount` |
| `examples/hello-scene/` | The smallest consumer app: Vite plus the packed `astraeus` tarball (not a workspace link), built by `npm run build:example`; checked by the `hello-scene` browser step |
| `tools/` | Root: `check-engine-alone.mjs`; `build-packages.mjs` (compile each package to `dist/`: pictures to `new URL`, `.js` extensions, JSON default imports, chunk list), `check-packs.mjs` (`npm run check:pack`: contents, sizes, extensionless imports, `?no-inline`), `publish-packages.mjs` (release publish, dry run by default in CI manual runs), `build-example.mjs`; and `tools/lint/` (TypeScript 6 parser shim) |
| `tests/` | Each package keeps its own `tests/`; the root `vitest.config.ts` runs them all |
| `docs/` | Design notes, `BROWSER_CHECKS.md` and `docs/evidence/` (only what a record cites) |

## Interfaces and Data Flow

`Scene` is the public story-building API. `prepareScene` converts it to the existing `ExperienceDefinition` and loads its data; both `mount` and the exported React `AstraeusScene` use that path. React 19, React DOM, Fiber and Three.js are published peer dependencies. The API reference is generated from `src/api/index.ts` exports and their doc comments; missing export documentation is tested.

Host-page behaviour (O-044): `App` has an internal `writeTitle` prop (not public API) that `mount` and `AstraeusScene` set false, so the viewer never writes `document.title`; the viewer's Escape handlers yield to a `defaultPrevented` keydown; both mount routes set `isolation: isolate`. A scene with no `setTime`, timeline window or trajectory opens at the current time with a window of +/- 15 days (`spanOf` in `api/scene.ts`). On phones the story sheet forwards wheel and pinch to the scene canvas (`shell/useZoomThrough.ts`).

Answers for sites (O-045): `Scene.stateOf` answers for every body in the scene through the same state source the viewer draws (catalogue bodies and elements bodies have no data cut-off; only an `addTrajectory` path refuses a date, `bad-time`; planets need the planet series loaded, else `missing-data`). `Scene.provenanceOf` returns the position `Provenance`, which gains optional `accuracyClass` and `maxErrorFraction`; for an elements body the fraction is its class limit (0.01 or 0.05, an upper bound), and built-in Swift-Tuttle's is measured. `CameraReach` gains `fitOrbit` (a lazy farthest Sun distance); the viewer resolves it each frame with the canvas aspect (`liveReach`), so the reach and far plane follow resizing, and `SceneCamera` gains `fitOrbit` and `fitted`. A fitted scene sets no label limit (`setReach` raises the 500 default to the reach); `setReach` and `fitOrbit` share one limit and the later call wins; the opening distance is clamped to the limit like any other. `ProvenanceSourceType` gains `modelled`. Events take their own `provenance` (`ExperienceConfig.eventProvenanceById`, read before the batch `eventProvenance`), and both are validated (`bad-event`). Elements bodies get the live "Distance from Sun" metrics row because `toDefinition` passes the scene's catalogue to `bodyMetrics`. A group's card source type is always "illustrative", with the elements' type in the accuracy line.

Bodies reference catalogue definitions and state-source bindings; `StateResolver` composes their positions through the parent chain. Physical state remains independent of camera, selection, scale and rendering. Composed resolver states currently carry position only; velocity composition is a standing limitation. The Moon uses IAU rotation with libration (I-091); tidal locking remains available for other moons. Chebyshev providers load windowed planet and moon fits; validity and sampled accuracy ranges are distinct and must be checked for the chosen dataset.

Scenes expose bodies, bounded trajectories, listed-orbit groups, orbit lines, activity windows, events, story panels, timeline settings, display switches and camera choices. Scene-owned element bodies extend a per-scene catalogue. Groups share the body/path id namespace and use the existing points layer; made-up spreads and moon groups remain internal. Sun-centred tracked trajectories are rejected. See the relevant public-API amendments in reconciliation history for exact options and restrictions.

The app projects state into render coordinates and generic shell readouts. `sceneFrame.ts` runs named frame stages; `scenePointer.ts` owns pointer listeners. The frame loop keeps running for labels and interaction, while idle scenes skip GPU passes after their grace period. Developer panels and the moon-family panel load on demand with error boundaries; planet/comet tables remain synchronous by owner decision.

Apollo and Showers source imports only the public `astraeus` entry and local files; their tests may use engine internals. The site owns demo selection and the shower switch. The local Planets demo covers Mercury to Pluto; the public build offers Jupiter only. Data packages supply optional pictures and moon-position chunks; installing the engine alone gives catalogue stars without the Milky Way picture.

### Experience plug-in boundary

For the internal `ExperienceDefinition` contract read [state and assets](../docs/architecture/state-and-assets.md#experience-plug-in-boundary); public-API changes are in history under O-036, O-040, O-041 and O-042.

### Asset architecture (O-014)

[State and assets](../docs/architecture/state-and-assets.md#asset-architecture-o-014) preserves catalogue, resolver, composition, paths, scale, lighting, texture, naming and accuracy details. Consult the later O-033/O-039 and I-091 amendments for changed moon and map behavior.

#### Groups and the `points` layer (O-009)

[Group contracts](../docs/architecture/groups-and-time.md#groups-and-the-points-layer-o-009), updated by O-042 in history.

#### Time windows and rates (O-010)

[Time contracts](../docs/architecture/groups-and-time.md#time-windows-and-rates-o-010), updated by O-041/O-042 in history.

#### Spike 04 shower fixtures (O-011) and the G-004, G-005 additions (O-015, O-016)

[Demo contracts](../docs/architecture/demo-contracts.md), updated by O-041/O-042 in history.

## Boundaries

The engine exports are the package boundary; generic code takes experience content as data. Synthetic configurations prove generic capabilities. Scientific approximation and reconstruction carry provenance and known limits; an accepted sample limitation never becomes a claim of measured fidelity. Planetary Explorer (`/home/user/code/planetary-explorer`) remains a read-only donor.

Browser policy is owned by [browser policy](../docs/agents/browser-policy.md); the scenario/driver map is [BROWSER_CHECKS.md](../docs/BROWSER_CHECKS.md). Gate selection and tooling are in [project gates](../docs/agents/build.md), with ordinary commands in `.savepoint/config.yml`.

## Decisions

Detailed decisions, owner acceptances, technical limitations and deferred-note accounting are preserved verbatim in [reconciliation history](../docs/architecture/reconciliation-history.md). Read the paragraphs for the affected Objective or Issue when validating its contract. They are evidence of decisions at their recorded dates, not a second live status board. Current lifecycle status comes from Savepoint records and `savepoint resume`.

## Current Technical State

The package root export has conditions `types`, `node`, `import`: the build generates CSS-free `*.node.js` twins of every compiled file that imports a stylesheet, directly or through imports, so Node and Vitest Node consumers import without an inline setting (`npm run check:node-consumer`); JSON imports carry import attributes. The engine and data packages are built for npm; examples consume packed tarballs rather than workspace links. Apollo and Showers have been rebuilt on the public API. The API reference is generated as a static site page. Current dependency versions, gates, size limits and coverage scope come from their configuration files; historical measurements remain dated evidence in the reconciliation history and cited artifacts.

Code Health uses jscpd for duplication, lizard for complexity and Vitest v8 for coverage. `npm run test:full` refreshes coverage before an official Full Objective Check health snapshot. Maintainer import tools are excluded by owner decision; the exact scope is in `vitest.config.ts`. Scanners exclude the owner's `docs/research` and `docs/prds` notes.

For implementation lookup, use [the detailed component inventory](../docs/architecture/codebase-details.md) only for the relevant component. For historical scientific validation, provider selection, reconstruction residuals, accepted Apollo limitations, texture provenance and measurement bounds, use the matching section of the detailed contracts and its later reconciliation amendments. Preserve those qualifications when updating this overview; reconcile current facts here rather than appending another chronological progress report.
