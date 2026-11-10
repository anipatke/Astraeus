---
id: T-302
title: Show a three-step sky story on a made-up scene and write it up
objective: O-066
status: done
depends_on: [{task: T-301, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-302, reason: 'Owner said "orchestrate O66" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o066-run-20261110}, recorded_at: '2026-11-10T06:15:12Z'}
planned_by: {role: planner, session: o066-planning-20261110}
---

# Show a three-step sky story on a made-up scene and write it up

## Outcome

The site's made-up look-out scene tells a three-step story about its invented figures (turn, select, trace, card), with clickable figures, so the owner can judge it on `localhost:5490`; a browser script checks it; Design is reconciled for the Full Objective Check.

## User Check

On `localhost:5490`, open the made-up look-out scene: tap a figure's name and a line to see its card; tap inside the outline and see nothing selected; step through the three-step story with Back and Next and see the view turn, the figure selected and traced, and the trace cleared on leaving; try it at phone size and desktop size.

## Done When

- `syntheticLookOutScene.ts` (site code, public API only) gives Lantern and Kettle cards (made-up facts, illustrative provenance, ARCH-01) and adds three story steps that turn the view, select and trace; at least one step starts from an orbit view to prove the camera target works from any view.
- The look-out browser step (shared driver; one browser job at a time) checks: name tap and line tap select the figure and open its card; an outline tap selects nothing; Back/Next move between steps; a step's camera reading, selection and trace line set match; leaving clears the trace; no collisions at 375x667 and 1280x720. It stays within its 50 s limit or the evidence states the measured time for the owner.
- Design.md reconciled from every drift note of this Objective's steps (each reflected or marked non-architectural with a reason), extending the "Sky figures" paragraph and the story description.
- The owner's look is recorded (`owner_validation`).

## Context Files

`packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, `packages/astraeus-site/src/skyTraceControl.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/journey-look-out.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; the sky view, O-064).

## Guardrails

ARCH-01, ARCH-03, API-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm steps 1 to 3 landed; return REPLAN REQUIRED if not.
2. Extend the made-up scene with cards and three steps.
3. Extend the browser step; run it focused; hand off without a full browser run.
4. Reconcile Design from the drift notes.
5. Leave owner validation pending for the coordinator to arrange the look.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue or an owner-directed change); no constellation data; no Orion example (O-067).

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the focused browser step only; `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the builder session (2026-11-10). Extra reads beyond Context Files: T-299..T-301 evidence and drift notes (brief); `packages/astraeus/src/api/cameraRequest.ts`, `src/api/story.ts`, `src/shell/AstraeusShell.tsx` (pickObject, selectRequest), `src/shell/style.css` (story panel rules), `src/shell/StoryPanelView.tsx`, `tools/validate/driver-guard.mjs` (the guard failed my first direct `page.locator` use), `tools/validate/harness.mjs`; reasons: action shapes, why a phone step's card covers the story buttons, panel geometry, the driver rule.

- Scene: `syntheticLookOutScene.ts` gives Lantern and Kettle cards (description, two made-up facts, illustrative provenance, a source) and `LOOKOUT_STORY`: three steps (hold the opening view; turn to Lantern at 40 degrees, select, trace; turn to Kettle likewise). Every camera names `earth`, so a step turns the view from an orbit view too (the browser step presses Focus on Earth first and Next must bring the sky view back). Site trace control kept working; it now sits at the right foot above the timeline on desktop (it overlapped the story panel at the right and the card at the left) and, on a phone while a story is open, under the cog.
- Browser step `journey-look-out.mjs` (alone, dev server on scratch port 5199, stopped after): passes at 1280x720 and 375x667. Name tap and line tap select the outline and open its card (desktop; the line point is projected from the camera reading); a tap inside the outline selects nothing and opens no card; Back and Next move between steps; Back off on step 1, Next off on step 3; per-step camera reading, selection (object list value), `sky-trace:<id>` and `sky-selected:<id>` line sets match; leaving a step clears its trace; panel, buttons, site trace control and labels clear of each other at both sizes. New driver functions: `selectedObjectValue`, `pressStoryStep`, `storyStepEnabled`, `storyStepBox`, `waitForOpenStoryPanel`.
- Time: 59 to 62 s run alone (41 s before this step); over the 50 s warn limit. `gate-limits.json` NOT changed; owner to decide (raise, or trim: the step reloads the scene once between the two taps and the story walk costs about 8 s per size).
- Coordinator/planner decision, 2026-11-10 (owner's "no overlaps at 375x667" rule), implemented: a story panel's `select` follows the visitor-tap rule for the card. `App.markOpenPanel` calls `selectWith(id, true)`; the shell's `selectRequest` carries `quiet`, and `AstraeusShell` opens the card only when `pickOpensInfo(phone)` (the tap path's one phone test). Phone: selects (lines, name, `onSelect`) with no card sheet; wide screen: card opens; host `setSelected` unchanged (opens always). Tests: `tests/domStorySteps.test.ts` (phone no card and Next still enabled; wide card opens; host select opens on phone), `tests/domSetup.ts` gained a `selectRequest` option. README, CHANGELOG, Design "Sky stories" and BROWSER_CHECKS updated. Browser step: the close-the-card workaround is gone; it asserts no card on the phone, the card beside (not over) the panel on desktop, and Back and Next topmost at their centres (`storyStepReachable`) at steps 1 to 3. It also showed the site trace control collided with the desktop card, so it moved (above).
- Re-run after the fix, repo root: lint clean, typecheck clean, build ok, `npm test` 245 files / 3646 passed / 2 skipped, `check:pack` pass, `check:node-consumer` pass; look-out step passes alone on port 5199 in 62 s (limit 50 s, unchanged, owner decides).
- Design.md reconciled from every drift note of this Objective's steps (each reflected or marked non-architectural with a reason), extending the "Sky figures" paragraph and the story description.
- The owner's look is recorded (`owner_validation`).

## Context Files

`packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, `packages/astraeus-site/src/skyTraceControl.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/journey-look-out.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; the sky view, O-064).

## Guardrails

ARCH-01, ARCH-03, API-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm steps 1 to 3 landed; return REPLAN REQUIRED if not.
2. Extend the made-up scene with cards and three steps.
3. Extend the browser step; run it focused; hand off without a full browser run.
4. Reconcile Design from the drift notes.
5. Leave owner validation pending for the coordinator to arrange the look.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue or an owner-directed change); no constellation data; no Orion example (O-067).

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the focused browser step only; `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the builder session (2026-11-10). Extra reads beyond Context Files: T-299..T-301 evidence and drift notes (brief); `packages/astraeus/src/api/cameraRequest.ts`, `src/api/story.ts`, `src/shell/AstraeusShell.tsx` (pickObject, selectRequest), `src/shell/style.css` (story panel rules), `src/shell/StoryPanelView.tsx`, `tools/validate/driver-guard.mjs` (the guard failed my first direct `page.locator` use), `tools/validate/harness.mjs`; reasons: action shapes, why a phone step's card covers the story buttons, panel geometry, the driver rule.

