---
id: T-279
objective: O-057
title: Move Swift-Tuttle into the showers demo
status: done
depends_on: [{task: T-278, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-279, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-07T00:48:32Z'}
---

# Move Swift-Tuttle into the showers demo

## Outcome

The engine catalogue holds only the Sun, planets, dwarf planets and moons, and the showers demo adds the comet itself.

## User Check

`addBody("swift-tuttle")` fails in a test, and the Perseids demo still shows the comet.

## Done When

The elements, provenance and Horizons fixtures leave the engine for the showers package; the demo adds the comet through `addBodyFromElements` with its marker look; a test proves positions match the old built-in ones across 1990 to 2030, and the Horizons comparison still passes; a catalogue kind test fails on any comet, probe or story body; engine tests that used the comet as a sample use a made-up one; panel and `parentBodyId` links still resolve; the lock is regenerated if it changes.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/core/bodies/swiftTuttle.ts`, `packages/astraeus/src/assets/bodies/swiftTuttle.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerScene.ts`, `packages/astraeus-demo-showers/tests/swiftTuttle.test.ts`, `packages/astraeus-demo-showers/data/showers/perseids.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02.

## Implementation Plan

1. Capture the old positions as a fixture. 2. Write the elements record and add it in the demo. 3. Remove the body from the catalogue and add the kind test. 4. Move the fixtures and engine tests.

## Boundaries

If `addBodyFromElements` cannot match the old positions or look, stop with REPLAN REQUIRED; do not add a special case to the engine. No deep-import count may rise.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, reason): `packages/astraeus/src/core/elementsBody.ts` (what `addBodyFromElements` writes, to build a faithful record); `packages/astraeus/src/api/sunOrbit.ts` (its `BUILT_IN_SAMPLING` lookup was the only reader of the comet's sampling); `packages/astraeus-demo-showers/src/experiences/showers/showerSettings.ts` and `showerScene.ts` (the existing `parentElements` path the Geminids use); `packages/astraeus-site/tests/packageBoundaries.test.ts` (`DEEP_IMPORT_COUNTS`).

How the old positions were captured: a throwaway vitest file called `Scene.stateOf("swift-tuttle", t)` on the engine before the body was removed and wrote `tests/fixtures/swift-tuttle-builtin-positions.json` (285 dates: every 60 days 1990-01-01 to 2030-01-01, plus every 2 days within 40 days of the 1992-12-12 perihelion; position, velocity (null: none), marker look, `provenanceOf`, radius, label, validity). The throwaway file was deleted. 38 KB.

Result: the largest position difference between the old built-in body and `addBodyFromElements(perseids.parentElements)` over all 285 dates is 0 km (identical floats, because the record goes through the same two-body code). Tolerance asserted: under 1e-3 km (1 metre) absolute and 1e-12 relative at every date; chosen as below the float noise of a 45 AU vector, so it can only fail on a real change and was not loosened. `stateOf` velocity is `undefined` at every date (as before). Marker colour `#9fe3ff`, 7 px, kind marker, radius 13 km, label, validity window 1990 to 2030 all equal the old.

Wording differences that the generic path imposes (not special-cased, recorded in `rebuildComparison.test.ts` `sameProvenance`): position `accuracy` now reads "approximate: <old statement> Compared with JPL Horizons, target DES=109P;CAP (solution JPL#32), centre 500@10, ICRF."; the sources list is the record citation (with URL) and the Sun's gravity line, the Horizons line moved into the statement; the first known limit is the generic one (JD and time scale in place of "1995-10-10", and no "(comet outgassing)"), followed by the record's own limits (old limit 1 split in two); `maxErrorFraction` is the class limit 0.01 (was the measured 0.00857). The measured 0.00857 and 10,686,093 km stay in the statement and are asserted against the Horizons fixture.

`addBody("swift-tuttle")` fails with `unknown-body` (no `renamed` row: the body is gone, not renamed; there is nothing for the receiving call to name).

Removed from the engine: `core/bodies/swiftTuttle.ts`, `assets/bodies/swiftTuttle.ts`, their entries in `core/bodies/index.ts` and `assets/catalogue.ts`, and `BUILT_IN_SAMPLING` (it held only the comet; `sunOrbit.ts` now draws a whole orbit from the record's sampling alone). The comet's name now appears nowhere in `packages/astraeus/src` (asserted). Doc comments on `stateOf`, `camera.fitOrbit` and the README rows were reworded; CHANGELOG Unreleased entry added; `package-lock.json` did not change.

Done When -> test:

| Done When | Test (file : case) |
|---|---|
| Elements, provenance and Horizons fixtures leave the engine for the showers package | `packages/astraeus-demo-showers/tests/swiftTuttle.test.ts` : "finds the comet's name nowhere in the engine's source: it is the demo's data, not the catalogue's"; "carries every element exactly as the archived response prints it"; the Horizons fixtures were already under `packages/astraeus-demo-showers/tests/fixtures/` |
| The demo adds the comet through `addBodyFromElements` with its marker look | `swiftTuttle.test.ts` : "is built from the Perseids file's record with a Sun parent, no orientation, no gravitational parameter, a source and a marker visual with no texture, and is not in the built-in catalogue"; `showers.test.ts` : "gives Perseids its comet from the file's elements, in the scene's own catalogue, and leaves the built-in one alone"; "is given by exactly one of a catalogued id or its published elements" |
| Positions match the old built-in ones across 1990 to 2030 | `swiftTuttle.test.ts` : "gives the old built-in positions within 1 metre at every sample..."; "covers 1990 to 2030 and the 1992 perihelion densely"; "keeps velocity unmodelled, the marker look, the radius, the label and the accuracy class of the old built-in" |
| The Horizons comparison still passes | `swiftTuttle.test.ts` : "is checked at eight dates from 1990 to 2030..."; "has a maximum Sun-centred error equal to the figure the definition records..."; "has a largest fractional error equal to the recorded one..."; `showersYearHorizons.test.ts` : "Swift-Tuttle: largest difference 7,644,938 km (0.13%) at 2019-09-21..." |
| A catalogue kind test fails on any comet, probe or story body | `packages/astraeus/tests/assets.test.ts` : "has no body that is not the Sun, a planet, a dwarf planet or a moon"; "fails on a planted comet, probe or story body (planted-case proof)" |
| Engine tests that used the comet as a sample use a made-up one | `bodyMarkers.test.ts` : "size the stand-in dot..." and "draws the comet on the overlay layer..."; `fitOrbit.test.ts` : "takes a body reference or an id, and a long-period comet added from elements"; `publicApiSunOrbits.test.ts` : "draws its whole orbit from periapsis, and the line closes" and "gives the card a live Distance from Sun readout..."; `stateOfBodies.test.ts` : "answers for the Earth, and for a long-period comet..." and "carries the class and fraction for elements bodies..."; `sunLook.test.ts` : "follows the policy, and leaves a plain marker..."; `publicApiAutoStretches.test.ts` : "records which built-in bodies have no GM"; `assets.test.ts`, `planets.test.ts`, `stateResolver.test.ts` id lists; `scenePin.json` hand-edited (ids and the unknown-body message only) |
| `addBody("swift-tuttle")` fails | `publicApiSunOrbits.test.ts` : the case containing `new Scene().addBody("swift-tuttle" as never)` expecting `unknown-body` (next to the made-up-comet check) |
| Panel and `parentBodyId` links still resolve | `showers.test.ts` : "accepts the Perseids file and reads the look from it" (parent id `swift-tuttle`); `rebuildComparison.test.ts` perseids cases (same bodies, orbit lines, distance rows, panels); `packages/astraeus-site/tests/storyPanels.test.ts` and `demoScenes.test.ts` (perseids lists `swift-tuttle`) |
| The lock is regenerated if it changes | `package-lock.json` unchanged; not regenerated |

Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 229 files, 3145 passed, 2 skipped; `check:engine-alone` pass; `check:pack` pass (engine unpacked 9.14 MB, limit 9.5); `check:node-consumer` pass; `check:react-consumer` pass. No browser run. `DEEP_IMPORT_COUNTS` for `astraeus-demo-showers` lowered 68 to 65 (the test requires counts to go down); Planets and Site unchanged (0).

Limitations: browser look of the Perseids scene and the site's list not checked (no browser run, by instruction); the position equality is proved at the state level, not by pixels. The demo test `swiftTuttle.test.ts` still deep-imports engine internals as the rest of that package's tests do (65 left).

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- Design/README drift for the last step (T-280 or the Objective's integration Task): `Design.md` and any ARCH-01 note that lists Swift-Tuttle as a built-in body or `BUILT_IN_SAMPLING` should now say the catalogue holds only the Sun, planets, Pluto and moons, and the comet is the Showers demo's data. Not edited here (outside the Task's Context Files).
- `ElementsBodyRecord` cannot carry a second source line or the exact measured `maxErrorFraction`; the Horizons target and the 0.00857 live in the accuracy statement. The `SWIFT_TUTTLE_MAX_ERROR_KM` and `_FRACTION` constants live in `packages/astraeus-demo-showers/tests/helpers/swiftTuttle.ts` and are asserted against the Horizons fixture.
