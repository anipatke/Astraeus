---
id: T-297
title: Trace a figure line by line when the app asks
objective: O-065
status: done
depends_on: [{task: T-296, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-297, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Trace a figure line by line when the app asks

## Outcome

An app, through `mount` or `AstraeusScene`, asks the viewer to trace a sky figure line by line over a given time, then to keep it, fade it or clear it; reduced motion draws it at once.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- One handle call on both paths (planner suggests `handle.traceSkyFigure(id, { seconds?, after?: "stay" | "fade" | "clear" })`; final name follows the verb grammar table) draws the figure's segments in order, each growing from its first end, across `seconds` (a default and a checked range); `after` decides what follows; traced lines use the traced colour, faded lines the faded colour (previous step's looks).
- Unknown figure, bad seconds or bad `after` throw at the call (`unknown-sky-figure` or the matching bad-input code, API-05); calling again restarts; tracing a figure whose switch is off or that a view hides is defined and tested (planner default: it traces but stays hidden until shown).
- `prefers-reduced-motion: reduce` draws the whole figure at once and still applies `after`.
- Host calls land in order with the other host calls (O-061 rule); the trace runs on wall time, not the scene clock, so pause and rate do not change it (stated in the README).
- Trace progress is a named frame stage with a node test (CODE-02); `tests/lifecycle.test.ts` runs the call on both paths (API-02); made-up figures only (ARCH-03).
- API lock, README and CHANGELOG updated (API-01, API-07).

## Context Files

`packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (One handle, one lifecycle, O-054; Host calls land in order, O-061; Scene and host-link split, O-058).

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-02, ARCH-03, CODE-02, TEST-01, TEST-03, STYLE-02.

## Implementation Plan

1. Confirm the previous steps' figure drawing and colour looks exist; return REPLAN REQUIRED if not.
2. Add a per-figure trace state (start time, length, after) held in the sky drawing, advanced by a frame stage.
3. Add the handle call on the host link, its checks and its slot in the ordered host calls.
4. Reduced motion; tests; lock, README, CHANGELOG.

## Boundaries

No clock-timed traces (owner decision 1); no camera turn to the figure (O-066 stories); no clicking.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion (all gates run from the repo root, no browser run):

1. One handle call on both paths, draws segments in order, each growing from its first end, over the duration, `after` follows, traced and faded colours from the looks: `handle.traceSkyFigure(id, { durationSeconds?, after? })`. `viewerHandleOf` carries it, so `mount` and `AstraeusScene` share it. Pure timing in `src/core/skyTrace.ts` (`stepTrace`); the host link checks in `src/api/skyTraceInput.ts` and `ViewerLink.traceSkyFigure`; the viewer control `ViewerControl.traceSkyFigure` (App pushes onto `controls.skyTraces`); drawing in `SkyFiguresView.startTrace` / `advanceTraces` (a separate overlay `sky-trace:<id>` per traced figure on TRACK_LAYER, the figure itself untouched; partial last segment). Tests: `tests/skyTrace.test.ts` (segment order and the part-grown last segment against `eqjToRenderVector`, traced colour, fade to removal, stay, clear).
2. Errors at the call: `unknown-sky-figure` (id not in `skyFigures`), `bad-sky-trace` (options not an object, unknown option, `durationSeconds` not a number in 0.1 to 60, `after` not stay/fade/clear). Calling again restarts (tested). Switch off: the overlay follows the figure's kind switch, so it runs unseen and shows when switched on (tested). Table cases in `tests/skyTrace.test.ts`; both paths in `tests/viewerHostDom.test.ts`.
3. Reduced motion: `prefersReducedMotion()` is read when the call is made; the whole figure shows at once, holds for `durationSeconds`, then `after` applies (a fade ends at once). Tested with `matchMedia` stubbed.
4. Order with other host calls: the request is queued in call order and the frame stage takes the whole queue before moving any trace, so a `setSwitch` or `setLook` made before it is already in force. Wall time: the stage advances by the frame's real `delta`; the scene clock is never read (tested with a spy). README states it.
5. Named frame stage `advanceSkyTraces` (stage 4c in `runFrame`, after `placeSkyFigures`) with node tests in `tests/skyTrace.test.ts` (CODE-02), including waking the draw rule (`state.wakes`) while a trace moves and not once a `stay` trace is complete. `tests/lifecycle.test.ts` CALLS table gained `traceSkyFigure` (not-mounted before ready and after unmount on both paths); `tests/viewerHostDom.test.ts` runs the checks on both paths (API-02). Made-up figures only (ARCH-03).
6. API lock regenerated (`npm run api:lock`), README rows and error table (`npm run api:errors`), CHANGELOG Unreleased entry (API-01, API-05, API-07). No allowlist or budget limit changed or grew.

Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 241 files, 3533 passed, 2 skipped, 0 failed; `npm run check:pack` pass; `npm run check:node-consumer` pass. Extra reads: `src/app/sceneFrame.ts` draw rule (`readDrawInputs`, `controlsChanged`, why: a queue push does not change a control by identity, so the stage wakes the draw itself), `src/api/viewerLooks.ts` and `src/api/errors.ts` (pattern for a host call and codes), `tools/api-rules.mjs` (why: public-type lint wants a unit suffix; `seconds` renamed `durationSeconds` rather than adding an allowlist entry), `tests/helpers/viewerPresentation.ts` and three host-link test fakes (new required control member).

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- Public option is `durationSeconds`, not the suggested `seconds`: the API-04 unit lint refuses a bare `seconds`; renaming avoided an allowlist entry. Design.md to say so at reconciliation.
- New codes `unknown-sky-figure` and `bad-sky-trace`; new contract: `ViewerControl.traceSkyFigure(id, seconds, after)`, `SceneControls.skyTraces` (a queue the host link fills and the frame empties), `SkyTraceRequest` and `prefersReducedMotion` in `src/app/skyFigures.ts`, `SkyFiguresView.startTrace` / `advanceTraces`, frame stage `advanceSkyTraces` (4c). Pure timing and limits live in `src/core/skyTrace.ts` (so `src/api` imports only core; no apiImports entry).
- Semantics chosen where the Task was open (owner may overrule): a trace is an overlay drawn over the figure, so `clear` and a finished `fade` return the figure to its ordinary look (or to nothing if its switch is off); `stay` holds the traced lines until the figure is traced again (there is no separate clear-trace call); `fade` eases traced to faded colour and opacity to zero over one second (`TRACE_FADE_SECONDS`) and removes them; default 2 s, range 0.1 to 60 s.
- Trace time is the frame's r3f `delta` (real time; a throttled background tab gives large deltas, so a trace finishes sooner there). Not looked at in a browser (no browser runs).
- Reduced motion is read when the call is made, not live.
