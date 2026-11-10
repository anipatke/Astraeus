---
id: T-306
title: Trace Orion in three story steps in a new example
objective: O-067
status: in_progress
stage: audit
depends_on: [{task: T-305, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-306, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:40:31Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Trace Orion in three story steps in a new example

## Outcome

A new example in `examples/` uses the packed engine and constellations package on the plain `mount` path to look out from Earth and tell Orion's story in three steps (turn, select, trace), checked by a browser step; Design and docs are reconciled for the Full Objective Check; the owner looks at it.

## User Check

Open the example on `localhost:5490` (or the command the evidence names), step through the three Orion steps with Back and Next, tap Orion's name to see its card, try phone and desktop sizes.

## Done When

- `examples/<name>/` (planner suggests `hello-sky`) built like `examples/hello-planets` from the packed tarballs (`tools/build-example.mjs`), importing only `astraeus`, `astraeus/style.css` and `astraeus-data-constellations`: Earth and the Sun, opening looking out from Earth toward Orion, Orion (and perhaps its neighbours) from the helper, hidden until traced, three steps with short made-for-example text and provenance (no myths needed), the ecliptic switch available.
- A browser step beside `check-hello-planets.mjs` (shared driver, no screenshots) checks: the three steps, the trace line set appearing and clearing, Orion selectable with its card, no collisions at 375x667 and 1280x720; added to `run-browser.mjs`, `docs/BROWSER_CHECKS.md` and `tools/gate-limits.json` with a measured time (an owner decision if it pushes the whole browser run over its 320 s limit).
- The example's first download measured; stated in its README.
- Design.md: the constellations package in the Components/Codebase Map and a short "Constellations" paragraph (data, helper, licences, example); every drift note of this Objective's steps accounted for in this Task's Drift Notes. CHANGELOG notes the new package.
- The owner's look recorded (`owner_validation`).

## Context Files

`examples/hello-planets/package.json`, `examples/hello-planets/src/main.ts`, `examples/hello-planets/index.html`, `tools/build-example.mjs`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/check-hello-planets.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `tools/gate-limits.json`, `docs/agents/browser-policy.md`, `packages/astraeus-data-constellations/README.md`, `.savepoint/Design.md` under `Components/Codebase Map` and `Interfaces and Data Flow`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; Sky stories, O-066; the hello-planets example, O-056).

## Guardrails

API-01, API-07, ARCH-01, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm the package and helper landed; return REPLAN REQUIRED if not.
2. Scaffold the example from hello-planets; write the Orion story.
3. Add the browser step; run it focused; measure.
4. Reconcile Design and docs.
5. Leave owner validation pending for the coordinator to arrange the look.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue or an owner-directed change); no Zodiac app; no site page.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack`; the focused browser step only; `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built at `stage: build`, left at `stage: audit`, owner validation pending (User Check). Gates after the last change: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (247 files, 3658 passed, 2 skipped) and `npm run check:pack` (constellations 0.07 MB packed, 10 files) all pass; the focused browser step passed three times (script 6.1 to 6.3 s, desktop and phone, no console errors); `npm run check:browser` not run (Full Objective Check only). The `hello-sky` step was run directly on a scratch preview port 5604 (never 5490), server stopped afterwards.

