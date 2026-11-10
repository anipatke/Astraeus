---
id: T-298
title: Show sky figures on a made-up scene and write them up
objective: O-065
status: in_progress
stage: audit
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