- Scene: `syntheticLookOutScene.ts` gives Lantern and Kettle cards (description, two made-up facts, illustrative provenance, a source) and `LOOKOUT_STORY`: three steps (hold the opening view; turn to Lantern at 40 degrees, select, trace; turn to Kettle likewise). Every camera names `earth`, so a step turns the view from an orbit view too (the browser step presses Focus on Earth first and Next must bring the sky view back). Site trace control kept working; it now sits at the right foot above the timeline on desktop (it overlapped the story panel at the right and the card at the left) and, on a phone while a story is open, under the cog.
- Browser step `journey-look-out.mjs` (alone, dev server on scratch port 5199, stopped after): passes at 1280x720 and 375x667. Name tap and line tap select the outline and open its card (desktop; the line point is projected from the camera reading); a tap inside the outline selects nothing and opens no card; Back and Next move between steps; Back off on step 1, Next off on step 3; per-step camera reading, selection (object list value), `sky-trace:<id>` and `sky-selected:<id>` line sets match; leaving a step clears its trace; panel, buttons, site trace control and labels clear of each other at both sizes. New driver functions: `selectedObjectValue`, `pressStoryStep`, `storyStepEnabled`, `storyStepBox`, `waitForOpenStoryPanel`.
- Time: 59 to 62 s run alone (41 s before this step); over the 50 s warn limit. `gate-limits.json` NOT changed; owner to decide (raise, or trim: the step reloads the scene once between the two taps and the story walk costs about 8 s per size).
- Finding (not fixed, engine): on a phone a step's `select` opens the figure's card (host select opens the card on every screen, `selectRequest` in `AstraeusShell`), and the card sheet lies over the story panel's Back and Next (measured true at steps 2 and 3; false on desktop). The step closes the card before pressing; a visitor must close it too. Owner to decide whether it is an Issue or a design change.
- Design.md reconciled (see Drift Notes); `docs/architecture/demo-contracts.md` story-panel entry extended; `docs/BROWSER_CHECKS.md` look-out entry and time table updated.
- Hand-off gates from the repo root after the last change: `npm run lint` clean, `npm run typecheck` clean, `npm run build` ok, `npm test` 245 files / 3643 passed, 2 skipped. No check:pack or node-consumer run (no package change). Task Check waived by the owner.
- Owner look: pending (see User Check). On `localhost:5490` open `app.html?experience=synthetic-lookout` (dev server only).

