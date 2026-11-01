---
id: I-135
title: The API rule scans time out under the full gate after the scene split
type: defect
status: open
source:
  kind: check
  check: C-139
  actor: {role: checker, session: o058-check-20261101}
  at: '2026-11-01T07:58:00Z'
tasks: [T-239]
checks: [C-139]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-01T07:58:00Z'
    actor: {role: checker, session: o058-check-20261101}
    kind: observed
    note: 'Found by the O-058 Full Objective Check (C-139). npm run test:full failed twice in a row on 1d729c02 (07:37:20-07:38:36Z and 07:39:50-07:41:04Z), both times on apiRules.test.ts > settings mapping (API-06) > gives every setting ... (5.56 s and 5.97 s against the 5 s default). No coverage/coverage-final.json was written. The T-239 builder''s first run failed the same way. Same class as I-072, I-080 and I-083.'
    check: C-139
---

# I-135: The API rule scans time out under the full gate after the scene split

## Summary

O-058 Success Condition 6 and T-239 need `npm run test:full` to pass, and the Full Objective Check needs a current green full gate. On the O-058 tree it does not pass reliably. One API rule test goes over Vitest's 5 s local limit (`testTimeout: process.env.CI ? 30_000 : 5_000`, `vitest.config.ts:13`): the settings-mapping case (API-06). A second case (API-05 throw scan) sits just under the limit.

The cause is partly O-058. Each case builds a TypeScript program over source folders the split made larger. `errorBreaks()` reads `src/api/`, which went from 18 to 30 files. `addressParameters()` reads all of `src/`, which went from 214 to 228 files. Measured alone, with main and HEAD alternating and the median of five runs, the scans got slower: `errorBreaks` 236 ms on main and 392 ms on HEAD, `addressParameters` 319 ms on main and 469 ms on HEAD. Under the full suite with coverage the cases take about 12 times as long, which puts them over the limit. The O-053 check C-138 passed `test:full` at 06:20Z today on the tree before the split.

## Evidence

- Run 1 (checker, 07:37:20-07:38:36Z, `npm run test:full`, load average about 4 on 16 cores): `Test Files 1 failed | 185 passed (186)`, `Tests 1 failed | 2257 passed | 1 skipped (2259)`. `FAIL packages/astraeus-site/tests/apiRules.test.ts > settings mapping (API-06) > gives every setting the viewer reads from the page address a public setting key, beyond the address-only allowlist`, `Error: Test timed out in 5000ms.` at `apiRules.test.ts:164:3`. In `junit.xml` that case took 5.558 s, and `errors (API-05) > throws only SceneError from src/api/ ...` (line 101) took 4.442 s.
- Run 2 (checker, 07:39:50-07:41:04Z): the same single failure. The cases took 5.973 s and 4.171 s. No `coverage/coverage-final.json` was written.
- T-239 Technical Evidence: the builder's first run failed 3 tests (2 apiRules timeouts and the showers frame-timing case), and a second run passed.
- Timing probe (checker scratchpad `timescan2.mjs`; it imports `errorBreaks` and `addressParameters` from `tools/api-rules.mjs` and runs them on HEAD's `packages/astraeus/src` and on a `git archive main` copy, alternating): `main files(src) 214 api files 18 errorBreaks median ms 236 addressParameters median ms 319`; `HEAD files(src) 228 api files 30 errorBreaks median ms 392 addressParameters median ms 469`.
- Code: `tools/api-rules.mjs:262` `addressParameters` calls `ts.createProgram(allSources(src), OPTIONS)` on every call. The test calls it inside the `it` body at `apiRules.test.ts:165`. `errorBreaks` (`api-rules.mjs:148`) is called the same way at `apiRules.test.ts:102`.

## Proof Needed

- `npm run test:full` passes twice in a row on the repaired tree and writes `coverage/coverage-final.json`. Record each run's apiRules case times from `junit.xml`.
- The fix is strategic (owner, 2026-10-30), not a bigger number for one test. For example, do the heavy whole-source scans once in a `beforeAll` with a stated hook limit, as I-080 did for the API reference test, so a scan's cost does not grow per case as `src/` grows. Also consider whether the same trap in other whole-source scan tests can be caught by a check.
- The API-05 and API-06 checks still fail on their own plants: the made-up-folder cases at `apiRules.test.ts:106` and `:169`.
- `savepoint health check O-058` taken after that full gate does not block clearance.
