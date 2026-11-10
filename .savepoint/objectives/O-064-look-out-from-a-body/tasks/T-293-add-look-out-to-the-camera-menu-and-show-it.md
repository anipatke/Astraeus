---
id: T-293
title: Add Look out to the camera menu and show it
objective: O-064
status: planned
depends_on: [{task: T-292, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-293, reason: 'Owner said "orchestrate o64" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o064-run-20261110}, recorded_at: '2026-11-10T01:37:08Z'}
planned_by: {role: planner, session: o064-planning-20261110}
---

# Add Look out to the camera menu and show it

## Outcome

A visitor can choose "Look out from <body>" in the camera menu for the bodies a scene lists, look around the sky, and choose any other camera entry to go back; a made-up scene on the dev page shows it for the owner's look, the browser check covers it, and Design describes the sky view as built.

## User Check

On `localhost:5490`, open the made-up sky scene at desktop and phone sizes: the scene opens looking out from Earth; drag to pan and pinch or scroll to zoom; the menu offers Look out from Earth and from Mars and nothing overlaps; choosing Focus or Overview returns to the normal view; the share link reopens the sky view.

## Done When

- `scene.camera` gains a list of bodies whose "Look out from" entry the camera menu offers (default none; a body not added throws `unknown-body`); the entries sit with Focus and Follow and work on the bar and the phone drawer; Focus, Follow, Overview and an orbit `setCamera` leave the sky view. Tests in the shell's DOM suite (`tests/cameraAndNamesDom.test.ts` or a new file) on made-up scenes.
- Phone first: no collisions at 375x667 and 1280x720 (fast-suite layout check plus the browser readout).
- A made-up site scene in `packages/astraeus-site/src/synthetic/` built on the public API opens looking out from Earth with Earth and Mars listed; `docs/BROWSER_CHECKS.md` maps the new browser readout; the smoke step (or `check-hello-scene.mjs`) reads through `driver.mjs` that the camera is in the sky view, the stood-in body is not drawn and the menu entry works; no screenshot.
- Design reconciled: each drift note from the three O-064 steps reflected in `.savepoint/Design.md` (Interfaces and Data Flow, Components/Codebase Map) or recorded as non-architectural with a reason, before the Full Objective Check.
- Owner looked on the preview and recorded the result.

## Context Files

`packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/shell/viewCamera.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/tests/cameraAndNamesDom.test.ts`, `packages/astraeus-site/src/synthetic/syntheticViewsScene.ts` (as the pattern for a made-up scene), `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `.savepoint/Design.md`, `.savepoint/objectives/O-064-look-out-from-a-body/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Views of one scene, O-051; The planets demo and the site on the public way, O-059) and `Components/Codebase Map`.

## Guardrails

API-01, API-02, API-06, ARCH-01, ARCH-03, ARCH-06, STYLE-05, STYLE-09, TEST-01, TEST-03.

## Implementation Plan

1. Confirm the public look-out target from the previous step; return REPLAN REQUIRED if absent.
2. Add the menu-choice list to `scene.camera` and the presets builder; show the entries in the bar and phone drawer.
3. Add DOM tests on made-up scenes, including leaving the sky view by each entry.
4. Add the made-up site scene and the browser readout through the driver; map it in `docs/BROWSER_CHECKS.md`.
5. Reconcile Design from all O-064 drift notes.
6. Run the hand-off gates; leave the one browser run to the Full Objective Check; hand the owner the preview address for the look.

## Boundaries

No sky lines, figures or labels; no Sun or Moon glow change; no horizon; no change to existing scenes' menus.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the browser scripts change, so the new readout may be run once alone while building (browser policy); `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any further deltas here; this step reconciles all O-064 notes into Design.