## Drift Notes

Design reconciliation of every drift note of T-299 to T-302 (all in `.savepoint/Design.md`, "Sky figures" item (10) and the new "Sky stories" paragraph unless said):
- T-299 `ExperienceConfig.skyFigures` card words and the shared selection id: reflected, Sky figures (10). `ViewerControl.skyFigures` widened and `setSelected` validation: reflected, (10). Tap path closure and 16 px margin (and the coordinator's `projectSegmentClipped` fix): reflected, (10). `SkyFiguresView.place` selected id, `SceneLabelLayer` colour cache, look `skyLines.selected`: reflected, (10). Deferred selection sentence: done, (10).
- T-300 `StoryPanelSet.steps`, optional `at`, `neighbourStep`: reflected, Sky stories (1). Opening rule for the first step (and the mixed-case and closed-story gaps): reflected, (1). Handle `panel`/`setPanel`/`onPanel`, `ViewerPanels`, `publishPanel`: reflected, (2). Optional `StoryMarkerSpec.timeUtcMs`: reflected, (1). Shell `useStoryPanels`/`StepNav` and the complexity split: step nav reflected, (1); the complexity split into two small functions is non-architectural (a lint measure, no behaviour). Deferred demo-contracts paragraph: done in `docs/architecture/demo-contracts.md`.
- T-301 optional look-out `direction`: reflected, (4). Panel actions on `StoryPanel`/`StoryStep`, applied by the app, `actedPanel`: reflected, (3). `onTurnToFigure`: reflected, (5). `cameraRequest.ts` and `traceOptionsOf`: reflected, (3). Clearing on leave cannot tell a host re-trace: reflected, (3). Design reconciliation deferral: done.
- T-302 (this step): site-only changes (scene cards and story, trace control position, browser step): reflected in Sky stories (6); the trace control's new position is site layout, non-architectural beyond that mention. The phone card-over-story finding is recorded in Sky stories (6) as a known gap.

Owner validation 2026-11-10 (coordinator session o066-run-20261110): on localhost:5490 the owner said "looks ok, raise to 75 s". The look-out step's warn limit in `tools/gate-limits.json` raised 50 -> 75 s on that instruction (measured 62 s alone); `docs/BROWSER_CHECKS.md` row updated. The owner did not ask for a visitor control to reopen a closed steps-only story (recorded as a limit in Design "Sky stories"). Coordinator marks T-302 done under the standing run rules.
