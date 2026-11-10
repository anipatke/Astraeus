---
id: T-298
title: Show sky figures on a made-up scene and write them up
objective: O-065
status: done
depends_on: [{task: T-297, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-298, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Show sky figures on a made-up scene and write them up

## Outcome

The site's made-up look-out scene shows two invented figures, a boundary outline, the ecliptic and the equator, with a way to trace a figure, so the owner can judge the look on `localhost:5490`; a browser script checks it; Design is reconciled for the Full Objective Check.

## User Check

On `localhost:5490`, open the made-up look-out scene: switch figures, boundaries, the ecliptic and the equator on and off; trace a figure and see it stay, fade and clear; check lines draw over the Sun's glow and labels never overlap, on a phone-sized window and a desktop one; change colours and the label font and size in the Developer drawer.

## Done When

- `syntheticLookOutScene.ts` (site code, public API only) gains invented figures (no real constellation names, ARCH-01) built from real star ids and positions, one boundary, and switches placed for the visitor; a site control (outside the engine) triggers a trace.
- A browser step (extend `journey-look-out.mjs` or add one beside it, using the shared driver) checks the switches, a trace reaching its end state, lines present over the Sun's glow, and no label collisions at 375x667 and 1280x720; it runs inside `npm run check:browser`.
- Design.md is reconciled from every drift note of this Objective's steps (each reflected or marked non-architectural with a reason), with the sky-figure contract added beside "The sky view".
- The owner's look is recorded (`owner_validation`).

## Context Files

`packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/journey-look-out.mjs`, `docs/agents/browser-policy.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the sky view, O-064; The planets demo and the site on the public way, O-059).

## Guardrails

ARCH-01, ARCH-03, API-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm steps 1 to 4 landed; return REPLAN REQUIRED if not.
2. Extend the made-up scene and its site control.
3. Extend the browser step; run it focused, then hand off without a full browser run.
4. Reconcile Design from the drift notes.
5. Ask the owner to look on `localhost:5490`; record the result.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue); no constellation data; no story steps.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the focused browser step only (one browser job at a time); `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-11-10 by the builder (Task Check waived; coordinator marks done after the owner's look). Extra reads (not in Context Files): the four earlier Tasks' evidence and Drift Notes (to reconcile Design); `packages/astraeus-site/tools/validate/driver.mjs` display-switch and host sections, `harness.mjs`, `run-browser.mjs`, `runner.mjs` (to extend the shared driver and run one step); `docs/BROWSER_CHECKS.md`, `docs/DONOR_PROVENANCE.md` (HYG paragraph; docs describing replaced behaviour); `packages/astraeus/src/api/sceneReads.ts`, `src/app/SceneLabels.ts`, `SkyFiguresView.ts`, `sceneFrame.ts` (read shapes, label ids, the `data-sky-lines` readout).

Per Done-When:
1. `syntheticLookOutScene.ts`: `LOOKOUT_SKY_FIGURES` (public API only): Lantern (four segments of real Hipparcos numbers 92855, 93085, 93683, 94141, 92041; one segment crosses the Sun's glow near RA 281.6, Dec -23), Kettle (star numbers 90496, 89931, 88635, 90185 and one `{ raDeg: 268, decDeg: -40 }` end), and the invented boundary "Lantern field" around the Sun's place; switches placed: `skyFigures` in the top bar, `skyBoundaries` (on at start), `ecliptic`, `celestialEquator` in the switch panel. No real constellation name (ARCH-01). Site control: `src/skyTraceControl.ts` (one small "Trace" button that opens a figure choice and Stay / Fade / Clear buttons, a 2 s trace; appended to the page body because the viewer clears its host when it renders), wired by `main.tsx` (`Built.hostControl`; `synthetic-lookout` also sets `exposeHost`).
2. Browser step: `journey-look-out.mjs` (helpers `checkSkySwitches`, `checkSkyTrace`) plus new shared-driver functions (`skyLinesShown`, `waitForSkyLines`, `skyTraceOptions`, `setSkyTraceOpen`, `pressSkyTrace`, `skyTraceStatus`, `waitForSkyTraceStatus`, `skyTraceFit`, `overlappingSceneLabels`). Focused run only (scratch dev server on 5199, stopped; evidence in the session scratchpad, not docs/evidence): final run ok at 1280x720 and 375x667 (switches in the places named, each toggle draws and removes its set, labels lantern, kettle and lantern-field show with no overlaps, the control offers the two figures, is inside the window and clear of the bar, timeline and cog, buttons 44 px or more on the phone, each of stay, fade, clear reaches its end status). Earlier failed runs, each a different cause and each fixed: control not in the page (viewer cleared the host), control covering the switch panel (moved right), then still overlapping the open phone switch panel (made a collapsed single button). The step stays inside `npm run check:browser` (name `look-out`, description updated); no full `check:browser` run.
3. Design.md: new "Sky figures" paragraph beside "The sky view"; drift accounting below. `docs/DONOR_PROVENANCE.md` star file description updated (five columns, 338 KB); `docs/BROWSER_CHECKS.md` look-out entry extended.
4. Owner's look: pending on `localhost:5490`.

Gates (repo root): `npm run lint` pass (after splitting the script's long function, complexity); `npm run typecheck` pass; `npm run build` pass; `npm test` 241 files, 3533 passed, 2 skipped.

Not verified: the visual look (line weight and colour over the Sun's glow, trace drawing, fade); the engine's drawn trace end state is not machine-read (the engine reports none and this Task may not change it): the browser step asserts the site control's own wall-time status after the call (the call itself throws on a bad id or option, and a thrown call would show as a page error), so "stay/fade/clear really looks right" is the owner's look. Not run: `check:browser` in full, `check:pack`.

## Drift Notes

Design reconciliation (the Design "Sky figures" paragraph, items in brackets):
- T-294 star file five columns, 338 KB, limit 345 KB, internal `starIdsOf`: reflected (1).
- T-295 `unknown-star` thrown at build: reflected (2). New contract `ExperienceDefinition.skyFigures`, `SceneRuntime.skyFigures`, `SceneControls.skyLines`, `ViewerControl.skyFigures`, `api` importing `app/skyFigures` with an allowlist reason: reflected (2). Drawing as a sibling view on `TRACK_LAYER`, built for every scene, hidden-sky does not hide it: reflected (3). Sky labels as entries of one `SceneLabelLayer`, `labels` switch does not hide them: reflected (5). Four display switches, defaults, no drawer button: reflected (4). Ecliptic from the engine's one matrix: reflected (3). Colours in one place: reflected (6). Migration-table test compares unions in a fixed order: non-architectural (test machinery, no contract). `unitless` allowlist entry for `star`: non-architectural (an owner-approved lint entry, recorded in the allowlist itself).
- T-296 one `skyLines.label` colour: reflected (6). New fields `SceneControls.skyColours`, `labelStyle`, shell `labelStyle` prop, `SkyLabelSpec`/`SkyFigureLayer` fields, group named `sky-lines` and `sky-figures:<id>`: reflected (2), (6). Value checks in `core/lookValues.ts` because `api` may import only core: reflected (6). `traced` and `faded` colours used by tracing: reflected (6), (7). Drawer font field uncontrolled; `--label-size` after live `setLook` untested in a rendered DOM: non-architectural (drawer detail and test coverage gap, no contract). Raised API page gzip limit to 44 KB: non-architectural (an owner-approved budget, recorded in `load-budget.mjs`).
- T-297 `durationSeconds` not `seconds`: reflected (7). New codes and contract (`ViewerControl.traceSkyFigure`, `SceneControls.skyTraces`, `SkyTraceRequest`, `prefersReducedMotion`, `SkyFiguresView.startTrace/advanceTraces`, stage `advanceSkyTraces`, `core/skyTrace.ts`): reflected (7). Overlay semantics (clear, fade, stay) and 1 s fade, default 2 s, range: reflected (7). Real-time `delta`, throttled tab ends sooner: reflected (7) as real time (the throttled-tab effect is non-architectural). Reduced motion read at the call: reflected (7).
- T-298 new site drift: the trace control is appended to `document.body` (the viewer clears its host element on render), and the dev page exposes the handle for `synthetic-lookout` as for the views scene; the engine reports no trace state, so the drawn trace end is not machine-checked. Reflected in Design (8).

Owner look 2026-11-10 (first look, coordinator session): owner did not see a difference between stay and fade, because the figure is always drawn under the trace highlight. Owner chose "yes, figure hidden until traced". Change routed back to build in this Task (Objective Decisions record it): a per-figure option to start hidden, revealed by a trace.

## Technical Evidence: hidden until traced (second build, 2026-11-10)

Owner's change "figure hidden until traced" built in this Task. Extra reads: `SkyFiguresView.ts`, `SceneLabels.ts`, `sceneFrame.ts`, `skyFigures.ts`, `planSkyFigures.ts`, `skyFigureInput.ts`, `tests/skyTrace.test.ts`, `tests/skyFigures.test.ts` (the code the option changes); T-297 trace state reused, no second mechanism.

- Option: `SkyFigureInput.shown?: "always" | "whenTraced"` (default "always"); other values throw `bad-sky-figure` at the call. Plain word, no unit, so no API-04 allowlist entry (lint passes).
- Engine: `SkyFigureLayer.whenTraced`; `SkyFiguresView` builds no base lines for such a figure (its `sky-trace:<id>` overlay is the whole drawing); `labelOpacity(id)` is 0 without a trace, 1 while it runs or stays, `1 - fade` while fading; `SkyLabelFrame.opacity` carries it into the one `SceneLabelLayer` (drawn only above 0, CSS opacity set, kind switch and collision rule unchanged). Always-shown figures unchanged. Reads unchanged, so both embedding paths need no change.
- Tests: `skyTrace.test.ts` (hidden before trace, revealed during, stay, fade with label dimming, clear, retrace from nothing, reduced motion, switch off), `skyFigures.test.ts` (bad `shown` values, layer carry-over, label opacity in the layer). `npm test` 241 files, 3544 passed, 2 skipped.
- Docs: README (addSkyFigures, traceSkyFigure), CHANGELOG, `api-surface.lock.json` regenerated, Design.md Sky figures (2) and new (9).
- Site: Lantern and Kettle `shown: "whenTraced"`; `journey-look-out.mjs` now checks only the outline shows at start, then per figure and per stay/fade/clear: lines and label appear on trace, stay holds (and the figures switch hides and returns them), fade and clear leave nothing, no label overlaps. New driver helpers `chooseSkyTraceFigure`, `waitForSceneLabel`.
- Gates: `npm run lint`, `typecheck`, `build`, `test`, `check:pack`, `check:node-consumer` pass. Focused `journey-look-out` on scratch port 5199 (stopped): ok first run at 1280x720 and 375x667.
- Not verified: the look itself (traced lines stay in the traced colour, not the figure colour; fade timing); owner validation pending. `check:browser` in full not run.

- T-298 hide request: `clearSkyTrace`, `SkyClearRequest` on the one queue, `SkyFiguresView.clearTrace`, `stepHide`, `after` without `clear`: reflected in Design (7).

Owner look 2026-11-10 (second look, coordinator session): owner asked what `clear` does (draws, then vanishes at once). Owner chose "Add a hide request": drop `clear` from `after`, add a host request that removes a figure's trace at any time, faded or at once (Objective Decisions record it). Routed back to build in this Task.

## Technical Evidence: hide request (third build, 2026-11-10)

Owner's "Add a hide request" built in this Task (Objective Decisions record it). Extra reads: `tests/verbGrammar.test.ts` (no verb rule beyond add/set/on), T-297 evidence, `viewerLink.ts`, `viewerHandle.ts`, `viewerPort.ts`, `App.tsx` host wiring, README API tables and generated error table.

- Names: `handle.clearSkyTrace(id, { durationSeconds? })`, pairing with `traceSkyFigure` (a trace is cleared); no verb-grammar rule covers it and the lint needs no allowlist entry (the unit is in `durationSeconds`, API-04). `after` is `"stay"` | `"fade"`; `"clear"` throws `bad-sky-trace`.
- Behaviour: `durationSeconds` 0 to 60, default 1 (the fade time), 0 at once; a running trace keeps the share drawn so far and eases out (a fade in progress continues from its fade). `whenTraced` figure: lines and label go; always-shown: only the trace highlight goes. No trace: no-op; unknown id `unknown-sky-figure`; bad options `bad-sky-trace`; reduced motion removes at once; a later trace starts from nothing. One mechanism: the clear request is pushed on the same `SceneControls.skyTraces` queue (call order), taken by `advanceSkyTraces`, applied by `SkyFiguresView.clearTrace` to the same overlay as a hide run (`stepHide` in `core/skyTrace.ts`); label opacity follows the same `fade`. Both embedding paths through `viewerLink`/`viewerHandle`/`App`.
- Tests: `skyTrace.test.ts` (`stepHide`, `checkedClear`, link, clear mid-trace, after stay, during fade, at once vs faded, reduced motion, no-op, unknown id, call order, label dimming; `after: "clear"` refused), `viewerHostDom.test.ts` (both paths, errors, not-mounted), `lifecycle.test.ts`. Docs: README (row, mount handle list, regenerated error table), CHANGELOG, `api-surface.lock.json` regenerated, Design.md Sky figures (7).
- Site: `skyTraceControl.ts` buttons Stay, Fade, Hide (Hide calls `clearSkyTrace`; status hiding then hidden); `journey-look-out.mjs` runs stay, fade, then stay plus Hide per figure; driver comments updated.
- Gates: lint, typecheck, build, `npm test` (241 files, 3562 passed, 2 skipped), `check:pack`, `check:node-consumer` pass. Focused `journey-look-out` on scratch port 5199 (stopped): ok at 1280x720 and 375x667, first run. API page gzip limit (44,000) not touched.
- Not verified: the look (hide fade timing, label dimming). `check:browser` in full not run. Owner validation pending.

Owner validation 2026-11-10 (coordinator session o065-run-20261110): after the hidden-until-traced change the owner said "looks ok" on localhost:5490, and chose "Go once tests pass" for the Hide change (tick done once its gates pass, without a further look). The Hide change's gates passed (npm test 3562 passed, 2 skipped; lint, typecheck, build, check:pack, check:node-consumer; focused journey-look-out ok at both sizes). Coordinator marks T-298 done under the standing run rules.
