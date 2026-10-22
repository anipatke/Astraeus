---
id: T-137
title: Owner walk-through on the preview and design notes brought up to date
objective: O-039
status: planned
check_waiver:
  task: T-137
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: [{task: T-131, requires: clear}, {task: T-132, requires: clear}, {task: T-133, requires: clear}, {task: T-134, requires: clear}, {task: T-135, requires: clear}, {task: T-136, requires: clear}, {task: T-138, requires: clear}, {task: T-139, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
planned_reads: [.savepoint/Design.md, docs/DONOR_PROVENANCE.md, AGENTS.md]
planned_writes: [.savepoint/Design.md, docs/DONOR_PROVENANCE.md, AGENTS.md]
---

# Owner walk-through on the preview and design notes brought up to date

## Outcome

Every drift note from this Objective's steps is reflected in Design.md (or marked non-architectural with a reason), the donor provenance record is complete, and the owner has looked over all repairs together on the preview and recorded one verdict, ready for the Full Objective Check.

## User Check

Walk the preview: Venus, Iapetus, Titan, Ganymede, the Pluto view, a place card on phone and desktop sizes, the "Illuminate all" switch, and a public build's Jupiter-only planets demo. Give one verdict.

## Done When

- Each earlier step's Drift Notes is accounted for in Design.md (texture variant, emissive, map turns and the Titan conversion rule, orbit line centre, card structure, illuminate-all setting, public planet list) or marked non-architectural with a reason.
- `docs/DONOR_PROVENANCE.md` covers Venus, the turns and the cards.
- AGENTS.md Codebase Map is updated only if a module's purpose changed.
- `npm run test:full` passes fresh, with its time recorded; configured gates pass. No browser sets (owner decision 6) unless the owner asks.
- The owner's walk-through verdict is recorded.

## Context Files

`.savepoint/Design.md`, `docs/DONOR_PROVENANCE.md`, `AGENTS.md`, plus each earlier O-039 step's Technical Evidence and Drift Notes.

## Design References

All Design sections touched by the earlier steps.

## Guardrails

STYLE-07, STYLE-10; Astraeus Project Rules (Deferred Design reconciliation).

## Implementation Plan

1. Collect every Drift Note from the earlier steps.
2. Reconcile Design.md and the provenance record.
3. Run the full gate once.
4. Hold the owner walk-through and record the verdict.

## Boundaries

Documentation and the walk-through only; a defect found here becomes a fix in its owning step or an Issue, not new scope.

## Technical Verification

Full gate `npm run test:full` fresh; owner's look. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
