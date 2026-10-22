---
id: I-061
title: The public build load budget fails on the new settings-fields chunk
type: defect
status: open
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-125]
checks: [C-094, C-095]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-22T20:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: repair_attempted
    note: 'T-129: tools/validate/load-budget.mjs now lists settingsFields.js in the planet page sets and SHOWER_COMMON, and in SPLIT_CHUNKS. A fresh public build in scratch (ASTRAEUS_PUBLIC_BUILD=1 vite build, node only) passes node tools/validate/load-budget.mjs with exit 0; tests/publicBuild.test.ts gained a case that holds the listing. The public-build-assets engine step was not rerun.'
  - at: '2026-10-22T10:30:00Z'
    actor: {role: checker, session: o037-full-recheck-20261022}
    kind: rechecked
    check: C-095
    note: 'C-095 recheck: scratch public build /tmp/c-o037-public-wzLl/dist passes node tools/validate/load-budget.mjs (exit 0); the pre-repair script (a115b693) fails jupiter, saturn and uranus on the same build. Repair proven; not closed as verified because C-095 is NEEDS WORK on owner-held items.'
---

# I-061: The public build load budget fails on the new settings-fields chunk

## Summary

T-125 moved the shared settings reader into `src/experiences/settingsFields.ts`. In the public build it becomes its own chunk (`assets/settingsFields-*.js`), imported by `planetSettings-*.js`, and the load-budget page sets in `tools/validate/load-budget.mjs` (lines 20 and 25: `SHOWER_COMMON` and the planet page `files` lists) do not list it. The engine set's `public-build-assets` step therefore fails for every planets page (and likely the showers pages): "assets/planetSettings-fiUeOOL6.js imports assets/settingsFields-Cmda3yGy.js, which the page set does not list". Success Condition 5 (check sets exit 0) is unmet, and the published-site budget check is red.

## Evidence

C-094: `npm run check:engine` 2026-10-21T10:51:33Z to 10:56:05Z, 272 s: 15 of 16 steps exit 0 with zero error lines; `public-build-assets` exit 1. Evidence `docs/evidence/engine-20261021T105133Z/summary.txt`; log `/tmp/astraeus-check-logs-nNaELl/public-build-assets.log` (11 such problems, `loadBudget.ok: false`). Not rerun: the cause is deterministic (chunk graph), not timing.

## Proof Needed

`public-build-assets` passes on a fresh public build with the new chunk accounted for in the page sets (or the chunk folded back), and `tests/publicBuild.test.ts` or the step proves it; the engine set's next run (at the recheck, if the owner allows it) exits 0.
