---
id: T-340
title: Measure the package and show the tile and chart to the owner
objective: O-081
status: planned
depends_on: [{task: T-339, requires: clear}]
check_waiver: {task: T-340, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Measure the package and show the tile and chart to the owner

## Outcome

The package sizes are measured with both parts in, the design notes describe what was built, and the owner has looked at the tile and chart on the Parts page at phone and desktop sizes before the Full Objective Check.

## User Check

The owner opens `localhost:5490/components.html` at phone and desktop sizes, runs the chart and tile examples, and says whether they look right.

## Done When

The "Sizes" and "Owner look" O-081 Success Conditions hold: engine pack (`node tools/check-packs.mjs`) and API pages (main and `api/shelf.html`) measured against their limits and recorded; any red goes to the owner with measured options and the owner's choice is recorded in the Objective before the Full Check. Every Drift Note from the three earlier Tasks is reflected in `docs/architecture/viewer-interface.md` (sections 2, 5, 7, 11) and `.savepoint/Design.md` "Viewer interface", or marked non-architectural with a reason. The owner's look is recorded in the Objective's Decisions; anything they ask to change is done or captured before the Full Check. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- T-337, T-338 and T-339 `Technical Evidence` and `Drift Notes`
- `docs/architecture/viewer-interface.md` under `2. Screen areas`, `5. Panels`, `7. Public interface (O-079, O-080, O-081)`, `11. Story-component shelf`
- `.savepoint/Design.md` under `Viewer interface`
- `tools/check-packs.mjs`
- `docs/agents/build.md`
- `docs/agents/browser-policy.md`

## Design References

Design "Viewer interface", "Size budgets are split".

## Guardrails

TEST-01, STYLE-09.

## Implementation Plan

1. Run the full gates and the pack and API page measures; record numbers against limits.
2. If anything is red, stop and present measured options to the owner (an artifact page), then do what they choose.
3. Reconcile each drift note into the design note and Design.md.
4. Start the site on `localhost:5490` and ask the owner to judge the two entries; record the answer.

## Boundaries

No new behaviour; size fixes only as the owner chooses; no limit raised without the owner.

## Technical Verification

Configured gates; `node tools/check-packs.mjs`; the API page measure as in O-080 T-336. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected; this Task reconciles the others.