- Example `examples/hello-sky` (package.json, index.html, src/main.js, README.md, .gitignore): imports only `astraeus`, `astraeus/style.css` and `astraeus-data-constellations`; Earth and the Sun, looks out from Earth toward Orion (RA 83.7, Dec 0, field 60); Orion from `constellations(["Ori"], { shown: "whenTraced" })`, five neighbours (Tau, Gem, CMa, Lep, Mon) faint; three steps "The hunter" (turn, Orion hidden), "Belt and sword" and "Betelgeuse and Rigel" (turn, select, trace, 2 s, stay); ecliptic switch in the panel; illustrative provenance; the viewer handle is on `window.viewer`. `tools/build-example.mjs` now packs per-example packages (`EXTRA_PACKAGES`: hello-sky adds the constellations package); the runner knows `hello-sky` (port base + 3).
- Browser step `packages/astraeus-site/tools/validate/check-hello-sky.mjs`, added to `run-browser.mjs`, `docs/BROWSER_CHECKS.md` (list entry and limits table) and `tools/gate-limits.json` (`hello-sky` 15 s, measured 6 s; total limit 320 s untouched, the run was about 230 s, so about +7 s). Driver: `exampleCamera` and `waitForExampleCamera` (read `window.viewer.camera`; the Developer drawer's view line needs `address: true`, which a plain example should not set). Checks: three steps with Back/Next state, camera readings, Orion hidden at step 1, `sky-trace:Ori` and `sky-selected:Ori` line sets, trace cleared on leaving, card (open already on desktop; information button on phone), ecliptic switch, no label/card/panel overlap and button reach at 375x667 and 1280x720.
- First download measured (headless, page requests at 1280x720): 4.85 MB raw, about 3.26 MB with text compressed (the Sun and Earth JPEGs are 2.4 MB of it); stated in `examples/hello-sky/README.md`.
- Package change found by that measure: `constellations()` loaded the 149 kB outline file on every call; it now loads it only when `outlines` is true (`packages/astraeus-data-constellations/src/index.ts`; the existing all-88-with-outlines test still passes).
- Design.md: constellations package and `examples/hello-sky` rows in the Codebase Map, and a "Constellations" paragraph (sources, import, shapes, helper, Node limit, example). `docs/NPM_PACKAGING.md` size table row and position-package note; `docs/agents/build.md` example list; `packages/astraeus/CHANGELOG.md` notes the example and the outline-loading change.

Extra reads (logged): `tools/build-packages.mjs` head and `tools/check-packs.mjs` limits, to place the package in the build; `.savepoint/Design.md` Sky stories paragraph and the Codebase Map, to place the new text; `packages/astraeus/src/api/viewerLink.ts` (`CameraPose`), to read the camera without the Developer drawer; `packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, as the worked story example.

Limitations: the story texts' astronomy is general knowledge written for the example (illustrative provenance), not checked against a source. How it looks (label placement, trace, text fit) is for the owner. On a phone the story panel covers part of the lower sky (the step's own layout).

## Drift Notes

Account for every drift note of this Objective's steps (Design reconciled here, as the deferred notes named this Task):

- T-303 build-step note (import drops zero-length and repeated steps; xi UMa HIP 55203 a position end; Serpens two boundary figures; J2000 boundaries generated from the B1875 corners): reflected in Design.md "Constellations" (2); the Serpens two-figure choice shows in the helper's ids, so it is in (4) as well.
- T-304 new package and data shapes: Design.md Codebase Map row and "Constellations" (1) and (3).
- T-304 position-package split (`isPositionPackage`, own limits): Codebase Map row; `docs/NPM_PACKAGING.md` size section updated here (it had been deferred).
- T-304 import tool lives in the package, outside sources (Internet Archive, CfA): non-architectural beyond the Codebase Map row and Design "Constellations" (2); recorded as such.
- T-304 boundary points 9900 vs 12948 (distance cross-check, not count): Design "Constellations" (2), the cross-check by distance to the outline.
- T-305 helper returns `SkyFigureInput[]` through public types only: Design "Constellations" (4).
- T-305 Node cannot read the star list (I-167): Design "Constellations" (4) as a stated limit; the issue is I-167 (owner's), not fixed here.
- New in T-306: the example's first download measured; the outlines load only on request (package change); examples can install extra packages (`build-example.mjs`); the viewer handle on `window.viewer` is how the browser check reads the camera (Design map row). All reflected in Design.md.

Coordinator, 2026-11-10: story text corrected before the owner's look: Betelgeuse is a red supergiant, not a red giant (examples/hello-sky/src/main.js).
