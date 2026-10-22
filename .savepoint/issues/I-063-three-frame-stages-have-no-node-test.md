---
id: I-063
title: Three frame stages have no node test
type: verification
status: resolved
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-124]
checks: [C-094, C-095]
guardrail_ids: [CODE-02, TEST-01]
resolution:
  disposition: accepted
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-22T10:55:00Z'
  reason: 'Owner, 2026-10-22: "yes record it, then close the tidy-up" after C-095 (code repairs proven; browser proof replaced by the owner''s preview look; runner complexity left for O-038). Recorded by the agent on direct instruction; not a technical CLEAR.'
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-22T20:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: repair_attempted
    note: 'T-129: tests/sceneFrame.test.ts now tests syncViews (family colour on an owned orbit path, live look, default look), publishCanvasReadouts (sky only with a sky view, probe only in developer mode) and placeViews (hover gain clamp passed to name layers, path views placed about the origin).'
  - at: '2026-10-22T10:30:00Z'
    actor: {role: checker, session: o037-full-recheck-20261022}
    kind: rechecked
    check: C-095
    note: 'C-095 recheck: syncViews, publishCanvasReadouts and placeViews now have node tests (tests/sceneFrame.test.ts:167-228); all eight stages covered; full gate green. Repair proven; not closed as verified because C-095 is NEEDS WORK on owner-held items.'
  - at: '2026-10-22T10:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: owner_decision
    note: 'Resolved as accepted on the owner''s instruction "yes record it, then close the tidy-up".'
---

# I-063: Three frame stages have no node test

## Summary

T-124 Done When 4 and Success Condition 4 ask for each stage in `src/app/sceneFrame.ts` to have a node test, and Guardrails CODE-02 now says the same. `tests/sceneFrame.test.ts` calls `frameTime`, `placeScene`, `stepAndPoseCamera`, `updateOverlays` and `placeLightsAndReadout`, but not `syncViews`, `publishCanvasReadouts`, `placeViews` (or `runFrame`). A scoped coverage run over the four new test files gives `sceneFrame.ts` 42% of statements, with lines 177-218 and 248-255 uncovered; `scenePointer.ts` 0%.

## Evidence

C-094: `grep` over `tests/sceneFrame.test.ts` for stage calls; `npx vitest run --coverage` (scratch report directory) over `tests/sceneFrame.test.ts`, `sceneCamera`, `sceneTargets`, `sceneBodies` test files: 32 pass; sceneBodies 100%, sceneCamera 91.7% statements.

## Proof Needed

Node tests for `syncViews`, `publishCanvasReadouts` and `placeViews` with fakes, each proving one order- or state-sensitive fact (for example the family colour set on an owned orbit path, the sky update only with a sky view, the hover gain clamp).
