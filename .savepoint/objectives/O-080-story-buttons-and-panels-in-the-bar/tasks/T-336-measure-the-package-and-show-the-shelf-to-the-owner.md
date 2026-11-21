---
id: T-336
objective: O-080
title: Measure the package and show the shelf to the owner
status: planned
depends_on: [{task: T-335, requires: clear}]
check_waiver: {task: T-336, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Measure the package and show the shelf to the owner

## Outcome

The engine pack and API reference page are measured against their limits with the shelf in, and any red goes to the owner with measured options; Design.md is reconciled from this Objective's drift notes; the owner has looked at the catalogue page on the preview.

## User Check

The owner reads the size numbers (before O-080 and now, per limit, with options if over) and decides; the owner opens `localhost:5490/components.html` at phone and desktop sizes and runs each example.

## Done When

"Sizes" and "Owner look" O-080 Success Conditions hold: measurements recorded (engine unpacked bytes, API page raw and gzip, first-open example size) with each part's share where a limit is red; the owner's size decision quoted in the Objective's Decisions; `.savepoint/Design.md` "Viewer interface" (and the codebase map) describe the shelf as built, each drift note accounted for; configured gates plus `check:engine-alone`, `check:pack` and the split check green, or a red the owner has accepted by name. Owner validation recorded against the Full Objective Check's id. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-333-let-a-story-add-its-own-bar-buttons-and-custom-panels.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-334-put-the-first-ready-made-story-components-on-the-shelf.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-335-show-every-shelf-component-on-a-public-catalogue-page.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-332-clear-out-leftover-interface-code-and-measure-the-package.md` under `Technical Evidence` (how the sizes were measured)
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/Design.md` under `Components/Codebase Map`
- `.savepoint/Design.md` under `Size budgets are split`
- `tools/check-packs.mjs`
- `packages/astraeus-site/tools/validate/load-budget.mjs`
- `docs/agents/build.md`

## Design References

Design "Viewer interface", "Components/Codebase Map", "Size budgets are split".

## Guardrails

TEST-01, TEST-03.

## Implementation Plan

1. Run the size measurements as T-332 did; attribute growth per part if a limit is red.
2. If red: list options with their measured effect (for example trimming doc text, sharing part CSS, a limit change) and bring them to the owner; apply only what the owner picks.
3. Reconcile Design from each drift note (reflected, or non-architectural with a reason).
4. Restart the :5490 preview; ask the owner to look; record their words.

## Boundaries

No new parts, no limit change without the owner's choice, no version bump or publishing.

## Technical Verification

Configured gates plus `check:engine-alone`, `check:pack` and the split check at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected; this Task reconciles the others.
