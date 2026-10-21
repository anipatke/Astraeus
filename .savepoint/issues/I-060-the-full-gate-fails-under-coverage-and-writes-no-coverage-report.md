---
id: I-060
title: The full gate fails under coverage and writes no coverage report
type: defect
status: open
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-122]
checks: [C-094]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
---

# I-060: The full gate fails under coverage and writes no coverage report

## Summary

`npm run test:full` (O-037's named full gate) exits 1 in both runs of this Check: `tests/compositions.test.ts` > "State is untouched by how a scene presents it (design E step 3) > (i) is byte-identical for every body, time and centre..." times out at Vitest's default 5000 ms (5.51 s and 5.29 s under coverage with all 92 files in parallel; it passes alone, with and without coverage, and in the fast `npm test`). Because a test failed and `coverage.reportOnFailure` is not set in `vite.config.ts`, no `coverage/coverage-final.json` is written, so the official snapshot has no coverage instance (`absent`, `unknown`). Success Conditions 2 and 8 are unmet: the full gate does not pass and coverage is not fresh.

## Evidence

C-094: run 1 2026-10-21T10:48:16Z, 59.5 s, 1 failed / 1281 passed / 1 skipped; rerun once as a likely timing fault 2026-10-21T10:49:32Z, 57.8 s, same single failure. `ls coverage/coverage-final.json`: absent after both. Snapshot sha256:ec881d17... coverage: "no report at coverage/coverage-final.json". T-122 never ran `npm run test:full` (deferred to this Check), so the gate was first exercised here.

## Proof Needed

`npm run test:full` exits 0 twice in a row on this machine and writes `coverage/coverage-final.json`; the next official `savepoint health check O-037` records a fresh coverage instance and its figure. Decide whether to give the slow test (or the coverage run) a larger timeout and whether to set `coverage.reportOnFailure`, without hiding a real failure.
