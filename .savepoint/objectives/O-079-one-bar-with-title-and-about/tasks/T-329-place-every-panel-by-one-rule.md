---
id: T-329
title: Place every panel by one rule
objective: O-079
status: planned
depends_on: [{task: T-330, requires: clear}]
check_waiver: {task: T-329, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Place every panel by one rule

## Outcome

One owner decides which panel holds which screen area and what opening one closes; every existing panel, card, sheet and drawer (object, event and window cards, story panels, moons sheet, switch panel, scale explanation, controls drawer, developer drawer, panel load boundary) sits in its area, is placed through it and styled only from the look settings, rebuilt where the note says, and today's scattered close rules and old panel styles are gone.

## User Check

On desktop and phone, open the object card, an event card, a story panel, the moons sheet, the switch panel, the scale explanation and the drawers in turn: each appears where it did (or where the decision note says it now goes), and opening one closes exactly the ones the note's close table says.

## Done When

The note's place model and close-rule table are implemented as one pure, unit-tested decision (every row of the table a named case, desktop and phone) plus one shell hook or component that applies it; every panel listed in the note uses it; every rule in the note's inventory is removed or shown to be the new rule; existing panel tests pass unchanged except where the note records a deliberate change (each such change named in evidence); two viewers keep separate state (API-03). Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/InfoPanel.tsx`
- `packages/astraeus/src/shell/StoryPanelView.tsx`
- `packages/astraeus/src/shell/useStoryPanels.ts`
- `packages/astraeus/src/shell/useDrawers.ts`
- `packages/astraeus/src/shell/DisplaySwitches.tsx`
- `packages/astraeus/src/shell/ScaleControl.tsx`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/MoonFamilyPanel.tsx`
- `packages/astraeus/src/shell/ControlsDrawer.tsx`
- `packages/astraeus/src/app/DeveloperSettings.tsx`
- `packages/astraeus/src/app/developerPanels.tsx`
- `packages/astraeus/src/app/PanelLoadBoundary.tsx`
- `packages/astraeus/src/app/FeatureMarkers.ts`

## Design References

Design "Good guest" (scoped keys, ids, styles), "Host-page behaviour" (phone sheet and timeline space); the decision note.

## Guardrails

ARCH-01, ARCH-02, API-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Write the pure place decision from the note (state of open panels plus a request → new state) with a test per close-table row.
2. Add the shell hook that holds the open-panel state and applies the decision; route each panel's open and close through it.
3. Remove each inventoried rule as its panel moves; keep behaviour, except the note's listed changes.
4. Run the existing panel, phone and story tests; update only where the note records a change, naming each.
5. Add the API-03 two-viewer case.

## Boundaries

No About (next Task), no host panels or tile (O-080, O-081), no public API change, no version bump. Return REPLAN REQUIRED if a panel cannot follow the note without a product change.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and the phone browser journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation in T-327.
