---
id: T-072
title: Compare before and after, update the design notes and show the owner
objective: O-017
status: planned
depends_on: [{task: T-067, requires: clear}, {task: T-068, requires: clear}, {task: T-069, requires: clear}, {task: T-070, requires: clear}, {task: T-071, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Compare before and after, update the design notes and show the owner

## Outcome

Proof that nothing visible changed, the before-and-after numbers, Design.md reconciled with O-017's deltas, and the owner's short look.

## User Check

Open the comparison page: each real experience and site page at both sizes, before beside after, with any difference flagged and explained. The numbers table shows lines of code, switches, first-load sizes and test times before and after. Then a short look at the public preview.

## Done When

1. After pictures captured with Task 1's tool at the same views and times; an automatic comparison flags any pixel difference above a stated threshold; each flagged difference is explained (for example animated elements) or fixed.
2. Numbers table (O-017 Success Condition 8) completed against Task 1's baseline.
3. Design.md reconciled: every Drift Note from Tasks 2 to 6 reflected or stated as non-architectural with a reason.
4. The full trimmed browser run, configured gates and the public build pass on the final tree, fresh evidence directory.
5. Owner look recorded.

## Context Files

`docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `.savepoint/Design.md`, `tools/validate/capture-site-pictures.mjs`.

## Design References

All of Design.md (reconciliation).

## Guardrails

TEST-01, PROV-01, PROV-02.

## Implementation Plan

1. Capture after pictures; compare.
2. Fill the numbers.
3. Reconcile Design.
4. Owner look.

## Boundaries

No code changes except fixes for flagged differences.

## Technical Verification

Full gate fresh. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
