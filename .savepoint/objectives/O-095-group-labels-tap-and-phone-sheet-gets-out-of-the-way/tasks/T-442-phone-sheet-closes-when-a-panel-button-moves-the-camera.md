---
id: T-442
title: Phone sheet closes when a panel button moves the camera
objective: O-095
status: in_progress
stage: audit
depends_on: []
check_waiver: {task: T-442, reason: 'Owner said "Orchestrate O-95" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o095-20261124}, recorded_at: '2026-11-24T05:54:06Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g025-20261122}
planned_reads: [packages/astraeus/src/shelf/actions/View.tsx, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/useShelf.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shell/panels/panelRule.ts, packages/astraeus/src/shell/panels/usePanels.ts, packages/astraeus/tests/panelRule.test.ts]
planned_writes: [packages/astraeus/src/shell/panels/panelRule.ts, packages/astraeus/src/shell/panels/usePanels.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/panelRule.test.ts, packages/astraeus/CHANGELOG.md]
---

# Phone sheet closes when a panel button moves the camera

## Outcome

On a phone, pressing a panel button whose action turns the camera (the belt's "Fly to Ceres") closes the open panel sheet before the camera moves, so the visitor sees the move (belt #27, owner decision 2: always, no option). A button without a camera leaves the sheet open; wide screens are unchanged.

## User Check

Run `npm run preview:owner`; at phone width open a panel with an actions block whose button turns the camera (the shelf catalogue page's actions example, or the belt app on a local build) and press it: the sheet closes and the camera flies. Press a button with no camera: the sheet stays. At desktop width: the panel stays open as today.

## Done When

- The panel rule owns the decision: a shelf camera move (the `moveCamera` path from `ShelfRuntime`, wired in `app/App.tsx` as `moveShelfCamera`) tells the panel rule a camera turn came from a panel; on a phone the rule closes the open panel or sheet; on a wide screen it does nothing. The actions part does not decide or import shell internals.
- `tests/panelRule.test.ts` gains cases that fail before the change: phone + camera-turning press closes; phone + no camera stays; wide stays.
- A browser check at 390x844 (and 1440x900 unchanged) in the existing step that covers sheets on a phone (BROWSER_CHECKS scenario `browser-phone`), per the browser policy.
- CHANGELOG `Fixed` entry in the open 0.11.0 section, saying hosts can drop their own sheet-closing timers.
- Configured gates pass; evidence per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/actions/View.tsx`
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/app/useShelf.ts`
- `packages/astraeus/src/app/App.tsx` (the `shelfCamera` / `moveShelfCamera` wiring only)
- `packages/astraeus/src/shell/panels/panelRule.ts`
- `packages/astraeus/src/shell/panels/usePanels.ts`
- `packages/astraeus/tests/panelRule.test.ts`
- `docs/architecture/viewer-interface.md` (section 11, the shelf contract)
- `docs/BROWSER_CHECKS.md`
- `docs/agents/browser-policy.md`

## Design References

`.savepoint/Design.md` under `Viewer interface`.

## Guardrails

ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Find how the shell knows phone versus wide and how App reaches the panel rule; if the camera path cannot reach the panel rule without a shelf part importing the shell, REPLAN REQUIRED.
2. Write the failing panel-rule cases.
3. Add the rule action and call it from the shelf camera path.
4. Browser check; CHANGELOG.

## Boundaries

No opt-out option, no change to story panels' own camera behaviour, no change on wide screens.

## Technical Verification

Focused `panelRule` tests while iterating; configured build and test gates and the touched browser step at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Done When -> evidence:
| Done When | Evidence |
|---|---|
| Rule owns decision; shelf camera path tells it; actions part unchanged | `cameraTurned` action in panelRule.ts (phone closes left place, wide nothing); `usePanels.cameraTurned`; AstraeusShell wraps `shelfRuntime.moveCamera` (dispatches `cameraTurned`, then the host's move) for the shelf panels and tile. View.tsx not touched. |
| panelRule tests | tests/panelRule.test.ts "a shelf button turns the camera (O-095)": phone closes (shelf, tile; story stays), phone none open, wide stays. Fail before (no `cameraTurned` action; type error / unchanged state). |
| Browser check phone + desktop | journey-catalogue.mjs (step `catalogue`) actions example: no-camera button keeps panel; camera button closes on phone (375x667), stays on desktop (1280x720). `npm run check:browser -- --step catalogue` exit 0, 8 s, docs/evidence/browser-steps-20261124T055616Z. |
| CHANGELOG Fixed | packages/astraeus/CHANGELOG.md 0.11.0 Fixed entry. |
| Gates | prettier + eslint clean on changed files; focused vitest 16 files 273 passed 1 skipped (panelRule, panelPlacementDom, shelfBar, shelfParts, about, apiImports, packageBoundaries, browserDriverGuard etc.). Typecheck: only error was T-443's tests/actionsEnabled.test.ts (not mine). |
Files changed: packages/astraeus/src/shell/panels/panelRule.ts, usePanels.ts, src/shell/AstraeusShell.tsx, tests/panelRule.test.ts, CHANGELOG.md, packages/astraeus-site/tools/validate/driver.mjs, journey-catalogue.mjs, browser-steps.mjs, docs/BROWSER_CHECKS.md.
Limitations: `browser-phone` is a retired script, so the check lives in the `catalogue` step at its existing 375x667 phone size, not 390x844. App.tsx not changed (shell wraps the runtime instead). Extra read: tests list via grep, driver.mjs catalogue helpers.

## Drift Notes

Shell now wraps the shelf runtime's moveCamera to tell the panel rule (`cameraTurned`); note in Design viewer-interface section 11 / panel rule. Deferred: none.
