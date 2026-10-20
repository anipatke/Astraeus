---
id: T-109
title: Prove tap-to-focus in the browser checks and update the design notes
objective: O-022
status: planned
depends_on: [{task: T-107, requires: clear}, {task: T-108, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o022-planning-20261020}
planned_writes: [tools/validate/driver.mjs, tools/validate/driver.d.mts, tools/validate/browser-tap-focus.mjs, tools/validate/run-full.sh, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
---

# Prove tap-to-focus in the browser checks and update the design notes

## Outcome

Headless browser checks, through the shared driver only, prove on desktop and phone that a tap or click on a body or its name tag focuses it and updates the picker, that a drag or pinch selects nothing, that non-targets do nothing, and that laptop hover shows the pointer. The full run includes the new script, and Design describes tap-to-focus as built. The owner then looks on the preview.

## User Check

Run `node tools/validate/browser-tap-focus.mjs` (with `PLAYWRIGHT_CORE` set as in AGENTS.md): it passes with zero console errors and prints each scenario. Then on `localhost:5490` try tapping and dragging in Apollo 11, Showers and Jupiter, at laptop and phone size, and say whether it feels right.

## Done When

1. New driver functions (one per user action and readout), for example `tapBody(page, id)` and `tapLabel(page, id)` placing the pointer from the scene's own readouts (`data-body-screen`, label boxes via `[data-label-id]`), `dragAcross(page, id)`, `pinchAt`, `pickTarget(page)` (`data-pick-target`) and `pickHover(page)` (`data-pick-hover`). Scripts call only the driver; `tests/browserDriverGuard.test.ts` passes.
2. `tools/validate/browser-tap-focus.mjs` asserts at 1280x720 (mouse) and 375x667 (touch): body tap focuses and the picker shows it; label tap focuses; a small Jupiter set moon focuses on the first tap; drag and pinch leave selection unchanged; a spacecraft or empty-space tap changes nothing; the information sheet stays shut; mouse hover sets `data-pick-hover` and touch does not. It runs on at least two demos at both scales, so it is not one experience passing (ARCH-03 in spirit; contract-level proof stays in the first step's unit tests). No screenshots.
3. `tools/validate/run-full.sh` lists the new area script; `docs/BROWSER_CHECKS.md` maps each scenario to its assertion, and maps O-025's two-tap body-set scenario (in `browser-moon-panel.mjs` or wherever it lives) to its new one-tap assertion (Browser regression maintenance rule).
4. Design reconciliation: every drift note from T-107 and T-108 is reflected in `.savepoint/Design.md` (picking module, pick callback, tap rule, readouts, hover setting) or marked non-architectural with a reason.
5. Gates: `npm run typecheck`, `npm run build`, `npm test`; lite check, `browser-tap-focus.mjs` and `browser-moon-panel.mjs` pass with zero console errors. One browser job at a time.
6. Owner look on the preview is recorded after the browser evidence.

## Context Files

`tools/validate/driver.mjs`, `tools/validate/driver.d.mts`, `tools/validate/driver-guard.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-lite.mjs`, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, `src/app/scenePicking.ts`, `.savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/tasks/T-107-tap-a-planet-moon-or-the-sun-to-fly-to-it.md`, `.savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/tasks/T-108-show-a-pointing-hand-and-brighter-name-on-laptop-hover.md`.

## Design References

Design: "Shell layout (O-020)" (Browser driver); AGENTS.md project rules on browser checks, the shared driver, regression maintenance and deferred Design reconciliation.

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Read the drift notes of T-107 and T-108.
2. Add driver functions reading the scene's readouts; no selectors outside the driver.
3. Write `browser-tap-focus.mjs`; update the moon-panel mapping for one-tap set members.
4. Add the script to the full run and map scenarios in `docs/BROWSER_CHECKS.md`.
5. Reconcile Design; run gates and the browser scripts one at a time; ask the owner for the preview look.

## Boundaries

No change to tap or hover behaviour (return REPLAN REQUIRED or file an Issue for a defect found); no screenshots or picture comparisons; no full `run-full.sh` unless the owner asks (Full Objective Check runs touched areas).

## Technical Verification

Configured gates, lite check, the new area script and the moon-panel script. The Full Objective Check runs the lite check, the public-build licence gate and the touched areas' scripts (controls/tap-focus, moon panel), evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This step is the O-022 integration and Design reconciliation Task.
