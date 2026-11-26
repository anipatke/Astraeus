---
type: project-design
status: active
---

# Astraeus — Design

## Architecture

Astraeus is a TypeScript astronomy engine with a scientific core, a reusable asset layer, React Three Fiber presentation and a generic viewer shell. The site and demos live in separate packages. Absolute UTC feeds physical state in EQJ kilometres; scale policies, floating origin and render-axis conversion act downstream and never change scientific State. The engine imports no other workspace package. Guardrails owns the layer, naming, provenance and reuse constraints.

This overview describes current architecture: purpose, boundaries, who owns each lifecycle and why. Each section links to the contract that holds the detail; load only the relevant one. The full text of each heading as it stood on 2026-11-22, with the Objective, Task and Issue numbers behind it, is under [Design.md detail moved](../docs/architecture/reconciliation-history.md#designmd-detail-moved-o-090-t-438-2026-11-22) in the same heading name. [Where each fact lives](../docs/README.md) names the file that owns each value that tends to drift (versions, limits, timings, steps). Planned work belongs in Objectives, verification results in Tasks and Checks, and original owner intent in Idea.

## Components/Codebase Map

Every workspace is a folder under `packages/` (root `package.json` `workspaces`); the examples live outside the workspaces. Package names, versions and published files are in each `package.json`; which packages publish is `PACKAGES` in `tools/build-packages.mjs`.

| Module | Purpose | Contract |
|--------|---------|----------|
| `packages/astraeus/` | The engine. `src/core/` science only (clock, frames, bodies, providers, curve-fit state; ARCH-01, ARCH-02); `src/presentation/` viewer wording and choices, importing core only; `src/assets/` catalogue, compositions, visuals, rings, sky; `src/api/` the public `Scene`, mount and host link; `src/app/` scene and frame loop; `src/shell/` the viewer interface; `src/shelf/` the story-component shelf; `data/` core data; `tools/` importers; `tests/` (made-up fixtures in `tests/synthetic/`). Imports no other package; its `package.json` `exports` are the only doorways, and the workspace uses its source while `tools/build-packages.mjs` compiles `dist/` for npm | [Engine README](../packages/astraeus/README.md), the generated API page (`packages/astraeus-site/tools/site/api-reference.mjs`), [component inventory](../docs/architecture/codebase-details.md) |
| `packages/astraeus-data/` | Moon pictures, the 8k Venus map, the Milky Way (also alone as `astraeus-data/milky-way`) and the surface place lists, with their credits; a `dataSource` for `mount` | [Its README](../packages/astraeus-data/README.md) |
| `packages/astraeus-data-{jupiter,saturn,uranus,neptune,mars,pluto}/` | One package per planet system: moon-position chunks, the planet's moon list and fit errors, a `loadIndex` and generated chunk URLs; a `dataSource` for `mount` | Each package's README, e.g. [Jupiter](../packages/astraeus-data-jupiter/README.md) |
| `packages/astraeus-data-constellations/` | The 88 IAU constellations as data (figures, boundaries, names, provenance), the `constellations()` helper and `constellationFinder()`; a plain data package, not a position package | [Its README](../packages/astraeus-data-constellations/README.md), [constellations note](../docs/architecture/constellations-o067.md) |
| `packages/astraeus-demo-apollo11/`, `astraeus-demo-showers/`, `astraeus-demo-planets/` | The three demos, each on the public API: its experience code, data, stories, tools and `credits/` | [Demo contracts](../docs/architecture/demo-contracts.md), each package's `credits/` |
| `packages/astraeus-site/` | The pages, the demo list (every demo through the public `mount`), the site's own pickers, address navigation, loading cover and About content, the made-up preview scenes (`src/synthetic/`), the shelf catalogue and API page generators, and the browser checks (`tools/validate/`) | [Browser checks](../docs/BROWSER_CHECKS.md), [demo contracts](../docs/architecture/demo-contracts.md) |
| `examples/` | Consumer apps built from the packed tarballs (never workspace links) by `npm run build:example`: `hello-scene`, `hello-react` (`AstraeusScene`), `hello-planets`, `hello-sky`; the list is `EXAMPLES` in `tools/build-example.mjs`, each checked by its own `hello-*` browser step | `tools/build-example.mjs`, [hello-sky README](../examples/hello-sky/README.md), [browser checks](../docs/BROWSER_CHECKS.md) |
| `tools/` | Root build, pack, release and gate tools (build, pack and consumer checks, API surface and rules, gate times, owner preview) and `tools/lint/` | [Project gates and tooling](../docs/agents/build.md), [releasing](../docs/RELEASING.md) |
| `tests/` | Each package keeps its own `tests/`; the root `vitest.config.ts` runs them all | [Verification policy](../docs/agents/verification.md) |
| `docs/` | Guides, architecture contracts in `docs/architecture/`, agent rules in `docs/agents/`, and `docs/evidence/` (only what a record cites) | [Where each fact lives](../docs/README.md) |

## Interfaces and Data Flow

### Overview

`Scene` is the public story-building API. `prepareScene` converts it to the existing `ExperienceDefinition` and loads its data; both `mount` and the exported React `AstraeusScene` use that path. React 19, React DOM, Fiber and Three.js are published peer dependencies. The API reference is generated from `src/api/index.ts` exports and their doc comments; missing export documentation is tested.

### Scene and host-link split

`Scene` holds one internal plan per concern (paths, bodies, groups and activities, story, timeline, views, camera) and `assembleScene` joins them into the `ExperienceDefinition`; a plan never imports the `Scene`. The host link is one public `ViewerLink` split by concern (clock, views, camera, zones, selection) over a shared accessor. Parsers the API reads live in `core/`, and `tests/apiImports.test.ts` limits `api/` imports of `shell/` and `app/` to a reasoned allowlist. Outcome tests hold the scene output. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#scene-and-host-link-split).

### One handle, one lifecycle

`ViewerHandle` holds every read, setter and signal, and `viewerHandleOf(link)` is its only builder, so `mount` and `AstraeusScene` cannot drift (`tests/lifecycle.test.ts` runs one suite against both). Before `ready` or after `unmount` reads are undefined and calls throw `not-mounted`; listener registration never throws; `ready` always settles; a throwing listener does not stop the others (`api/listeners.ts`); a mounted `Scene` is frozen (`scene-mounted`). Host signals are separate parts of the link, never State (ARCH-02). [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#one-handle-one-lifecycle).

### Host calls land in order

After `ready` every host call takes effect or throws, in call order, and the last host call wins (engine README "Host calls"): a host camera request outranks a view rule's default, a host seek opens no story panel by crossing, and `setSelected` goes through the viewer's selection module. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#host-calls-land-in-order).

### Good guest

Several viewers share a page without touching it or each other: moon data in one shared append-only store per planet; pictures handed to each viewer rather than a page-wide book; Developer tools only when a host asks; every element id from `useId`; no page element looked up, keys and markers scoped to the viewer root; every style rule under `.astraeus-shell` and no page-level style; each viewer frees only the GPU objects it owns. `tests/twoViewers.test.ts`, `computedLook.test.ts` and `viewDisposal.test.ts` hold it, with the `two-viewers` browser step. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#good-guest).

### Host-page behaviour

The viewer never writes `document.title`, yields Escape to a `defaultPrevented` keydown and sets `isolation: isolate`; phone or wide is decided from the viewer's own size; every eased camera move honours reduced motion in one place (`resolveCamera`). [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#host-page-behaviour).

### Viewer interface

Everything drawn over the canvas rests on four shared rules, areas, look, bar and panels, plus one selection module; the interface reads State and never changes it (ARCH-02). The design source and contributor guide is the [viewer-interface note](../docs/architecture/viewer-interface.md) (section 9; the shelf contract in section 11), with About and the story-component shelf built on it. `tests/lookDrift.test.ts` and `interfaceLeftovers.test.ts` hold the look, and `npm run check:shelf-split` that a shelf part's JS loads only when imported. O-095: a shown label of any listed object (bodies, point groups, spacecraft, comets) is a tap target through `app/scenePicking.ts`, selecting through the one selection module, with no hit-testing of dots and no tab stop (the object list is the keyboard path); on a phone a shelf camera turn closes the open `left` occupant through the panel rule (`cameraTurned`); `ActionsControl.setEnabled` switches one actions button. O-097: panel text wraps through one shared rule in `shell/parts/parts.css` (`overflow-wrap: anywhere` and `min-width: 0` on panel children; the Close button never shrinks), and chart mark labels take further rows above the bars (`shelf/chart/markRows.ts`, the chart growing a row taller for each); the `catalogue` browser step proves both for every shelf part at both sizes. O-098: explainer paragraphs sit in one always-drawn polite live region (silent on first draw, every later change read); the readout tile's accessible line uses its shown value text and names its marks, and one hidden status region per tile, drawn by the shell through the internal `ShelfTile.live` contract field, announces value changes at most once per 2 s (`shelf/readoutTile/announce.ts`); the chart's summary names its drawn marks in value order. O-100: the chart measures its mark labels once per label text and font (no measure-place loop), its axis label is an HTML caption under the bars that wraps, and every shelf part is drawn inside `shell/PartBoundary.tsx`, which shows a short message in the part's place and reports the error to the page (`reportToPage` from `api/listeners`) instead of unmounting the viewer; the boundary takes the drawn part's id and clears its failed state when that id changes (I-208). O-101: a point group's own name sits among its dots, not at its centroid; since I-209 (0.12.1) at the members' mean direction from their centre and their mean distance, blended between fills so it glides, holding the previous direction when the mean is weak (`PointsView.placeLabel`, sums in `app/groupLabelPoint.ts`), one rule for a group's name and a host label on groups; `addGroup` takes `showLabel` (same meaning as a body's). Hosts add their own labels with `scene.addLabels` (fixed point, or on groups' dots), checked with the new code `bad-label`; they are entries of the one label layer placed by `app/hostLabels.ts`, a group a host label covers draws no name of its own, and a tap selects one group, opens a panel, or (several groups) selects an unlisted object framed by `app/GroupSetTarget.ts` that opens the host's card and hides with its groups (`ExperienceObject.partOfAll`). The `group-labels` browser step proves it on a made-up swarm scene; the points readout publishes each group's screen box. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#viewer-interface).

### Paths across the solar system

`addTrajectory` works in Earth- and Sun-centred scenes: input is EQJ about `center` (default the scene centre), a tracked line is one relative trail fixed to `lineFixedTo`, and label reach is one rule for bodies and paths. Provider paths sample their line times adaptively (`api/providerPathTimes.ts`). [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#paths-across-the-solar-system).

### Planet positions from Horizons

Every planet's series is a piecewise Chebyshev fit of its JPL Horizons system barycentre (`tools/import/planet-fits.mjs`, `data/ephemerides/planets/planets.json`), no longer VSOP87A; one binding rule adds the planet's offset from its barycentre when its moon package is loaded, so without the package the planet sits at its barycentre. Earth keeps EPV00. The measured figures are in the [planet accuracy note](../docs/architecture/planet-accuracy-o063.md) and the shared `planetEphemeris` provenance; `tests/planetAccuracyFlybys.test.ts` pins them. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#planet-positions-from-horizons).

### Journeys across years

A body's positions cover their own years: a window outside a loaded moon's years or the planet series fails once at mount with `out-of-span`. One orbit-line rule, by coverage and never by name. Pacing (`presentation/pacing.ts`) is a pure rate rule the viewer applies to the one clock, integrated over each frame; the clock holds no pacing knowledge. Host control is one seam, `app/viewerPort.ts` implemented by `api/viewerLink.ts`. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#journeys-across-years).

### Near planets and rings

A logarithmic depth buffer keeps a near planet drawn when the far plane reaches a distant path (`tests/logDepth.test.ts`); rings are catalogue data; any catalogued moon with a period gets an orbit line, one without throws `no-orbit`; a timeline event may name an object to frame. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#near-planets-and-rings).

### One path through every stretch

`lineFixedTo` takes a body, a list of stretches or `"auto"` (resolved by sphere of influence into the same list), so menu, drawing and follow share one path; crowded timeline markers gather into one numbered mark. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#one-path-through-every-stretch).

### Every listed moon addable

`addBody(id)` adds any moon in the lists through one rule (a grey sphere at its JPL mean radius, positioned by its planet's moon system, requiring that planet's data package), reading a generated slim lookup (`core/bodies/listedMoons.ts`) so the full lists stay out of the first download; the scene's own catalogue is extended, never the global one. Public `listedMoons(planet?)`. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#every-listed-moon-addable).

### Answers for sites

`Scene.stateOf` and `Scene.provenanceOf` answer for every body through the same state source the viewer draws, with coded refusals; `fitOrbit` reach follows the canvas each frame. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#answers-for-sites).

### Orbit maths (O-082)

One CPU elliptic Kepler solver, `eccentricAnomalyFromMean` (`core/keplerAnomaly.ts`), serves every caller except the bulk fill, which keeps its own Newton for speed; `tests/keplerSolver.test.ts` holds all of them to an independent bisection. An elements body's epoch is converted once. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#orbit-maths-o-082).

### Errors and labels that tell the truth (O-083)

Every throw a host reaches through the public API is a coded `SceneError`; refusals name their cause; moment text has one grammar (`core/timeInput.ts`); the scale is the closed `ScaleId`; cards name the model that places and turns each body. The codes are documented in the engine README "Errors" (generated). O-096: with no WebGL 2 the two entry points (`api/mount.ts`, `api/AstraeusScene.tsx`) refuse before the viewer renders, through one probe (`api/webglCheck.ts`): `ready` rejects with `no-webgl`, `onError` hears it, and the element holds a short message; tests answer the probe "yes" in the shared vitest setup. Shelf input is checked evenly in `shelf/part.ts` (blank text) and the chart and colour-key factories (backwards or overlapping bins, marks outside the bins at build, fractional or empty colour-key counts), all `bad-part`; `tests/shelfInputTable.test.ts` runs every shelf factory through every bad-input kind. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#errors-and-labels-that-tell-the-truth-o-083).

### Each scene keeps its own moon data (O-084)

Each `Scene` binds its catalogue to its own moon data (`core/moonData.ts`), so a scene never sees moon data another scene or the process loaded; decoded chunks are shared per data source. `tests/sceneMoonScope.test.ts` and `tests/cold/sceneMoonIsolation.test.ts` hold it. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#each-scene-keeps-its-own-moon-data-o-084).

### Units, constants and layers (O-093)

`src/core/` is science only and `src/presentation/` holds viewer wording and choices, importing core only (`tests/presentationLayer.test.ts`); made-up scenes live in `tests/synthetic/`. `core/constants.ts` is the one home of AU, J2000 and the day length, held by a lint rule; light type brands separate fit time scales and render vectors. Lint and Prettier settings are in their config files. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#units-constants-and-layers-o-093).

### A lighter frame loop (O-087)

The frame does less when nothing changed: costly canvas readouts are opt-in (`__ASTRAEUS_DIAGNOSTICS__`, set by the browser harness, never public), labels are placed from cached sizes, a paused clock does not re-render React, and lines skip work when time, scale and look are unchanged. Profiles: `docs/evidence/o087-frame-profile/`. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#a-lighter-frame-loop-o-087).

### Orbit lines stay on their body (O-099)

One rule draws every orbit line, in `app/orbitLineRule.ts` (pure, node-tested) shared by `OrbitSetView` (body sets) and `PathView` (`kind: "orbit"`): samples sit on a fixed time grid (or a fixed eccentric-anomaly grid for element-drawn and osculating lines), so a re-sample moves no point that stays; a cached fine head, also on a fixed grid, ends the line at the body's live place. A Sun-orbit line opts in through the internal `PathSpec.turn` (set only by `api/sunOrbit.ts`): its span gives the turn length, and the line is one turn about the display time, re-sampled when the display time leaves the middle half (the osculating fallback re-fitted then through `turn.reosculate`); any other fixed span keeps its own meaning. Composition moon windows sit on the same grid. Cost: one source evaluation per changed frame plus at most four head points a frame (+0.21 ms a frame for three planet lines against 0.10.0, accepted by the owner 2026-11-23). Held by `tests/orbitLineRule.test.ts`, `orbitLineGap.test.ts` (Earth, Mars, Jupiter, Moon and Io within 0.05 body radii across a turn and years away) and the full-tier browser step `orbit-lines`.

### Verification in tiers (O-086)

`npm run check:browser` runs tiers of steps; the steps, their tiers and the `--tier`, `--step`, `--skip-examples` and `--list` options are defined in `packages/astraeus-site/tools/validate/browser-steps.mjs` (`-- --list` prints them, the full tier including `two-viewers`), and which steps a Task, a Full Objective Check and a release run is [browser policy](../docs/agents/browser-policy.md). `npm test` builds and packs nothing: the real build, pack, engine size and a planted self-proof run only in `npm run check:pack`; `test:full` and `check:engine-alone` run at release and when their own triggers apply ([project gates](../docs/agents/build.md)). Browser steps read the viewer handle and wait by polling; outcome controls prove a failed step fails the run. `gateLimits.test.ts` keeps the limit tables and dated timings in the gate docs honest. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#verification-in-tiers-o-086).

### CI on every push (O-091)

Every push and pull request runs the `quality_gates` on Node 22 and 24 (`.github/workflows/ci.yml`); the release workflow (`publish.yml`) runs the release gates before publishing; actions are pinned to commit SHAs. `workflowParity.test.ts` keeps both workflows in step with `quality_gates`, `browser-steps.mjs` and [releasing](../docs/RELEASING.md). [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#ci-on-every-push-o-091).

### Size budgets are split

The engine has one limit on the plain example's first download (`packages/astraeus-site/tools/validate/engine-budget.mjs`, checked by `npm run check:pack`), and each demo page's limit in `load-budget.mjs` holds only the page's own share, so engine growth never trips a demo and demo growth never trips the engine. The published packs have their own limits (`LIMITS` in `tools/check-packs.mjs`), and packed JS ships without comments. The values and their owner-approved raises live in those files and their history. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#size-budgets-are-split).

### Views of one scene

`Scene.setViews` names views, each showing listed objects, events and panels with a camera rule; an id no view names shows in every view. Switching is presentation only, never a State or clock change (ARCH-02), through one hidden set. `shownDuring` limits an object to a span of time through the same rule (`shownAt`). The host reads and sets the view. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#views-of-one-scene).

### Views fixes for a multi-probe app

The host link grew five signals, none of them State: `ready` means usable, the page address has one door (`src/app/address.ts`), pacing follows the showing view, the host steers and reads the camera, and the host hears event zones with their cause. The engine builds in no camera behaviour; "camera to the encounter and back" is host code. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#views-fixes-for-a-multi-probe-app).

### The sky view

The camera can stand at a body's centre and look out (camera state only, ARCH-02): one direction rule, the stood-in body hidden through the one hidden set, public `SkyPose` and look-out targets checked by one rule (`api/cameraRequest.ts`), openings and menu choices. The made-up `synthetic-lookout` scene and `journey-look-out.mjs` prove it. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#the-sky-view).

### Sky figures

Figures, outlines and reference circles drawn on the sky at infinity, presentation only: `scene.addSkyFigures` (checked at the call, stars resolved at build), drawn by `SkyFiguresView` on the last pass, with switches, looks, labels in the one label layer, tracing (`handle.traceSkyFigure`, `clearSkyTrace`), hidden-until-traced figures, selection and cards, and fade-in. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#sky-figures).

### Sky stories

Story steps (panels without a time, Back and Next) and panel actions (`camera`, `select`, `trace`, applied whoever opens the panel), with host calls `handle.panel`, `setPanel` and `onPanel`; a look-out direction may name a figure. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#sky-stories).

### Constellations

The 88 IAU constellations are data in the optional `astraeus-data-constellations`, never in the engine (ARCH-01). Sources, licences and import choices are in the [constellations note](../docs/architecture/constellations-o067.md); the package README documents the helper. `examples/hello-sky` proves a plain app needs only `mount`, the helper and story steps. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#constellations).

### Core layers and demos

Bodies reference catalogue definitions and state-source bindings; `StateResolver` composes their positions through the parent chain. Physical state remains independent of camera, selection, scale and rendering. Composed resolver states currently carry position only; velocity composition is a standing limitation. The Moon uses IAU rotation with libration (I-091); tidal locking remains available for other moons. Chebyshev providers load windowed planet and moon fits; validity and sampled accuracy ranges are distinct and must be checked for the chosen dataset.

Scenes expose bodies, bounded trajectories, listed-orbit groups, orbit lines, activity windows, events, story panels, timeline settings, display switches and camera choices. Scene-owned element bodies extend a per-scene catalogue. Groups share the body/path id namespace and use the existing points layer; made-up spreads and moon groups remain internal. See the relevant public-API amendments in reconciliation history for exact options and restrictions.

The app projects state into render coordinates and generic shell readouts. `sceneFrame.ts` runs named frame stages; `scenePointer.ts` owns pointer listeners. The frame loop keeps running for labels and interaction, while idle scenes skip GPU passes after their grace period. Developer panels (only with the `developerTools` option) and the moon-family panel load on demand with error boundaries; planet/comet tables remain synchronous by owner decision.

Apollo, Showers, the Planets demo and the site import only the public `astraeus` entry, the data packages and local files (source on the front door since O-059; the Planets demo and the site count 0 deep imports, Apollo and Showers keep deep imports only in tests and tools); tests may use engine internals; `planetViews.test.ts` and the site's `syntheticScenes.test.ts` use public reads since O-057 T-274. The site owns demo selection, the shower switch, the pickers, address navigation and the loading cover. The local Planets demo covers Mercury to Pluto; the public build offers Jupiter only. Data packages supply optional pictures and moon-position chunks; installing the engine alone gives catalogue stars without the Milky Way picture.

### Headless use and looks as settings

`scene.load({ data })` and `scene.check({ data })` serve Node apps; the scene reads come from the plans (`api/sceneReads.ts`); looks are one table (`app/look.ts`) with precedence address, then `setLook`, then the Developer drawer's saved value, then the default; event zones are independent of pacing. The time look, moment-panel closing, the phone sheet cap, camera choices and switch labels follow the same pattern. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#headless-use-and-looks-as-settings).

### The planets demo and the site on the public way

The demos and the site use only the public API, so the engine gained general parts (`addBodySet`, `setMoonPanel`, `addPlaces`, `setPicker`, `onFirstDraw` and others) and holds no demo data: places lists are in `astraeus-data`, moon lists in the planet packages. The site's pickers, cover and address changes are site code over `mount`. [The dated note](../docs/architecture/o059-public-forms.md) keeps the form decisions. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#the-planets-demo-and-the-site-on-the-public-way).

### Experience plug-in boundary

For the internal `ExperienceDefinition` contract read [state and assets](../docs/architecture/state-and-assets.md#experience-plug-in-boundary); public-API changes are in history under O-036, O-040, O-041 and O-042.

### Asset architecture (O-014)

[State and assets](../docs/architecture/state-and-assets.md#asset-architecture-o-014) preserves catalogue, resolver, composition, paths, scale, lighting, texture, naming and accuracy details. Consult the later O-033/O-039 and I-091 amendments for changed moon and map behavior.

#### Groups and the `points` layer (O-009)

[Group contracts](../docs/architecture/groups-and-time.md#groups-and-the-points-layer-o-009), updated by O-042 in history.

#### Time windows and rates (O-010)

[Time contracts](../docs/architecture/groups-and-time.md#time-windows-and-rates-o-010), updated by O-041/O-042 in history.

Timeline opening and edges, and whole-millisecond times (O-073): [detail](../docs/architecture/reconciliation-history.md#time-windows-and-rates-o-010-o-073-additions).

#### Spike 04 shower fixtures (O-011) and the G-004, G-005 additions (O-015, O-016)

[Demo contracts](../docs/architecture/demo-contracts.md), updated by O-041/O-042 in history.

## Boundaries

The engine exports are the package boundary; generic code takes experience content as data. Synthetic configurations prove generic capabilities. Scientific approximation and reconstruction carry provenance and known limits; an accepted sample limitation never becomes a claim of measured fidelity. Planetary Explorer (`/home/user/code/planetary-explorer`) remains a read-only donor.

The mechanised body-name check (`packages/astraeus/tests/nameCheck.test.ts`) covers `src/core`, `src/assets`, `src/shell`, generic `src/app` and, since T-194, the public `src/api/` (guardrail ARCH-06): a public default or rule names a body only through an allowlist entry with a reason.

Browser policy is owned by [browser policy](../docs/agents/browser-policy.md); the scenario/driver map is [BROWSER_CHECKS.md](../docs/BROWSER_CHECKS.md). Gate selection and tooling are in [project gates](../docs/agents/build.md), with ordinary commands in `.savepoint/config.yml`.

## Decisions

### Public API shape (G-016, owner 2026-11-01)

The owner's principles for the public API, from the [api review](../docs/architecture/api-review-2026-11-01.md). Durable rules with IDs are in Guardrails (API-01 to API-07); these are how the API is shaped. Where today's code differs, G-016's Objectives (O-053, O-058, O-054, O-055, O-056, O-059, O-057, in that order) bring it in line and this section is reconciled as they land.

- **What the product is (D1).** A scene builder, a full viewer (`mount` and `AstraeusScene`) and numbers without a viewer (`stateOf`, `provenanceOf` after one public load). No viewer-free entry point and no public 3D parts until a real user needs them.
- **Verb grammar.** `add*` appends and a repeated id throws `duplicate-id`; `set*` replaces the whole setting; `on*` subscribes and returns a stop function; reads are plain properties.
- **Lifecycle.** Build faults throw at `mount`; load faults reject `ready`; `ready` always settles (usable or rejected, never left pending); after `unmount` handle calls throw `not-mounted` and callbacks stop (listener registration never throws); a listener that throws does not stop the others (`api/listeners.ts`); a mounted `Scene` is frozen and later edits throw `scene-mounted`. Built in O-054; React and plain apps get the same `ViewerHandle`.
- **The engine signals, the host decides.** The engine reports what changed and offers setters but builds in no app behaviour; each signal stands alone, never only as a side effect of another feature (event zones independent of pacing, D4).
- **Numbers work without a viewer.** A Node or server app awaits one public call and can then ask about any body, moons included.
- **Use the front door ourselves.** In-repo demos and the site use only the public API; existing deep imports sit on a per-package allowlist that may only shrink, and G-016 empties it: the planets demo and the site moved onto the public API in O-059 (D6 brought forward by the owner); every demo's and the site's `src` is on the front door; the Planets demo and the site count 0 deep imports (tests and tools included), while Apollo (129) and Showers (65) keep only tests and tools that reach engine internals.
- **Compatibility.** Renames in 0.8.0 are a clean break with no aliases, listed in one CHANGELOG migration table (D2 revised by the owner: only two outside apps exist, so break and rework them now); `toDefinition` is removed in 0.8.0 with public replacements (D10), and `src/api/definitionOf.ts` is the one internal route to a scene's assembly; groups must state their `plane` (D3); several viewers per page are supported (D9); the Developer drawer is hidden unless a host asks (D8); the React peer covers all of React 19 (D7).
- **Names and shapes as built (O-057).** Spans bind inputs only; every renamed input is one row of `RENAMED_INPUTS`; `api/definitionOf.ts` is the one route to a scene's assembly. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#public-api-shape-names-and-shapes-as-built-o-057).

#### O-053 checks (Guardrails API-01 to API-07)

These tests and scripts hold the rules above; each fails on a new break, and each allowlist may only shrink. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#o-053-checks-guardrails-api-01-to-api-07).

- **Public surface lock (API-01).** `tools/api-surface.mjs` writes `packages/astraeus/api-surface.lock.json`; `apiSurface.test.ts` fails when the tree differs, `releaseBreaks.test.ts` requires each breaking difference to be named, and `packageBoundaries.test.ts` counts deep imports, which only go down.
- **Shape, errors, settings and isolation (API-03 to API-06).** `tools/api-rules.mjs` with `tests/apiRules.test.ts` and four allowlists; the README error table is generated (`npm run api:errors`).
- **Honest versions and docs (API-07, T-230).** `check:pack` checks peer ranges; `check:react-consumer` and `check:three-newest` prove the React and three peers; `apiRules.test.ts` checks the README API tables.
- **Owner decisions on C-137 (owner, 2026-11-01).** (O1) The React check tests the newest React it can install. (O2) The O-053 allowlists can only shrink (`allowlistGrowth.test.ts`); a deliberate addition carries an owner `approved` field.
- **Allowlist growth counted per finding (owner, 2026-11-01, "Count per finding, not per name").** `tests/allowlistGrowth.test.ts` judges growth per group, so a re-key inside a group passes.

Drift accounting for O-053 (T-228 to T-230), O-054 (T-231 to T-238), O-056 (T-259 to T-263), O-059 (T-265 to T-272) and O-057 (T-274 to T-279) moved verbatim to [reconciliation history](../docs/architecture/reconciliation-history.md#g-016-drift-accounting-moved-from-designmd-2026-11-12) (2026-11-12).

Detailed decisions, owner acceptances, technical limitations and deferred-note accounting are preserved verbatim in [reconciliation history](../docs/architecture/reconciliation-history.md). Read the paragraphs for the affected Objective or Issue when validating its contract. They are evidence of decisions at their recorded dates, not a second live status board. Current lifecycle status comes from Savepoint records and `savepoint resume`.

## Current Technical State

The package root export has conditions `types`, `node`, `import`: the build generates CSS-free `*.node.js` twins of every compiled file that imports a stylesheet, directly or through imports, so Node and Vitest Node consumers import without an inline setting (`npm run check:node-consumer`); JSON imports carry import attributes. The engine and data packages are built for npm; examples consume packed tarballs rather than workspace links. Apollo, Showers, the Planets demo and the site have been rebuilt on the public API (O-059; every `src` on the front door). The API reference is generated as a static site page. Current dependency versions, gates, size limits and coverage scope come from their configuration files; historical measurements remain dated evidence in the reconciliation history and cited artifacts.

Gate times and limits: `tools/gate-limits.json` is the one file stating every gate's and every browser step's limit; a run over a limit prints a warning and never fails on time alone. Measured times are dated runs: the latest browser timing is in [browser checks](../docs/BROWSER_CHECKS.md#measured-time), the ordinary gates in [`docs/evidence/test-cost/report.md`](../docs/evidence/test-cost/report.md), and the gate commands in [project gates](../docs/agents/build.md). Earlier gate timings are [history](../docs/architecture/reconciliation-history.md#current-technical-state-gate-times-and-tests).

Tests check what they claim (O-085): the default suites hold no wall-clock assertion, Vitest's timeout is one constant (`vitest.config.ts`), and tolerances are stated in the tests that hold them. [Detail as built, 2026-11-22](../docs/architecture/reconciliation-history.md#current-technical-state-gate-times-and-tests).

Code Health uses jscpd for duplication, lizard for complexity and Vitest v8 for coverage. `npm run test:full` refreshes coverage at release or on the owner's ask (O-094); a Full Objective Check's health snapshot may report coverage as stale, which never blocks a Check. Maintainer import tools are excluded by owner decision; the exact scope is in `vitest.config.ts`. Scanners exclude the owner's `docs/research` and `docs/prds` notes.

For implementation lookup, use [the detailed component inventory](../docs/architecture/codebase-details.md) only for the relevant component. For historical scientific validation, provider selection, reconstruction residuals, accepted Apollo limitations, texture provenance and measurement bounds, use the matching section of the detailed contracts and its later reconciliation amendments. Preserve those qualifications when updating this overview; reconcile current facts here rather than appending another chronological progress report.
