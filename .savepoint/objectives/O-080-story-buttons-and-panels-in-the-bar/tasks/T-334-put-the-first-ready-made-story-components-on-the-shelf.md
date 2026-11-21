---
id: T-334
objective: O-080
title: Put the first ready-made story components on the shelf
status: planned
depends_on: [{task: T-333, requires: clear}]
check_waiver: {task: T-334, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Put the first ready-made story components on the shelf

## Outcome

Four content parts an app fills with its own words and numbers, each its own import: `explainer` (heading, paragraphs, notes; `setParagraphs`), `actions` (labelled buttons, an optional camera move; `onAction`), `filterChips` (one or several, light up straight away and report; `selected`, `setSelected`, `setChoices`, `onSelect`) and `colourKey` (swatches, labels, counts, notes; `setEntries`). A new check proves an app importing one part does not download the others.

## User Check

A synthetic panel holding all four: chips light up on a press and the host hears the values with cause `visitor`; `setSelected` changes them silently; an action with a camera moves the camera as a story panel's does; `setParagraphs` and `setEntries` change the panel while it is open. `node tools/check-shelf-split.mjs` passes, and fails when a second part is imported.

## Done When

The "First set" (content parts), "Shared look" and "Pick by import" O-080 Success Conditions hold, with named tests per part on both embedding paths, a synthetic scene (ARCH-03), `bad-part` shape cases per factory, keyboard use of chips and actions, and the split check wired into the project's gate tooling (named in `docs/agents/build.md` if it becomes a gate). If Vite keeps unused part CSS, use the note's fallback (part CSS in the shared sheet) and record it with the measured bytes. README, CHANGELOG, doc comments with `@shelf`, `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `docs/architecture/viewer-interface.md` under `10. Shared look`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-333-let-a-story-add-its-own-bar-buttons-and-custom-panels.md` under `Technical Evidence` (the shelf files it created; read those it names for the part pattern)
- `packages/astraeus/src/api/story.ts`
- `packages/astraeus/src/api/cameraRequest.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/look/look.css`
- `packages/astraeus/package.json`
- `tools/measure-example.mjs`
- `docs/agents/build.md`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "Public API shape (G-016, owner 2026-11-01)", "Size budgets are split".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the previous Task's descriptor, `addParts` and `handle.part` exist; return REPLAN REQUIRED if not.
2. One module tree per part under `src/shelf/`, following the panel's pattern; factories checked at the call.
3. Chips: single or multiple, deselectable, optional colour; press updates and reports; setters silent.
4. Actions: camera input checked as story panels check theirs, through the same camera request path.
5. Add `tools/check-shelf-split.mjs` beside `tools/measure-example.mjs` (example importing only `filterChips`; fail on any other part's marker class in emitted JS or CSS); apply the CSS fallback only if needed.
6. Tests, README, CHANGELOG, api errors and lock.

## Boundaries

No catalogue page, no readout tile or chart, no changes to the bar or panel rules beyond what a part needs, no site demo changes.

## Technical Verification

Focused tests during iteration; configured gates plus the new split check at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for the planner.
